/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { actionCreatorFactory } from 'typescript-fsa';
import { INavigateCall, IRouterState } from './types';

const actionCreator = actionCreatorFactory('router');

// Emitted by the router whenever the current location changes (including the initial one)
export const locationChange = actionCreator<IRouterState>('LOCATION_CHANGE');

// Asks the router to go somewhere; performed by navigationEpic
export const navigate = actionCreator<INavigateCall>('NAVIGATE');
