/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Observable } from 'rxjs';
import { IAPIDependency } from 'modules/dependencies';

const NodeObservable = (params: { nodes: string[], count: number, timeout?: number, concurrency?: number, api: IAPIDependency }) =>
    Observable.from(params.nodes)
        .distinct()
        .flatMap(l => {
            const client = params.api({ apiHost: l });
            return Observable.from(client.getUid())
                .map(() => l)

                // Set request timeout, try the next one
                .timeout(params.timeout || 60000)
                .catch(timeout => Observable.empty<never>());
        }, params.concurrency)
        .take(params.count);

export default NodeObservable;