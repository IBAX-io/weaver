/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import actionCreatorFactory from 'typescript-fsa';
import { RouterState } from 'connected-react-router';

const actionCreator = actionCreatorFactory('@@router');

export const locationChange = actionCreator<RouterState>('LOCATION_CHANGE');