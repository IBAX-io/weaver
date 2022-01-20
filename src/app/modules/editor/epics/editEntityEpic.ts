/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
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

const editEntityEpic: Epic<Action, IRootState> = (action$, store) => action$.ofAction(txExec.done)
    .flatMap(action => Observable.from(action.payload.params.contracts)
        .filter(l => connections[l.name])
        .flatMap(contract => Observable.from(contract.params).map(params =>
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