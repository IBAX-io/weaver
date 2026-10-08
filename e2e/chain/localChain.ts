/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Local go-ibax networks for the chain tests: a throwaway PostgreSQL cluster, and per network a
// first node that generates the genesis block and every block after it, plus peers that only
// download and check its blocks. Everything lives under one temporary root.
import { ChildProcess, execFile, spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, copyFileSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { promisify } from 'node:util';
import { ICryptoSuiteId } from 'ibax/crypto';

const run = promisify(execFile);

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

// Builds the node from a go-ibax checkout (GO_IBAX_DIR)
export const buildNode = async (goIbaxDir: string, root: string) => {
    const binary = path.join(root, 'go-ibax');
    await run('go', ['build', '-o', binary, '.'], { cwd: goIbaxDir, maxBuffer: 1 << 24 });
    return binary;
};

// Stops every node still running under root (go-ibax writes its pid next to its data)
export const killNodes = (root: string) => {
    if (!existsSync(root)) {
        return;
    }
    for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
        if (entry.isFile() && 'go-ibax.pid' === entry.name) {
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
}

const startNode = async (options: INodeOptions, genesis: string | null) => {
    const { binary, postgres, dir, suite, networkID } = options;
    const dataDir = path.join(dir, 'data');
    mkdirSync(dataDir, { recursive: true });
    const [httpPort, tcpPort] = [await freePort(), await freePort()];
    const config = ['--config', path.join(dataDir, 'config.toml')];
    const node = (...args: string[]) => run(binary, args, { cwd: dir });

    await run(path.join(postgres.bin, 'createdb'), ['-h', '127.0.0.1', '-p', String(postgres.port), '-U', 'postgres', options.database]);
    await node('config',
        `--dataDir=${dataDir}`, `--tempDir=${path.join(dir, 'tmp')}`,
        '--dbHost=127.0.0.1', `--dbPort=${postgres.port}`, `--dbName=${options.database}`, '--dbUser=postgres', '--dbPassword=',
        '--httpHost=127.0.0.1', `--httpPort=${httpPort}`, '--tcpHost=127.0.0.1', `--tcpPort=${tcpPort}`,
        `--networkID=${networkID}`, `--cryptoer=${suite.cryptoer}`, `--hasher=${suite.hasher}`,
        `--bootNodes=${options.bootNodes.join(',')}`, '--logLevel=WARN');
    await node('generateKeys', ...config);
    if (genesis) {
        copyFileSync(genesis, path.join(dataDir, '1block'));
    }
    else {
        await node('generateFirstBlock', '--test=true', ...config);
    }
    await node('initDatabase', ...config);

    const log = path.join(dir, 'node.log');
    const out = openSync(log, 'a');
    const child: ChildProcess = spawn(binary, ['start', ...config], { cwd: dir, stdio: ['ignore', out, out] });
    closeSync(out);
    let exited: number | string | null = null;
    child.once('exit', (code, signal) => { exited = code ?? signal; });

    const apiHost = `http://127.0.0.1:${httpPort}`;
    const deadline = Date.now() + 60000;
    for (;;) {
        if (null !== exited) {
            throw new Error(`node ${dir} exited (${exited}):\n${tail(log)}`);
        }
        try {
            if ((await fetch(`${apiHost}/api/v2/getuid`)).ok) {
                break;
            }
        }
        catch {
            // not listening yet
        }
        if (Date.now() > deadline) {
            throw new Error(`node ${dir} did not answer within 60 s:\n${tail(log)}`);
        }
        await sleep(250);
    }

    const key = (name: string) => readFileSync(path.join(dataDir, name), 'utf8').trim();
    return {
        child,
        node: {
            apiHost,
            tcpAddress: `127.0.0.1:${tcpPort}`,
            dataDir,
            log,
            privateKey: key('PrivateKey'),
            keyID: key('KeyID')
        } as ILocalNode
    };
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
}

export const startNetwork = async (options: INetworkOptions): Promise<ILocalNetwork> => {
    const name = `${options.suite.cryptoer}-${options.suite.hasher}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const dir = path.join(options.root, name);
    const children: ChildProcess[] = [];
    const nodes: ILocalNode[] = [];
    const stop = async () => {
        await Promise.all(children.map(stopProcess));
    };

    try {
        for (let i = 0; i < options.nodes; i++) {
            const { child, node } = await startNode({
                binary: options.binary,
                postgres: options.postgres,
                dir: path.join(dir, `node${i}`),
                database: `${name}_${i}`,
                suite: options.suite,
                networkID: options.networkID,
                bootNodes: nodes.slice(0, 1).map(first => first.tcpAddress)
            }, i ? path.join(nodes[0].dataDir, '1block') : null);
            children.push(child);
            nodes.push(node);
        }
    }
    catch (error) {
        await stop();
        throw error;
    }

    return { suite: options.suite, networkID: options.networkID, nodes, stop };
};
