/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Direct node calls the chain tests share: what a test sets up or checks on the network itself,
// besides what it lets the client do
import { expect } from 'vitest';
import IbaxAPI from 'lib/ibaxAPI';
import { authenticate } from 'services/auth';
import { ISignedTransaction } from 'lib/tx/transaction';

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// The API's errors are plain objects ({ error, msg })
export const refusal = async (promise: Promise<unknown>) => {
    try {
        await promise;
    }
    catch (error) {
        return error as { error: string; msg?: string };
    }
    throw new Error('the node accepted it');
};

export const maxBlockID = async (apiHost: string) =>
    Number((await (await fetch(`${apiHost}/api/v2/maxblockid`)).json()).max_block_id);

// Sends one transaction and waits until it is in a block
export const execute = async (client: IbaxAPI, signed: ISignedTransaction) => {
    await client.txSend({ [signed.hash]: new Blob([signed.data.slice()]) });
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
        await sleep(250);
        const status = (await client.txStatus([signed.hash]).catch(() => null))?.[signed.hash];
        if (status?.errmsg) {
            throw new Error(`transaction failed: ${JSON.stringify(status.errmsg)}`);
        }
        if (status?.blockid) {
            expect(status.penalty).toBe(0);
            return status;
        }
    }
    throw new Error(`transaction ${signed.hash} not in a block within 60 s`);
};

// Signs in with a key, which gives an unknown key its account first: the node creates it with a
// transaction and answers E_NEWUSER until that is in a block
export const register = async (api: IbaxAPI, privateKey: string, networkID: number) => {
    const deadline = Date.now() + 60000;
    for (;;) {
        try {
            return await authenticate(api, privateKey, { networkID });
        }
        catch (error) {
            if ('E_NEWUSER' !== (error as { error?: string })?.error || Date.now() > deadline) {
                throw error;
            }
            await sleep(500);
        }
    }
};
