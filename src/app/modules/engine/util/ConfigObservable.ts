/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Observable } from 'rxjs';
import platform from 'lib/platform';
import urlJoin from 'url-join';

const resolveConfig = (name: string) =>
    platform.select({
        web: urlJoin(process.env.PUBLIC_URL || location.origin, `${name}.json`),
        desktop: `./${name}.json`
    });

const ConfigObservable = (name: string) =>
    Observable.ajax.getJSON(resolveConfig(name))
        .catch(e => Observable.of({}))
        .defaultIfEmpty({});

export default ConfigObservable;