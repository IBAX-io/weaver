/*---------------------------------------------------------------------------------------------
*  Copyright (c) IBAX All rights reserved.
*  See LICENSE in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import React from 'react';
import Header from 'containers/Main/Header';
import Navigator from 'containers/Main/Navigator';
import Editor from 'containers/Main/Editor';

interface RouteDict {
    [name: string]: {
        Header: React.ComponentType;
        Content: React.ComponentType;
        mapHeaderParams?: (params: any) => any;
        mapContentParams?: (params: any) => any;
    };
}
export const mainRoute = '/:app?/:page?/:action?';

export const routes: RouteDict = {
    browse: {
        Header,
        Content: Navigator,
        mapContentParams: params => ({
            app: params.app,
            section: params.page,
            page: params.action
        })
    },
    editor: {
        Header,
        Content: Editor
    }
};