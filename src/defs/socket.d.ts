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

    interface IConnectCall {
        wsHost: string;
        userID: string;
        socketToken: string;
        session: string;
        timestamp: string;
    }
}