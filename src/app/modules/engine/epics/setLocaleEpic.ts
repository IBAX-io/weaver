/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Observable } from 'rxjs';
import { Epic } from 'redux-observable';
import { IRootState } from 'modules';
import { setLocale } from '../actions';
import { addLocaleData } from 'react-intl';
import { saveLocale } from 'modules/storage/actions';
import platform from 'lib/platform';
import urlJoin from 'url-join';

const defaultLocale = 'en-US';

const setLocaleEpic: Epic<Action, IRootState> =
    (action$, store) => action$.ofAction(setLocale.started)
        .delay(0)
        .flatMap(action => {
            const loadLocale = action.payload || defaultLocale;
            const requestUrl = platform.select({
                web: urlJoin(process.env.PUBLIC_URL || location.origin, `locales/${loadLocale}.json`),
                desktop: `./locales/${loadLocale}.json`
            });

            return Observable
                .ajax(requestUrl)
                .flatMap(result => {
                    if ('json' === result.responseType) {
                        addLocaleData({
                            locale: loadLocale,
                            fields: result.response,
                            pluralRuleFunction: (n: number, ord: boolean) => n.toString()
                        });
                        return Observable.of<Action>(
                            saveLocale(loadLocale),
                            setLocale.done({
                                params: action.payload,
                                result: {
                                    locale: loadLocale,
                                    values: result.response
                                }
                            })
                        ).delay(1);
                    }
                    else {
                        throw 'E_FAILED';
                    }
                })
                .catch(e => Observable.of<Action>(
                    saveLocale(defaultLocale),
                    setLocale.done({
                        params: defaultLocale,
                        result: {
                            locale: defaultLocale,
                            values: {}
                        }
                    }),
                ));
        });

export default setLocaleEpic;