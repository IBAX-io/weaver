/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/content' {
  import { TProtypoElement } from 'ibax/protypo';
  import { Location } from 'history';

  interface IMenu {
    readonly name: string;
    readonly content: TProtypoElement[];
  }

  type TBreadcrumbType =
    'MENU' | 'PAGE' | 'IGNORE';

  type TPageParams = {
    [key: string]: string;
  }

  interface IBreadcrumb {
    readonly caller: string;
    readonly type: TBreadcrumbType;
    readonly section: string;
    readonly title: string;
    readonly page: string;
    readonly params: TPageParams;
  }

  type TPageStatus =
    'PENDING' | 'LOADED' | 'ERROR';

  interface IPage {
    readonly name: string;
    readonly status: TPageStatus;
    readonly static: boolean;
    readonly content: TProtypoElement[];
    readonly params: TPageParams;
    readonly error?: string;
    readonly location: Location;
  }

  interface ISection {
    readonly index: number;
    readonly name: string;
    readonly title: string;
    readonly defaultPage: string;
    readonly breadcrumbs: IBreadcrumb[];
    readonly menus: IMenu[];
    readonly page?: IPage;
  }
}