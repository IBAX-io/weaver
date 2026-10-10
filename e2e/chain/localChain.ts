/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Local go-ibax networks for the chain tests: a throwaway PostgreSQL cluster, and per network a
// first node that generates the genesis block and every block after it, plus peers that only
// download and check its blocks. Everything lives under one temporary root.
import { ChildProcess, execFile, spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, copyFileSync, rmSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import path from 'node:path';
import { promisify } from 'node:util';
import { ICryptoSuiteId } from 'ibax/crypto';

const run = promisify(execFile);

// CHAIN_E2E_FIPS=<module>: the node is built against that frozen Go Cryptographic Module
// (GOFIPS140: v1.0.0-c2097c7c, the certified one without ML-DSA, or v1.26.0) and every node command
// runs with GODEBUG=fips140=only, where any non-approved primitive fails
export const FIPS_MODULE = process.env.CHAIN_E2E_FIPS || null;
const nodeEnv = FIPS_MODULE ? { ...process.env, GODEBUG: 'fips140=only' } : process.env;

// The suites a node can run: in FIPS mode the approved ones, with ML-DSA only from a module that
// implements it (v1.0.0 does not)
const FIPS_CRYPTOERS = ['ECC_P256', 'MLDSA65', 'MLDSA87'];
const FIPS_HASHERS = ['SHA256', 'SHA384', 'SHA512', 'SHA3_256'];
export const nodeRuns = (suite: ICryptoSuiteId) => !FIPS_MODULE || (
    FIPS_CRYPTOERS.includes(suite.cryptoer) && FIPS_HASHERS.includes(suite.hasher) &&
    !(suite.cryptoer.startsWith('MLDSA') && /^(v1\.0\.|certified$)/.test(FIPS_MODULE))
);

export interface IPostgres {
    bin: string;
    port: number;
}

export interface ILocalNode {
    apiHost: string;
    tcpAddress: string;
    dataDir: string;
    log: string;
    // Founder of the network (first node only)
    privateKey: string;
    keyID: string;
}

export interface ILocalNetwork {
    suite: ICryptoSuiteId;
    networkID: number;
    nodes: ILocalNode[];
    // Stops node i: its API no longer answers
    stopNode(i: number): Promise<void>;
    // (Re)starts node i with its data; with a suite, under that suite's crypto settings from now on
    startNode(i: number, options?: { suite?: ICryptoSuiteId }): Promise<void>;
    // The network starts over under another suite: every node gets a new genesis, database and
    // keys behind the same addresses (a chain does not change its suite in place: a node refuses
    // to start under another suite than its genesis block's)
    redeploy(suite: ICryptoSuiteId): Promise<void>;
    stop(): Promise<void>;
}

const freePort = () => new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
        const { port } = server.address() as { port: number };
        server.close(() => resolve(port));
    });
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const tail = (file: string, lines = 30) => existsSync(file)
    ? readFileSync(file, 'utf8').trimEnd().split('\n').slice(-lines).join('\n')
    : '(no log)';

// PostgreSQL binaries: PG_BIN, otherwise the initdb on PATH
export const findPostgres = async () => {
    if (process.env.PG_BIN) {
        return process.env.PG_BIN;
    }
    try {
        const { stdout } = await run('pg_config', ['--bindir']);
        return stdout.trim();
    }
    catch {
        const { stdout } = await run('sh', ['-c', 'command -v initdb']);
        return path.dirname(stdout.trim());
    }
};

export const startPostgres = async (root: string): Promise<IPostgres & { stop(): Promise<void> }> => {
    const bin = await findPostgres();
    const dataDir = path.join(root, 'postgres');
    const port = await freePort();
    await run(path.join(bin, 'initdb'), ['-D', dataDir, '-U', 'postgres', '--auth=trust', '-E', 'UTF8', '--no-sync']);
    await run(path.join(bin, 'pg_ctl'), [
        '-D', dataDir, '-w', '-l', path.join(root, 'postgres.log'),
        '-o', `-p ${port} -k ${root} -c listen_addresses=127.0.0.1 -c fsync=off -c max_connections=400`,
        'start'
    ]);
    return {
        bin,
        port,
        stop: async () => {
            await run(path.join(bin, 'pg_ctl'), ['-D', dataDir, '-m', 'fast', '-w', 'stop']);
        }
    };
};

