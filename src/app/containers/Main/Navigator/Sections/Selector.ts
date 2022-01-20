/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import _ from 'lodash';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { ISection, TPageParams } from 'ibax/content';

import Selector from 'components/Main/Navigator/Sections/Selector';

const mapSectionParam = (section: ISection) => {
    const page = section.page ? section.page.name : section.defaultPage;
    const params: TPageParams = section.page ? section.page.params : {};

    return {
        index: section.index,
        title: section.title,
        name: section.name,
        page,
        params
    };
};

const mapStateToProps = (state: IRootState, props: { section?: string }) => ({
    section: null === props.section ? null : (props.section || state.sections.mainSection),
    values: _.map(state.sections.sections, mapSectionParam).sort((a, b) => a.index - b.index)
});

export default connect(mapStateToProps)(Selector);