/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as actions from './actions';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { ISection } from 'ibax/content';
import updateSectionHandler from './reducers/updateSectionHandler';
import sectionsInitHandler from './reducers/sectionsInitHandler';
import menuPopHandler from './reducers/menuPopHandler';
import menuPushHandler from './reducers/menuPushHandler';
import renderPageDoneHandler from './reducers/renderPageDoneHandler';
import renderPageFailedHandler from './reducers/renderPageFailedHandler';
import renderPageHandler from './reducers/renderPageHandler';

export type State = {
    readonly mainSection: string;
    readonly sections: {
        readonly [name: string]: ISection;
    };
};

export const initialState: State = {
    mainSection: 'home',
    sections: {}
};

export default reducerWithInitialState(initialState)
    .case(actions.updateSection, updateSectionHandler)
    .case(actions.menuPop, menuPopHandler)
    .case(actions.menuPush, menuPushHandler)
    .case(actions.renderPage.done, renderPageDoneHandler)
    .case(actions.renderPage.failed, renderPageFailedHandler)
    .case(actions.renderPage.started, renderPageHandler)
    .case(actions.sectionsInit, sectionsInitHandler);