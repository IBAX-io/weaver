/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { renderPage } from '../actions';
import { Reducer } from 'modules';
import upsertSectionBreadcrumb from '../util/upsertSectionBreadcrumb';

const renderPageHandler: Reducer<typeof renderPage.started, State> = (state, payload): State => {
    if (payload.popup) {
        return state;
    }

    return {
        ...state,
        sections: {
            ...state.sections,
            [payload.section]: {
                ...state.sections[payload.section],
                page: {
                    name: payload.name,
                    status: 'PENDING',
                    content: [],
                    static: false,
                    params: payload.params,
                    error: undefined,
                    location: payload.location,
                },
                breadcrumbs: upsertSectionBreadcrumb(
                    state.sections[payload.section],
                    {
                        caller: payload.location.state && payload.location.state.from && payload.location.state.from.name,
                        type: (payload.location.state && payload.location.state.from) ? payload.location.state.from.type : 'IGNORE',
                        title: payload.location.state && payload.location.state.from && payload.location.state.from.title,
                        section: payload.section,
                        page: payload.name,
                        params: payload.params
                    }
                )
            }
        }
    };
};

export default renderPageHandler;