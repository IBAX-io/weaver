/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The utility process the PKCS#11 module runs in (service.ts starts it): vendor code that
// crashes or hangs takes this process down, not the app. Requests are served one at a time.
import { createPkcs11Dispatcher } from './dispatcher';
import { IHostReply, IHostRequest } from './protocol';

const dispatch = createPkcs11Dispatcher();
const port = process.parentPort;

port.on('message', ({ data }: { data: IHostRequest }) => {
    const reply: IHostReply = { id: data.id, result: dispatch(data.request) };
    port.postMessage(reply);
});

process.on('exit', () => dispatch.close());
