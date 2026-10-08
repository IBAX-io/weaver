/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, defaultIfEmpty } from 'rxjs/operators';
import platform from 'lib/platform';
import urlJoin from 'url-join';

const resolveConfig = (name: string) =>
    platform.select({
        web: urlJoin(import.meta.env.BASE_URL, `${name}.json`),
        desktop: `./${name}.json`
    });

const ConfigObservable = (name: string) =>
    ajax.getJSON(resolveConfig(name)).pipe(
        catchError(e => of({})),
        defaultIfEmpty({})
    );

export default ConfigObservable;