// Builds the node from a go-ibax checkout (GO_IBAX_DIR), against FIPS_MODULE if set
export const buildNode = async (goIbaxDir: string, root: string) => {
    const binary = path.join(root, 'go-ibax');
    const env = FIPS_MODULE ? { ...process.env, GOFIPS140: FIPS_MODULE } : process.env;
    await run('go', ['build', '-o', binary, '.'], { cwd: goIbaxDir, env, maxBuffer: 1 << 24 });
    return binary;
};

// Stops every node and Centrifugo still running under root (each writes its pid file there)
export const killLeftovers = (root: string) => {
    if (!existsSync(root)) {
        return;
    }
    for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
        if (entry.isFile() && ['go-ibax.pid', 'centrifugo.pid'].includes(entry.name)) {
            const pid = Number(readFileSync(path.join(entry.parentPath, entry.name), 'utf8').trim());
            try {
                process.kill(pid, 'SIGKILL');
            }
            catch {
                // already gone
            }
        }
    }
};

interface INodeOptions {
    binary: string;
    postgres: IPostgres;
    dir: string;
    database: string;
    suite: ICryptoSuiteId;
    networkID: number;
    bootNodes: string[];
    centrifugo?: ICentrifugoEndpoint;
}

// Configures a node on free ports; it runs once deployed
const configureNode = async (options: INodeOptions): Promise<ILocalNode> => {
    const { binary, postgres, dir, suite, networkID } = options;
    const dataDir = path.join(dir, 'data');
    mkdirSync(dataDir, { recursive: true });
    const [httpPort, tcpPort] = [await freePort(), await freePort()];
    // Without Centrifugo the node still signs its tokens with the secret, and in FIPS mode refuses
    // one under 112 bits, such as the default
    const centrifugo = options.centrifugo
        ? [`--centUrl=${options.centrifugo.url}`, `--centSecret=${options.centrifugo.secret}`, `--centKey=${options.centrifugo.key}`]
        : [`--centSecret=${randomBytes(16).toString('hex')}`];
    await run(binary, ['config',
        `--dataDir=${dataDir}`, `--tempDir=${path.join(dir, 'tmp')}`,
        '--dbHost=127.0.0.1', `--dbPort=${postgres.port}`, `--dbName=${options.database}`, '--dbUser=postgres', '--dbPassword=',
        '--httpHost=127.0.0.1', `--httpPort=${httpPort}`, '--tcpHost=127.0.0.1', `--tcpPort=${tcpPort}`,
        `--networkID=${networkID}`, `--cryptoer=${suite.cryptoer}`, `--hasher=${suite.hasher}`,
        `--bootNodes=${options.bootNodes.join(',')}`, '--logLevel=WARN', ...centrifugo], { cwd: dir, env: nodeEnv });
    return {
        apiHost: `http://127.0.0.1:${httpPort}`,
        tcpAddress: `127.0.0.1:${tcpPort}`,
        dataDir,
        log: path.join(dir, 'node.log'),
        privateKey: '',
        keyID: ''
    };
};

// Gives a stopped node a new chain under its configured suite: an empty database, new keys and the
// genesis block, which the first node (no genesis given) generates and the others take from it.
// The node keeps its addresses; its keys are updated in place
const deployNode = async (binary: string, postgres: IPostgres, database: string, node: ILocalNode, genesis: string | null) => {
    const dir = path.dirname(node.dataDir);
    const config = ['--config', path.join(node.dataDir, 'config.toml')];
    const command = (...args: string[]) => run(binary, args, { cwd: dir, env: nodeEnv });
    const db = ['-h', '127.0.0.1', '-p', String(postgres.port), '-U', 'postgres'];

    await run(path.join(postgres.bin, 'dropdb'), [...db, '--if-exists', '--force', database]);
    await run(path.join(postgres.bin, 'createdb'), [...db, database]);
    rmSync(path.join(dir, 'tmp'), { recursive: true, force: true });
    rmSync(path.join(node.dataDir, '1block'), { force: true });
    await command('generateKeys', ...config);
    if (genesis) {
        copyFileSync(genesis, path.join(node.dataDir, '1block'));
    }
    else {
        await command('generateFirstBlock', '--test=true', ...config);
    }
    await command('initDatabase', ...config);

    const key = (name: string) => readFileSync(path.join(node.dataDir, name), 'utf8').trim();
    node.privateKey = key('PrivateKey');
    node.keyID = key('KeyID');
};

