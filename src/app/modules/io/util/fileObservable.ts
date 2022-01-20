/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Observable } from 'rxjs';

const fileObservable = (blob: Blob): Observable<ArrayBuffer> => new Observable(obs => {
    const reader = new FileReader();

    reader.onerror = err => obs.error(err);
    reader.onabort = err => obs.error(err);
    reader.onload = () => obs.next(reader.result as ArrayBuffer);
    reader.onloadend = () => obs.complete();

    return reader.readAsArrayBuffer(blob);
});

export default fileObservable;