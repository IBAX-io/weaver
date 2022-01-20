/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const sendAttachment = (filename: string, data: string, mime = 'text/plain') => {
    const blob = new Blob([data], { type: `${mime};charset=utf-8;` });
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
    }
    else {
        const link = document.createElement('a');
        link.setAttribute('download', filename);
        link.setAttribute('style', 'display:none');
        link.href = window.URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const readTextFile = (file: Blob) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const loadedFile = (e.target as any).result;
            loadedFile ? resolve(loadedFile) : reject();
        };
        reader.readAsText(file);
    });
};

export const readBinaryFile = (file: Blob) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const loadedFile = reader.result;
            loadedFile ? resolve(loadedFile) : reject();
        };
        reader.readAsDataURL(file);
    });
};