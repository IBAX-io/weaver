/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { changeEditorTab, closeEditorTab, closeSavedEditorTab, updateEditorTab, loadEditorTab } from 'modules/editor/actions';
import { modalShow } from 'modules/modal/actions';

import Editor from 'components/Main/Editor';

const mapStateToProps = (state: IRootState) => ({
    mainSection: state.sections.mainSection,
    tabIndex: state.editor.tabIndex,
    tabs: state.editor.tabs,
});

const mapDispatchToProps = {
    onTabLoad: loadEditorTab.started,
    onTabChange: (uuid: string) => changeEditorTab(uuid),
    onTabClose: (uuid: string) => closeEditorTab(uuid),
    onTabCloseAll: () => modalShow({
        id: 'EDITOR_CLOSE_ALL',
        type: 'EDITOR_CLOSE_ALL',
        params: {}
    }),
    onTabCloseSaved: () => closeSavedEditorTab(),
    onTabUpdate: updateEditorTab,
};

export default connect(mapStateToProps, mapDispatchToProps)(Editor);