// Starts a configured node with its data as it is, and waits until its API answers
const runNode = async (binary: string, node: ILocalNode) => {
    const dir = path.dirname(node.dataDir);
    const out = openSync(node.log, 'a');
    const child: ChildProcess = spawn(binary, ['start', '--config', path.join(node.dataDir, 'config.toml')], { cwd: dir, env: nodeEnv, stdio: ['ignore', out, out] });
    closeSync(out);
    let exited: number | string | null = null;
    child.once('exit', (code, signal) => { exited = code ?? signal; });

    const deadline = Date.now() + 60000;
    for (;;) {
        if (null !== exited) {
            throw new Error(`node ${dir} exited (${exited}):\n${tail(node.log)}`);
        }
        if (await answers(`${node.apiHost}/api/v2/getuid`)) {
            return child;
        }
        if (Date.now() > deadline) {
            await stopProcess(child);
            throw new Error(`node ${dir} did not answer within 60 s:\n${tail(node.log)}`);
        }
        await sleep(250);
    }
};

const answers = async (url: string) => {
    try {
        return (await fetch(url)).ok;
    }
    catch {
        return false;
    }
};

// The suite a node runs under is its [CryptoSettings] in config.toml
const setNodeSuite = (node: ILocalNode, suite: ICryptoSuiteId) => {
    const file = path.join(node.dataDir, 'config.toml');
    const config = readFileSync(file, 'utf8');
    const changed = config
        .replace(/^(\s*Cryptoer\s*=\s*)".*"$/m, `$1"${suite.cryptoer}"`)
        .replace(/^(\s*Hasher\s*=\s*)".*"$/m, `$1"${suite.hasher}"`);
    if (!changed.includes(`"${suite.cryptoer}"`) || !changed.includes(`"${suite.hasher}"`)) {
        throw new Error(`no [CryptoSettings] in ${file}`);
    }
    writeFileSync(file, changed);
};

const stopProcess = async (child: ChildProcess) => {
    if (null !== child.exitCode || null !== child.signalCode) {
        return;
    }
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill('SIGTERM');
    if (!await Promise.race([exited.then(() => true), sleep(10000).then(() => false)])) {
        child.kill('SIGKILL');
        await exited;
    }
};

export interface INetworkOptions {
    binary: string;
    postgres: IPostgres;
    root: string;
    suite: ICryptoSuiteId;
    networkID: number;
    // The first node and the peers that download its blocks
    nodes: number;
    // Where the nodes publish notifications; none by default
    centrifugo?: ICentrifugoEndpoint;
    // Directory name under root; by default the suite's
    name?: string;
}

