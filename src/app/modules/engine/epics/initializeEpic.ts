/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { EMPTY, concat, defer, iif, of, zip } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { initialize, setLocale } from '../actions';
import platform from 'lib/platform';
import desktop from 'lib/desktop';
import { saveWallet, savePreconfiguredNetworks } from 'modules/storage/actions';
import { createWallet, isValidPrivateKey } from 'lib/keyring';
import { INetwork } from 'ibax/auth';
import webConfig from 'lib/settings/webConfig';
import { validateLocaleConfig } from 'lib/settings/localeConfig';
import ConfigObservable from '../util/ConfigObservable';
import { acquireSession } from 'modules/auth/actions';

const DEFAULT_NETWORK = '__DEFAULT';

const initializeEpic: Epic = (action$, state$, { defaultPassword }) => action$.pipe(
  ofAction(initialize.started),
  mergeMap(action => {
    return zip(
      ConfigObservable('settings').pipe(mergeMap(result => webConfig.validate(result))),
      ConfigObservable('locales/index').pipe(mergeMap(result => validateLocaleConfig(result)))

    ).pipe(mergeMap(([config, locales]) => {
      const state = state$.value;
      const preconfiguredNetworks: INetwork[] = [];
      let defaultNetworkSet = false;

      if (platform.args.dry && platform.args.fullNode && 'number' === typeof platform.args.networkID) {
        defaultNetworkSet = true;
        preconfiguredNetworks.push({
          uuid: DEFAULT_NETWORK,
          id: platform.args.networkID,
          name: platform.args.networkName,
          honorNodes: platform.args.fullNode,
          socketUrl: platform.args.socketUrl,
          activationEmail: platform.args.activationEmail,
          disableSync: platform.args.disableHonorNodesSync,
          demoEnabled: platform.args.guestMode
        });
      }

      // A key passed on the command line of a --dry run (throwaway profile) is stored as a wallet
      // protected by the default password
      const launchKey = desktop ? desktop.takeLaunchKey() : null;
      const preconfiguredWallet = isValidPrivateKey(launchKey)
        ? defer(() => createWallet(launchKey, defaultPassword)).pipe(map(wallet => saveWallet(wallet)))
        : EMPTY;

      config.networks.forEach(network => preconfiguredNetworks.push({
        uuid: network.key,
        id: network.networkID,
        name: network.name,
        honorNodes: network.honorNodes,
        socketUrl: network.socketUrl,
        activationEmail: network.activationEmail,
        disableSync: network.disableSync,
        demoEnabled: network.enableDemoMode
      }));

      return concat(
        preconfiguredWallet,
        of(savePreconfiguredNetworks(preconfiguredNetworks)),
        of(initialize.done({
          params: action.payload,
          result: {
            defaultNetwork: defaultNetworkSet ? DEFAULT_NETWORK : config.defaultNetwork,
            preconfiguredNetworks,
            locales: locales.locales
          }
        })),
        of(setLocale.started(state.storage.locale || config.defaultLocale)),
        iif(
          () => state$.value.auth.isAuthenticated && !!state$.value.auth.session,
          of(acquireSession.started(state$.value.auth.session)),
          EMPTY
        )
      );
    }), catchError(e => of(initialize.failed({
      params: action.payload,
      error: e
    }))));
  })
);

export default initializeEpic;