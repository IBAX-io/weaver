/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { modalClose } from 'modules/modal/actions';
import { closeAllEditorTabs } from 'modules/editor/actions';
import { IModalProps } from 'components/Modal';

import EditorCloseAllModal from 'components/Modal/EditorCloseAllModal';

const mapStateToProps = (state: IRootState) => ({
});

export default connect(mapStateToProps, {
    modalClose,
    closeAllEditorTabs

}, (_state, dispatch: any, props: IModalProps<void, void>) => ({
    ...props,
    onResult: (_data: void) => {
        dispatch.modalClose({
            reason: 'RESULT',
            data: null
        });

        dispatch.closeAllEditorTabs();
    }
}))(EditorCloseAllModal);