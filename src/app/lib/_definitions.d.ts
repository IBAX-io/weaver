/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'react-dom';
declare module 'jsrsasign';
declare module 'react-router-transition';
declare module 'html2json';
declare module 'react-contenteditable';

declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.json' {
    const content: any;
    export default content;
}