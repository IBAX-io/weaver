/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';

import PageLink from 'components/Routing/PageLink';

interface Props {
    section?: string;
}

const mapStateToProps = (state: IRootState, props: Props) => ({
    section: props.section || state.sections.mainSection
});

export default connect(mapStateToProps, {})(PageLink);