/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { txExec } from '../actions';
import { reloadStylesheet } from 'modules/content/actions';

const reloadStylesheetEpic: Epic =
    action$ => action$.pipe(
        ofAction(txExec.done),
        filter(l => !!l.payload.params.contracts.find(c => /^(@1)?EditParameter$/.test(c.name) && !!c.params.find(p => 'stylesheet' === p.name))),
        mergeMap(s => from(s.payload.params.contracts)),
        mergeMap(contract => from(contract.params)),
        map(params =>
            reloadStylesheet(params.value)
        )
    );

export default reloadStylesheetEpic;
