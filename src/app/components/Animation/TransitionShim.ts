/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Shim to work around @types/react-transition-group incompatibility with @types/react 16
import Transition from 'react-transition-group/Transition';
export default Transition as any;
