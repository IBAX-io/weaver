/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Label extends EditableBlock {
    protected editableTag = 'label';
    protected editableDisplay = 'inline';
    protected renderTag = 'label';
}

export default DnDComponent(StyledComponent(Label));
