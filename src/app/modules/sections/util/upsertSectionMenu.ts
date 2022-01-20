/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IMenu, ISection } from 'ibax/content';
import findMenu from './findMenu';

const upsertSectionMenu = (section: ISection, menu: IMenu): ISection => {
    const menuIndex = findMenu(section, menu.name);
    let menus: IMenu[];

    if (-1 !== menuIndex) {
        menus = [
            ...section.menus.slice(0, menuIndex),
            {
                ...section.menus[menuIndex],
                ...menu
            }
        ];
    }
    else {
        menus = [
            ...section.menus,
            menu
        ];
    }

    return {
        ...section,
        menus
    };
};

export default upsertSectionMenu;