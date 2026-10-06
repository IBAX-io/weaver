/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/modal' {
  type TModalResultReason =
    // Dispatched when Modal component received active=false while modal was visible
    'CANCEL' |

    // Dispatched when another modal window overlays the current one
    'OVERLAP' |

    // Dispatched when clicked outside or close button was clicked
    'CLOSE' |

    // Dispatched when correct result was yielded
    'RESULT';

  interface IModalResult {
    reason: TModalResultReason;
    data: any;
  }

  interface IModalCall {
    id: string;
    type: string;
    // The result is a secret (e.g. a password): delivered with modalClose, never kept in state
    secret?: boolean;
    params: {
      [key: string]: any;
    }
  }

  // id: the modal being closed. Whoever waits for a modal's result must filter on it.
  interface IModalCloseCall {
    id: string;
    reason: TModalResultReason;
    data: any;
  }

  interface IModal {
    id: string;
    type: string;
    secret?: boolean;
    result: IModalResult;
    params: {
      [key: string]: any;
    }
  }
}