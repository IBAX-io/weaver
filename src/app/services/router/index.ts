
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

// Page params are single strings: a repeated parameter keeps its first value and a bare flag is
// empty (query-string returns arrays and null for those)
const singleValues = (query: querystring.ParsedQuery) => Object.fromEntries(Object.entries(query).map(([name, value]) =>
  [name, (Array.isArray(value) ? value[0] : value) ?? '']
));

export const matchRoute = (path: string, match: string): IRouteMatch | undefined => {
  const route = new Route(path).match(match);
  if (!route) {
    return undefined;
  }

  return {
    parts: route,
    query: singleValues(querystring.parseUrl(match).query)
  };
};

export const generateRoute = (path: string, params?: { [name: string]: string }) => {
  const query = params ? querystring.stringify(params) : '';
  return `${path}${query && '?' + query}`;
};

export const routeToBrowser = (section: string, page: string, params?: { [name: string]: string }) => {
  return generateRoute(`/browse/${section}/${page}`, params);
}
