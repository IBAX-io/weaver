/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, delay, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { setLocale } from '../actions';
import { addLocaleData } from 'react-intl';
import { saveLocale } from 'modules/storage/actions';
import platform from 'lib/platform';
import urlJoin from 'url-join';

const defaultLocale = 'en-US';

const setLocaleEpic: Epic =
    action$ => action$.pipe(
        ofAction(setLocale.started),
        delay(0),
        mergeMap(action => {
            const loadLocale = action.payload || defaultLocale;
            const requestUrl = platform.select({
                web: urlJoin(import.meta.env.BASE_URL, `locales/${loadLocale}.json`),
                desktop: `./locales/${loadLocale}.json`
            });

            return ajax<{ [key: string]: string }>(requestUrl).pipe(
                mergeMap(result => {
                    // A locale file that is not valid JSON parses to null; fall back instead of
                    // saving a locale that has no messages
                    if (result.response && 'object' === typeof result.response) {
                        addLocaleData({
                            locale: loadLocale,
                            fields: result.response,
                            pluralRuleFunction: (n: number, ord: boolean) => n.toString()
                        });
                        return of(
                            saveLocale(loadLocale),
                            setLocale.done({
                                params: action.payload,
                                result: {
                                    locale: loadLocale,
                                    values: result.response
                                }
                            })
                        ).pipe(delay(1));
                    }
                    else {
                        throw 'E_FAILED';
                    }
                }),
                catchError(e => of(
                    saveLocale(defaultLocale),
                    setLocale.done({
                        params: defaultLocale,
                        result: {
                            locale: defaultLocale,
                            values: {}
                        }
                    }),
                ))
            );
        })
    );

export default setLocaleEpic;