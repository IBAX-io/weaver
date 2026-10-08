/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { txExec } from 'modules/tx/actions';
import { reloadEditorTab } from '../actions';

const connections = {
    '@1EditBlock': 'block',
    '@1EditPage': 'page',
    '@1EditContract': 'contract',
    '@1EditMenu': 'menu'
};

const editEntityEpic: Epic = action$ => action$.pipe(
    ofAction(txExec.done),
    mergeMap(action => from(action.payload.params.contracts as any[]).pipe(
        filter((l: any) => connections[l.name]),
        mergeMap((contract: any) => from(contract.params).pipe(
            map((params: any) =>
                reloadEditorTab({
                    type: connections[contract.name],
                    id: params.Id,
                    data: {
                        initialValue: params.Value
                    }
                })
            )
        ))
    ))
);

export default editEntityEpic;
