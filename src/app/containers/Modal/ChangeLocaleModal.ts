/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { IModalProps } from 'components/Modal';
import { setLocale } from 'modules/engine/actions';

import ChangeLocaleModal from 'components/Modal/ChangeLocaleModal';

const mapStateToProps = (state: IRootState) => ({
    value: state.engine.locale,
    locales: state.engine.locales
});

export default connect(mapStateToProps, {
    setLocale: setLocale.started

}, (state, dispatch: any, props: IModalProps<any, any>) => ({
    ...props,
    params: {
        ...state,
        ...props.params,
        onChangeLocale: (locale: string) => {
            dispatch.setLocale(locale);
        }
    },
}))(ChangeLocaleModal);