/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import actionCreatorFactory from 'typescript-fsa';
import { push } from 'connected-react-router';
import NetworkError from 'services/network/errors';
import { ISession, INetwork } from 'ibax/auth';
import { IFatalError, ILocale } from 'ibax';

const actionCreator = actionCreatorFactory('engine');
export const navigate = (url: string) => push(url);
export const initialize = actionCreator.async<{}, { defaultNetwork: string, preconfiguredNetworks: INetwork[], locales: ILocale[] }, IFatalError>('INITIALIZE');
export const discoverNetwork = actionCreator.async<{ uuid: string }, { session: ISession }, NetworkError>('DISCOVER_NETWORK');
export const addNetwork = actionCreator.async<{ name: string, networkID?: number, apiHost: string }, void>('ADD_NETWORK');
export const setLocale = actionCreator.async<string, { locale: string, values: { [key: string]: string } }>('SET_LOCALE');