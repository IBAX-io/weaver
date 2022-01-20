/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Span extends EditableBlock {
    protected editableTag = 'span';
    protected editableDisplay = 'inline';
    protected renderTag = 'span';
}

export default DnDComponent(StyledComponent(Span));
