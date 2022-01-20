
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as commander from 'commander';
import { IInferredArguments } from 'ibax/gui';

// Normalize electron launch arguments
const argv = process.argv.slice();
const executable = argv.shift();
if (!argv[0] || argv[0] && argv[0] !== '.') {
  argv.unshift('');
}
argv.unshift(executable);

const command = commander
  .option('-n, --full-node <url>', null, (value, stack) => {
    stack.push(value);
    return stack;
  }, [])
  .option('-k, --private-key <key>')
  .option('-d, --dry')
  .option('-x, --offset-x <value>', null, parseInt)
  .option('-y, --offset-y <value>', null, parseInt)
  .option('-i, --network-id <value>', null, parseInt)
  .option('-m, --network-name <value>', 'Default network')
  .option('-s, --socket-url <url>', null)
  .option('-u, --disable-full-nodes-sync', null)
  .option('-g, --guest-mode')
  .option('-e, --activation-email', null)
  .parse(argv);

const args: IInferredArguments = {
  privateKey: command.privateKey,
  fullNode: command.fullNode,
  dry: command.dry,
  offsetX: command.offsetX,
  offsetY: command.offsetY,
  networkID: command.networkId,
  networkName: command.networkName,
  socketUrl: command.socketUrl,
  disableHonorNodesSync: command.disableHonorNodesSync,
  guestMode: command.guestMode
};

export default args;