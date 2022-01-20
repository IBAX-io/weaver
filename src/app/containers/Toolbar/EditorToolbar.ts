/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRootState } from 'modules';
import { connect } from 'react-redux';
import { editorSave, revertEditorTab, changeEditorTool, debugContract, createEditorTab } from 'modules/editor/actions';

import EditorToolbar from 'components/Main/Editor/EditorToolbar';

const mapStateToProps = (state: IRootState) => {
    const currentTab = state.editor.tabs[state.editor.tabIndex];

    return {
        currentTab,
        canSave: !state.editor.pending &&
            currentTab && currentTab.dirty,
        canRevert: !state.editor.pending &&
            currentTab && (currentTab.dirty && null !== currentTab.initialValue)
    };
};

const mapDispatchToProps = {
    debugContract,
    revertEditorTab,
    editorSave,
    createEditorTab: createEditorTab.started,
    changeEditorTool: changeEditorTool.started
};

export default connect(mapStateToProps, mapDispatchToProps, (state, dispatch: any) => ({
    ...state,
    onExec: () => { dispatch.debugContract(state.currentTab.name); },
    onRevert: () => { dispatch.revertEditorTab(state.currentTab.uuid); },
    onToolChange: (tool: string) => { dispatch.changeEditorTool(tool); },
    onSave: () => { dispatch.editorSave(state.currentTab); },
    onCreateTab: (type: string) => { dispatch.createEditorTab(type); }

}))(EditorToolbar);