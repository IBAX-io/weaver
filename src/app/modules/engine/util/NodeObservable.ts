/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, from } from 'rxjs';
import { catchError, distinct, map, mergeMap, take, timeout } from 'rxjs/operators';
import { IAPIDependency } from 'modules/dependencies';

const NodeObservable = (params: { nodes: string[], count: number, timeout?: number, concurrency?: number, api: IAPIDependency }) =>
    from(params.nodes).pipe(
        distinct(),
        mergeMap(l => {
            const client = params.api({ apiHost: l });
            return from(client.getUid()).pipe(
                map(() => l),

                // Set request timeout, try the next one
                timeout(params.timeout || 60000),
                catchError(timeout => EMPTY)
            );
        }, params.concurrency),
        take(params.count)
    );

export default NodeObservable;
