/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class Table extends Tag {
    protected tagName: string = 'Table';
    public canHaveChildren: boolean = false;
    protected attr: any = {
        'source': 'Source',
        'columns': 'Columns'
    };
    protected newElementAttr: any = {
        source: 'keysStr',
        columns: 'KEY_ID=id,MONEY=amount'
    };
    protected editProps = ['class', 'source', 'columns'];
    protected generateTextElement: boolean = false;
}

export default Table;