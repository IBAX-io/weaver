/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { reloadPage } from 'modules/sections/actions';

import Navigator from 'components/Main/Navigator';

interface Props {
    section?: string;
    page?: string;
}

const mapStateToProps = (state: IRootState, props: Props) => {
    const sectionName = props.section || state.sections.mainSection;
    const section = state.sections.sections[sectionName];
    const defaultPage = section ? section.defaultPage : '';
    const page = props.page || defaultPage;

    return {
        stylesheet: state.content.stylesheet,
        section: sectionName,
        sections: state.sections.sections,
        page
    };
};

const mapDispatchToProps = {
    reloadPage
};

export default connect(mapStateToProps, mapDispatchToProps, (state, dispatch: any, props) => ({
    ...state,
    onRefresh: () => dispatch.reloadPage({ section: props.section })
}))(Navigator);