/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as actions from './actions';
import { TEditorTab } from 'ibax/editor';
import { reducerWithInitialState } from 'typescript-fsa-reducers/dist';
import changeEditorToolDoneHandler from './reducers/changeEditorToolDoneHandler';
import changeEditorTabHandler from './reducers/changeEditorTabHandler';
import changeEditorToolStartedHandler from './reducers/changeEditorToolStartedHandler';
import closeAllEditorTabHandler from './reducers/closeAllEditorTabHandler';
import closeSavedEditorTabHandler from './reducers/closeSavedEditorTabHandler';
import createEditorTabDoneHandler from './reducers/createEditorTabDoneHandler';
import reloadEditorTabHandler from './reducers/reloadEditorTabHandler';
import resetEditorTabHandler from './reducers/resetEditorTabHandler';
import updateEditorTabHandler from './reducers/updateEditorTabHandler';
import loadEditorTabDoneHandler from './reducers/loadEditorTabDoneHandler';
import getPageTreeDoneHandler from './reducers/getPageTreeDoneHandler';
import getPageTreeFailedHandler from './reducers/getPageTreeFailedHandler';
import selectTagDoneHandler from './reducers/selectTagDoneHandler';
import changePageDoneHandler from './reducers/changePageDoneHandler';
import addTagDoneHandler from './reducers/addTagDoneHandler';
import moveTagDoneHandler from './reducers/moveTagDoneHandler';
import copyTagDoneHandler from './reducers/copyTagDoneHandler';
import removeTagDoneHandler from './reducers/removeTagDoneHandler';
import saveConstructorHistoryDoneHandler from './reducers/saveConstructorHistoryDoneHandler';
import setTagCanDropPositionDoneHandler from './reducers/setTagCanDropPositionDoneHandler';
import constructorUndoDoneHandler from './reducers/constructorUndoDoneHandler';
import constructorRedoDoneHandler from './reducers/constructorRedoDoneHandler';
import setPageTemplateHandler from './reducers/setPageTemplateHandler';
import destroyEditorTabHandler from './reducers/destroyEditorTabHandler';

export type State = {
    readonly pending: boolean;
    readonly tabIndex: number;
    readonly tabs: TEditorTab[];
};

export const initialState: State = {
    pending: false,
    tabIndex: 0,
    tabs: []
};

export default reducerWithInitialState<State>(initialState)
    .case(actions.changeEditorTab, changeEditorTabHandler)
    .case(actions.changeEditorTool.done, changeEditorToolDoneHandler)
    .case(actions.changeEditorTool.started, changeEditorToolStartedHandler)
    .case(actions.destroyEditorTab, destroyEditorTabHandler)
    .case(actions.closeAllEditorTabs, closeAllEditorTabHandler)
    .case(actions.closeSavedEditorTab, closeSavedEditorTabHandler)
    .case(actions.createEditorTab.done, createEditorTabDoneHandler)
    .case(actions.loadEditorTab.done, loadEditorTabDoneHandler)
    .case(actions.reloadEditorTab, reloadEditorTabHandler)
    .case(actions.resetEditorTab, resetEditorTabHandler)
    .case(actions.updateEditorTab, updateEditorTabHandler)
    .case(actions.getPageTree.done, getPageTreeDoneHandler)
    .case(actions.getPageTree.failed, getPageTreeFailedHandler)
    .case(actions.selectTag.done, selectTagDoneHandler)
    .case(actions.changePage.done, changePageDoneHandler)
    .case(actions.addTag.done, addTagDoneHandler)
    .case(actions.moveTag.done, moveTagDoneHandler)
    .case(actions.copyTag.done, copyTagDoneHandler)
    .case(actions.removeTag.done, removeTagDoneHandler)
    .case(actions.saveConstructorHistory.done, saveConstructorHistoryDoneHandler)
    .case(actions.constructorUndo.done, constructorUndoDoneHandler)
    .case(actions.constructorRedo.done, constructorRedoDoneHandler)
    .case(actions.setTagCanDropPosition.done, setTagCanDropPositionDoneHandler)
    .case(actions.setPageTemplate, setPageTemplateHandler);