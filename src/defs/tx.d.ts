/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/tx' {

    type TTxError =
        'error' |
        'info' |
        'warning' |
        'panic' |
        'E_GUEST_VIOLATION' |
        // The user cancelled the password prompt or typed a wrong password: nothing to show
        'E_AUTH_CANCELLED' |
        'E_INVALID_TRANSFER' |
        'E_INVALID_PARAM' |
        'E_UNSUPPORTED_PARAM' |
        'E_INSUFFICIENT_BALANCE' |
        'E_TX_TIMEOUT' |
        'E_PENALTY' |
        'E_DUPLICATE_TX' |
        'E_CONTRACT' |
        'E_SERVER';

    interface IErrorRedirect {
        pagename: string;
        pageparams?: {
            [key: string]: any;
        };
    }

    interface ITxError {
        errorRedirects?: IErrorRedirect;
        id?: string;
        // Client errors above, or whatever type the node reports
        type: TTxError | (string & {});
        error: string;
        params?: any[];
    }

    interface ITransactionParam {
        type: string;
        value: object;
    }

    type TTransactionStatus =
        'pending' | 'done' | 'error';

    interface ITransactionCollection {
        status: TTransactionStatus;
        error?: ITxError;
        stack: ITransaction[];
    }

    interface ITransaction {
        name: string,
        hash: string,
        // Node status once the transaction is in a block (/txstatus)
        status: import('ibax/api').ITxStatus;
        body: ITransactionBody;
    }

    // UTXO <-> Account balance of the signer (go-ibax smart.TransferSelf)
    type TTransferSelfDirection = 'toAccount' | 'toUTXO';

    // Value transfers that are not contract calls (go-ibax transaction types 5 and 6).
    // Amounts are integers in the ecosystem's smallest unit.
    // toID: signed int64 account id of the recipient (lib/crypto/address parseAddress)
    type TTransferCall =
        { type: 'utxo'; toID: string; amount: string } |
        { type: 'transferSelf'; amount: string; direction: TTransferSelfDirection };

    interface ITransactionCall {
        uuid: string;
        silent?: boolean;
        section?: string;
        contracts: {
            name: string;
            params: {
                [key: string]: any;
            }[];
        }[];
        transfers?: TTransferCall[];
        errorRedirects?: {
            [key: string]: IErrorRedirect;
        }
    }

    // msgpack payload of a client transaction (go-ibax types.SmartTransaction)
    interface ITransactionBody {
        Header: {
            ID: bigint;
            Time: bigint;
            EcosystemID: bigint;
            KeyID: bigint;
            NetworkID: bigint;
            PublicKey: Uint8Array;
        };
        Params?: {
            [key: string]: unknown;
        };
        UTXO?: {
            ToID: bigint;
            Value: string;
            Comment: string;
        };
        TransferSelf?: {
            Value: string;
            Source: string;
            Target: string;
        };
        Lang: string;
    }
}
