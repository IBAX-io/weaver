/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as actions from '../actions';
import * as uuid from 'uuid';
import { filter, map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { txCall } from 'modules/tx/actions';

const connections = {
    contract: '@1EditContract',
    page: '@1EditPage',
    menu: '@1EditMenu',
    block: '@1EditBlock',
};

const editorSaveEpic: Epic = action$ => action$.pipe(
    ofAction(actions.editorSave),
    filter(l => !l.payload.new && connections[l.payload.type]),
    map(action =>
        txCall({
            uuid: uuid.v4(),
            contracts: [{
                name: connections[action.payload.type],
                params: [{
                    Id: action.payload.id,
                    Value: action.payload.value
                }]
            }]
        })
    )
);

export default editorSaveEpic;
