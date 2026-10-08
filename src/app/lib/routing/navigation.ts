/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import type { createBrowserRouter } from 'react-router';
import { locationChange } from 'modules/router/actions';
import { INavigationService, IRouterState } from 'modules/router/types';

type TDataRouter = ReturnType<typeof createBrowserRouter>;
type TRouterState = TDataRouter['state'];

let attached: TDataRouter | null = null;

const toRouterState = (state: TRouterState): IRouterState => ({
    location: {
        pathname: state.location.pathname,
        search: state.location.search,
        hash: state.location.hash,
        state: state.location.state,
        key: state.location.key
    },
    action: state.historyAction
});

// Mirrors router location changes into the store (starting with the current one) and lets
// navigationEpic drive the router. Returns the unsubscribe function.
export const attachRouter = (router: TDataRouter, dispatch: (action: Action) => unknown) => {
    attached = router;
    let lastKey = router.state.location.key;
    dispatch(locationChange(toRouterState(router.state)));

    const unsubscribe = router.subscribe(state => {
        // The router also notifies on loading/fetcher changes; only location changes matter here
        if (state.location.key !== lastKey) {
            lastKey = state.location.key;
            dispatch(locationChange(toRouterState(state)));
        }
    });

    return () => {
        unsubscribe();
        attached = null;
    };
};

export const navigationService: INavigationService = {
    navigate: ({ to, replace, state }) => {
        if (!attached) {
            throw new Error(`Cannot navigate to "${to}": no router is attached`);
        }
        attached.navigate(to, { replace, state });
    }
};