export const startNetwork = async (options: INetworkOptions): Promise<ILocalNetwork> => {
    const name = options.name ?? `${options.suite.cryptoer}-${options.suite.hasher}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const dir = path.join(options.root, name);
    const children: (ChildProcess | null)[] = [];
    const nodes: ILocalNode[] = [];

    const stopNode = async (i: number) => {
        const child = children[i];
        children[i] = null;
        if (child) {
            await stopProcess(child);
        }
    };
    const stop = async () => {
        await Promise.all(children.map((_, i) => stopNode(i)));
    };

    const database = (i: number) => `${name}_${i}`;
    const genesis = (i: number) => i ? path.join(nodes[0].dataDir, '1block') : null;

    try {
        for (let i = 0; i < options.nodes; i++) {
            const node = await configureNode({
                binary: options.binary,
                postgres: options.postgres,
                dir: path.join(dir, `node${i}`),
                database: database(i),
                suite: options.suite,
                networkID: options.networkID,
                bootNodes: nodes.slice(0, 1).map(first => first.tcpAddress),
                centrifugo: options.centrifugo
            });
            nodes.push(node);
            await deployNode(options.binary, options.postgres, database(i), node, genesis(i));
            children.push(await runNode(options.binary, node));
        }
    }
    catch (error) {
        await stop();
        throw error;
    }

    const network: ILocalNetwork = {
        suite: options.suite,
        networkID: options.networkID,
        nodes,
        stopNode,
        startNode: async (i, startOptions = {}) => {
            await stopNode(i);
            if (startOptions.suite) {
                setNodeSuite(nodes[i], startOptions.suite);
            }
            children[i] = await runNode(options.binary, nodes[i]);
        },
        redeploy: async suite => {
            await stop();
            for (let i = 0; i < nodes.length; i++) {
                setNodeSuite(nodes[i], suite);
                await deployNode(options.binary, options.postgres, database(i), nodes[i], genesis(i));
            }
            for (let i = 0; i < nodes.length; i++) {
                children[i] = await runNode(options.binary, nodes[i]);
            }
            network.suite = suite;
        },
        stop
    };
    return network;
};
export interface ICentrifugoEndpoint {
    // The HTTP API the nodes publish to
    url: string;
    // The WebSocket endpoint clients connect to (without /connection/websocket)
    socketUrl: string;
    secret: string;
    key: string;
}

export interface ILocalCentrifugo extends ICentrifugoEndpoint {
    // Drops every client connection: they reconnect once it is back
    restart(): Promise<void>;
    stop(): Promise<void>;
}

// A Centrifugo server on a free port, configured as the node's notifications need it: tokens signed
// with the secret, the server API behind the key, the channel of an account subscribed to on the
// server side by the token (no subscription from clients)
export const startCentrifugo = async (binary: string, root: string): Promise<ILocalCentrifugo> => {
    const dir = path.join(root, 'centrifugo');
    mkdirSync(dir, { recursive: true });
    const port = await freePort();
    const secret = randomBytes(16).toString('hex');
    const key = randomBytes(16).toString('hex');
    const config = path.join(dir, 'config.json');
    writeFileSync(config, JSON.stringify({
        http_server: { address: '127.0.0.1', port: String(port) },
        client: { token: { hmac_secret_key: secret }, allowed_origins: ['*'] },
        http_api: { key },
        health: { enabled: true }
    }));
    const log = path.join(dir, 'centrifugo.log');
    let child: ChildProcess | null = null;

    const start = async () => {
        const out = openSync(log, 'a');
        child = spawn(binary, ['--config', config], { cwd: dir, stdio: ['ignore', out, out] });
        closeSync(out);
        writeFileSync(path.join(dir, 'centrifugo.pid'), String(child.pid));
        const deadline = Date.now() + 30000;
        while (!await answers(`http://127.0.0.1:${port}/health`)) {
            if (null !== child.exitCode || Date.now() > deadline) {
                throw new Error(`centrifugo did not start:\n${tail(log)}`);
            }
            await sleep(100);
        }
    };
    const stop = async () => {
        if (child) {
            await stopProcess(child);
            child = null;
        }
    };

    await start();
    return {
        url: `http://127.0.0.1:${port}`,
        socketUrl: `ws://127.0.0.1:${port}`,
        secret,
        key,
        restart: async () => {
            await stop();
            await start();
        },
        stop
    };
};

// Centrifugo from CENTRIFUGO_BIN, otherwise built into root/bin (needs Go and the module proxy
// once); not into root itself, where root/centrifugo is the directory the server runs in
export const buildCentrifugo = async (root: string) => {
    if (process.env.CENTRIFUGO_BIN) {
        return process.env.CENTRIFUGO_BIN;
    }
    const bin = path.join(root, 'bin');
    // The version the server reports (config/centrifugo) is set at build time
    await run('go', ['install', `-ldflags=-X github.com/centrifugal/centrifugo/v6/internal/build.Version=${CENTRIFUGO_VERSION.slice(1)}`,
        `github.com/centrifugal/centrifugo/v6@${CENTRIFUGO_VERSION}`], {
        env: { ...process.env, GOBIN: bin, GOFLAGS: '-mod=mod' },
        maxBuffer: 1 << 24
    });
    return path.join(bin, 'centrifugo');
};

export const CENTRIFUGO_VERSION = 'v6.9.7';
