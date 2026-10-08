/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';

export interface IDataPreloaderProps {
  data: any[];
  children: React.JSX.Element;
}

// Renders children only once every entry of `data` is loaded (truthy)
const DataPreloader: React.FC<IDataPreloaderProps> = (props) =>
  props.data.some((l) => !l) ? null : props.children;

export default DataPreloader;
