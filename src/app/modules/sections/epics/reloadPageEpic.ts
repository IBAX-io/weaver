/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { reloadPage, renderPage } from '../actions';

const reloadPageEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(reloadPage),
    switchMap(action => {
        const section = state$.value.sections.sections[action.payload.section];

        if (!section || !section.page) {
            return EMPTY;
        }

        return of(renderPage.started({
            section: section.name,
            name: section.page.name,
            params: section.page.params,
            location: section.page.location
        }));
    })
);

export default reloadPageEpic;
