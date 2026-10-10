/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/socket' {
    interface INotificationsMessage {
        id: string;
        ecosystem: string;
        role: string;
        count: number;
    }

    // The counts of a role's open notifications in an ecosystem, as the node publishes them to
    // the channel of an account (role 0: those sent to the account itself)
    interface INotificationsCount {
        ecosystem: string;
        role_id: string;
        count: number;
    }

    interface IConnectCall {
        // Centrifugo's address with the WebSocket scheme, without /connection/websocket
        url: string;
        // The session's token for Centrifugo (notify_key)
        token: string;
        // The session connected (its token for the node)
        session: string;
    }
}
