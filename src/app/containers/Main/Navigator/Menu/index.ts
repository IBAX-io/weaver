/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { menuPop } from 'modules/sections/actions';
import { setMenuActive } from 'modules/content/actions';
import Menu from 'components/Main/Navigator/Menu';

export interface INavigationProps {
    section: string;
}

const mapStateToProps = (state: IRootState, props: INavigationProps) => {
    const section = state.sections.sections[props.section];
    return {
        menus: section ? section.menus : [],
        folded: state.storage.menuFolded,
        active: state.content.menuActive
    };
};

const mapDispatchToProps = {
    menuPop,
    setMenuActive
};

export default connect(mapStateToProps, mapDispatchToProps, (state, dispatch: any, props) => ({
    ...state,
    ...props,
    menuPop: () => dispatch.menuPop(props.section),
    onMouseOver: () => {
        if (state.folded && !state.active) {
            dispatch.setMenuActive(true);
        }
    },
    onMouseLeave: () => {
        if (state.folded && state.active) {
            dispatch.setMenuActive(false);
        }
    }
}))(Menu);