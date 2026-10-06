/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'modules';
import { Observable } from 'rxjs';
import { IRootState } from 'modules';
import { txExec } from 'modules/tx/actions';
import { reloadEditorTab } from '../actions';

const connections = {
    '@1EditBlock': 'block',
    '@1EditPage': 'page',
    '@1EditContract': 'contract',
    '@1EditMenu': 'menu'
};

const editEntityEpic: Epic = (action$, store) => action$.ofAction(txExec.done)
    .flatMap(action => Observable.from(action.payload.params.contracts as any[])
        .filter((l: any) => connections[l.name])
        .flatMap((contract: any) => Observable.from(contract.params).map((params: any) =>
            reloadEditorTab({
                type: connections[contract.name],
                id: params.Id,
                data: {
                    initialValue: params.Value
                }
            })
        ))
    );

export default editEntityEpic;