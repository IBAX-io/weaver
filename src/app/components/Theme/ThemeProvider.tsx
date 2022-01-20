/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ThemeProvider as ThemeProviderNative, ThemeProviderComponent } from 'styled-components';
import { IThemeDefinition } from 'ibax/theme';

const ThemeProvider: ThemeProviderComponent<IThemeDefinition> = ThemeProviderNative as ThemeProviderComponent<IThemeDefinition>;

export default ThemeProvider;