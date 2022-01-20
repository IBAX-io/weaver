/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class P extends EditableBlock {
    protected editableTag = 'p';
    protected editableDisplay = 'block';
    protected renderTag = 'p';
}

export default DnDComponent(StyledComponent(P));
