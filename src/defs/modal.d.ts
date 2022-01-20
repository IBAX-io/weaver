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
    params: {
      [key: string]: any;
    }
  }

  interface IModalCloseCall {
    reason: TModalResultReason;
    data: any;
  }

  interface IModal {
    id: string;
    type: string;
    result: IModalResult;
    params: {
      [key: string]: any;
    }
  }
}