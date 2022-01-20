/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISection, TBreadcrumbType } from 'ibax/content';

const changeBreadcrumbType = (section: ISection, page: string, type: TBreadcrumbType) => {
    return section.breadcrumbs.map(b => {
        if (page === b.page) {
            return {
                ...b,
                type
            };
        }
        else {
            return b;
        }
    });
};

export default changeBreadcrumbType;