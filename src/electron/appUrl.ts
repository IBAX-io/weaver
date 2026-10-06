/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import args from './args';
import { isExternalUrlAllowed } from './util/navigation';

// The page the window shows: the built index.html next to electron/, or with
// --dev-server=<http(s) url> the Vite dev server (npm run dev-desktop)
export const appUrl = args.devServer && isExternalUrlAllowed(args.devServer)
    ? args.devServer
    : pathToFileURL(path.join(import.meta.dirname, '..', 'index.html')).href;
