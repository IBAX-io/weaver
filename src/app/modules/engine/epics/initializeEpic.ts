/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { Observable } from 'rxjs';
import { initialize, setLocale } from '../actions';
import platform from 'lib/platform';
import { saveWallet, savePreconfiguredNetworks } from 'modules/storage/actions';
import { publicToID } from 'lib/crypto';
import keyring from 'lib/keyring';
import { INetwork } from 'ibax/auth';
import webConfig from 'lib/settings/webConfig';
import localeConfig from 'lib/settings/localeConfig';
import ConfigObservable from '../util/ConfigObservable';
import { acquireSession } from 'modules/auth/actions';
import { Action } from 'redux';

const DEFAULT_NETWORK = '__DEFAULT';

const initializeEpic: Epic = (action$, store, { defaultPassword }) => action$.ofAction(initialize.started)
  .flatMap(action => {
    return Observable.zip(
      ConfigObservable('settings').flatMap(result => webConfig.validate(result)),
      ConfigObservable('locales/index').flatMap(result => localeConfig.validate(result))

    ).flatMap(([config, locales]) => {
      const state = store.getState();
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

      if (platform.args.privateKey) {
        const publicKey = keyring.generatePublicKey(platform.args.privateKey);
        const keyID = publicToID(publicKey);

        var preconfiguredKey = {
          id: keyID,
          encKey: keyring.encryptAES(platform.args.privateKey, defaultPassword),
          publicKey
        };
      }

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

      return Observable.concat<Action>(
        Observable.if(
          () => !!preconfiguredKey,
          Observable.of(saveWallet(preconfiguredKey)),
          Observable.empty<never>()
        ),
        Observable.of(savePreconfiguredNetworks(preconfiguredNetworks)),
        Observable.of(initialize.done({
          params: action.payload,
          result: {
            defaultNetwork: defaultNetworkSet ? DEFAULT_NETWORK : config.defaultNetwork,
            preconfiguredNetworks,
            locales: locales.locales
          }
        })),
        Observable.of(setLocale.started(state.storage.locale || config.defaultLocale)),
        Observable.if(
          () => store.getState().auth.isAuthenticated && !!store.getState().auth.session,
          Observable.of(acquireSession.started(store.getState().auth.session)),
          Observable.empty()
        )
      );
    }).catch(e => Observable.of(initialize.failed({
      params: action.payload,
      error: e
    })));
  });

export default initializeEpic;