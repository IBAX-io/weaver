/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { copyObject, idGenerator, setIds } from 'lib/constructor';
import constructorTemplates from 'lib/constructor/templates.json';

export default function getConstructorTemplate(name: string) {
    let template = copyObject(constructorTemplates[name]);
    template.id = idGenerator.generateId();
    if (template.children) {
        setIds(template.children, true);
    }
    return template;
}