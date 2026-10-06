/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// react-redux hooks typed for this store: typescript-fsa actions and the root state
import { Action, Dispatch } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from 'modules';

export const useAppDispatch = useDispatch.withTypes<Dispatch<Action>>();
export const useAppSelector = useSelector.withTypes<IRootState>();
