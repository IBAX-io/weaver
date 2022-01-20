/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class Data extends Tag {
    protected tagName: string = 'Data';
    public logic: boolean = true;
    protected attr: any = {
        'source': 'Source',
        'columns': 'Columns'
    };
    protected editProps = ['source', 'columns', 'data'];
    protected bodyInline = false;
    protected dataAttr = true;
}

export default Data;