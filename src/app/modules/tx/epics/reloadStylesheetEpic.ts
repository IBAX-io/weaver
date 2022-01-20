/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRootState } from 'modules';
import { Epic } from 'redux-observable';
import { Action } from 'redux';
import { txExec } from '../actions';
import { reloadStylesheet } from 'modules/content/actions';
import { Observable } from 'rxjs';

const reloadStylesheetEpic: Epic<Action, IRootState> =
    (action$, store) => action$.ofAction(txExec.done)
        .filter(l => !!l.payload.params.contracts.find(c => /^(@1)?EditParameter$/.test(c.name) && !!c.params.find(p => 'stylesheet' === p.name)))
        .flatMap(s => Observable.from(s.payload.params.contracts))
        .flatMap(contract => Observable.from(contract.params))
        .map(params =>
            reloadStylesheet(params.value)
        );

export default reloadStylesheetEpic;