
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Route from 'route-parser';
import querystring from 'query-string';

export interface IRouteMatch {
  parts: {
    [name: string]: string;
  };
  query: {
    [param: string]: string;
  };
}

export const matchRoute = (path: string, match: string): IRouteMatch | undefined => {
  const route = new Route(path).match(match);
  if (!route) {
    return undefined;
  }

  return {
    parts: route,
    query: querystring.parseUrl(match).query
  };
};

export const generateRoute = (path: string, params?: { [name: string]: string }) => {
  const query = params ? querystring.stringify(params) : '';
  return `${path}${query && '?' + query}`;
};

export const routeToBrowser = (section: string, page: string, params?: { [name: string]: string }) => {
  return generateRoute(`/browse/${section}/${page}`, params);
}
