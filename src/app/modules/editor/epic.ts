/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineEpics } from 'redux-observable';
import newContractEpic from './epics/newContractEpic';
import editorSaveEpic from './epics/editorSaveEpic';
import newPageEpic from './epics/newPageEpic';
import editEntityEpic from './epics/editEntityEpic';
import newMenuEpic from './epics/newMenuEpic';
import newBlockEpic from './epics/newBlockEpic';
import closeEditorTabEpic from './epics/closeEditorTabEpic';
import createEditorTabEpic from './epics/createEditorTabEpic';
import changeEditorToolEpic from './epics/changeEditorToolEpic';
import loadEditorTabEpic from './epics/loadEditorTabEpic';
import generatePageTemplateEpic from './epics/generatePageTemplateEpic';
import getPageTreeEpic from './epics/getPageTreeEpic';
import getPageTreeDoneEpic from './epics/getPageTreeDoneEpic';
import changePageEpic from './epics/changePageEpic';
import selectTagEpic from './epics/selectTagEpic';
import addTagEpic from './epics/addTagEpic';
import moveTagEpic from './epics/moveTagEpic';
import copyTagEpic from './epics/copyTagEpic';
import removeTagEpic from './epics/removeTagEpic';
import moveTreeTagEpic from './epics/moveTreeTagEpic';
import saveConstructorHistoryEpic from './epics/saveConstructorHistoryEpic';
import constructorUndoEpic from './epics/constructorUndoEpic';
import constructorRedoEpic from './epics/constructorRedoEpic';
import setTagCanDropPositionEpic from './epics/setTagCanDropPositionEpic';
import debugContractEpic from './epics/debugContractEpic';
import revertEditorTabEpic from './epics/revertEditorTabEpic';
import openEditorEpic from './epics/openEditorEpic';

export default combineEpics(
    changeEditorToolEpic,
    closeEditorTabEpic,
    createEditorTabEpic,
    editEntityEpic,
    editorSaveEpic,
    loadEditorTabEpic,
    newBlockEpic,
    newContractEpic,
    newMenuEpic,
    newPageEpic,
    generatePageTemplateEpic,
    getPageTreeEpic,
    getPageTreeDoneEpic,
    changePageEpic,
    selectTagEpic,
    addTagEpic,
    moveTagEpic,
    copyTagEpic,
    removeTagEpic,
    moveTreeTagEpic,
    saveConstructorHistoryEpic,
    constructorUndoEpic,
    constructorRedoEpic,
    setTagCanDropPositionEpic,
    debugContractEpic,
    revertEditorTabEpic,
    openEditorEpic
);