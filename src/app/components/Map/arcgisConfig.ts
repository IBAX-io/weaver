/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import esriConfig from '@arcgis/core/config.js';

/*
 * @arcgis/core loads its workers, wasm and localization files from js.arcgis.com unless assetsPath
 * is set. The build copies node_modules/@arcgis/core/assets to `arcgis-assets/` next to index.html,
 * so no remote code is loaded into the (privileged) application window.
 */
const ARCGIS_ASSETS_DIR = 'arcgis-assets';

esriConfig.assetsPath = `${import.meta.env.BASE_URL}${ARCGIS_ASSETS_DIR}`;
