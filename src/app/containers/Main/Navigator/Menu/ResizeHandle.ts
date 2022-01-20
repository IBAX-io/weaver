
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { setMenuFolded } from 'modules/storage/actions';

import ResizeHandle from 'components/Main/Navigator/Menu/ResizeHandle';

const mapStateToProps = (state: IRootState) => ({
    folded: state.storage.menuFolded
});

const mapDispatchToProps = {
    setMenuFolded
};

export default connect(mapStateToProps, mapDispatchToProps, (state, dispatch: any) => ({
  onFoldToggle: () => dispatch.setMenuFolded(!state.folded),
  folded: state.folded
}))(ResizeHandle);