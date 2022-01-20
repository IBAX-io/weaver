/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import actionCreatorFactory from 'typescript-fsa';
import { IMenu, ISection } from 'ibax/content';
import { TProtypoElement } from 'ibax/protypo';
import { Location } from 'history';

const actionCreator = actionCreatorFactory('sections');

export const updateSection = actionCreator<ISection>('UPDATE_SECTION');
export const menuPop = actionCreator<string>('MENU_POP');
export const menuPush = actionCreator<{ section: string, menu: IMenu }>('MENU_PUSH');
export const renderPage = actionCreator.async<{ section: string, name: string, popup?: { title?: string, width?: number }, params: { [key: string]: string }, location: Location }, { tree: TProtypoElement[], menu: string, menuTree: TProtypoElement[], static: boolean }, string>('RENDER_PAGE');
export const reloadPage = actionCreator<{ section: string }>('RELOAD_PAGE');
export const sectionsInit = actionCreator<{ mainSection: string, sections: { [name: string]: ISection } }>('SECTIONS_INIT');
