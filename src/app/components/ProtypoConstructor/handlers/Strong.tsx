/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Strong extends EditableBlock {
    protected editableTag = 'b';
    protected editableDisplay = 'inline';
    protected renderTag = 'b';
}

export default DnDComponent(StyledComponent(Strong));
