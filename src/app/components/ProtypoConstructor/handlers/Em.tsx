/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Em extends EditableBlock {
    protected editableTag = 'em';
    protected editableDisplay = 'inline';
    protected renderTag = 'em';
}

export default DnDComponent(StyledComponent(Em));
