/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/notifications' {
    type TNotificationRenderer<P> =
        ((params: P) => React.ReactNode) |
        React.ReactNode;

    interface INotificationProto<P> {
        icon: string;
        title: TNotificationRenderer<P>;
        body: TNotificationRenderer<P>;
    }

    interface INotification {
        id: string;
        type: string;
        params: {
            [key: string]: any;
        }
    }
}