/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { reloadPage, renderPage } from '../actions';
import { Observable } from 'rxjs';

const reloadPageEpic: Epic = (action$, store) => action$.ofAction(reloadPage)
    .switchMap(action => {
        const section = store.getState().sections.sections[action.payload.section];

        if (!section || !section.page) {
            return Observable.empty();
        }

        return Observable.of(renderPage.started({
            section: section.name,
            name: section.page.name,
            params: section.page.params,
            location: section.page.location
        }));
    });

export default reloadPageEpic;