/*
 * @Author: abc
 * @Date: 2020-09-14 17:49:32
 * @LastEditors: abc
 * @LastEditTime: 2020-09-14 18:14:00
 * @Description: 
 */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { modalClose } from 'modules/modal/actions';
import { destroyEditorTab } from 'modules/editor/actions';
import { IModalProps } from 'components/Modal';

import EditorCloseModal from 'components/Modal/EditorCloseModal';

interface Props {
    uuid: string;
}

const mapStateToProps = (state: IRootState, props: IModalProps<Props, void>) => {
    const tab = state.editor.tabs.find(t => t.uuid === props.params.uuid);
    return {
        name: tab ? tab.name : ''
    };
};

export default connect(mapStateToProps, {
    modalClose,
    destroyEditorTab

}, (state, dispatch: any, props: IModalProps<Props, void>) => ({
    ...props,
    params: {
        ...state
    },
    onResult: (_data: void) => {
        dispatch.modalClose({
            reason: 'RESULT',
            data: null
        });

        dispatch.destroyEditorTab(props.params.uuid);
    }
}))(EditorCloseModal);