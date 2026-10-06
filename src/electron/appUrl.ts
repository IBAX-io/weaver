/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { app } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import args from './args';
import { isLoopbackUrl } from './util/navigation';

// The page the window shows: the built index.html next to electron/, or, when running from source
// (npm run dev-desktop), a Vite dev server on this machine. A packaged app never loads a page
// named on its command line: that page would get the bridge to the stored wallets.
export const appUrl = !app.isPackaged && isLoopbackUrl(args.devServer)
    ? args.devServer
    : pathToFileURL(path.join(import.meta.dirname, '..', 'index.html')).href;
