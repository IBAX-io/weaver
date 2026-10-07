/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IbaxAPI from 'lib/ibaxAPI';
import ExplorerAPI from 'lib/explorer';
import CodeGenerator, { setIds, convertToTreeData, findTagById, copyObject, idGenerator, updateChildrenText, html2childrenTags } from 'lib/constructor';
import Properties from 'lib/constructor/properties';
import getConstructorTemplate from 'lib/constructor/templates';
import resolveTagHandler from 'lib/constructor/tags';
import * as routerService from 'services/router';
import { navigationService } from 'lib/routing/navigation';
import { INavigationService } from 'modules/router/types';

export interface IStoreDependencies {
    api: IAPIDependency;
    // The network's block explorer API, by its base URL (INetwork.explorer)
    explorer: (base: string) => ExplorerAPI;
    defaultKey: string;
    defaultPassword: string;
    constructorModule: IConstructorDependenies;
    routerService: typeof routerService;
    navigation: INavigationService;
}

export interface IAPIDependency {
    (options: { apiHost: string, sessionToken?: string }): IbaxAPI;
}

interface IConstructorDependenies {
    setIds: typeof setIds;
    convertToTreeData: typeof convertToTreeData;
    findTagById: typeof findTagById;
    copyObject: typeof copyObject;
    getConstructorTemplate: typeof getConstructorTemplate;
    idGenerator: typeof idGenerator;
    updateChildrenText: typeof updateChildrenText;
    html2childrenTags: typeof html2childrenTags;
    resolveTagHandler: typeof resolveTagHandler;
    CodeGenerator: typeof CodeGenerator;
    Properties: typeof Properties;
}

const storeDependencies: IStoreDependencies = {
    api: (params: { apiHost: string, sessionToken?: string } = { apiHost: null }) => new IbaxAPI({
        apiHost: params.apiHost,
        session: params.sessionToken
    }),
    explorer: (base: string) => new ExplorerAPI(base),
    // Public guest (Demo mode) key, the same one the official IBAX Weaver ships
    defaultKey: 'fa2692876f3efb8b5abeda1b69423cfcd38de897506a2778e5eb0803a6e4a2de',
    defaultPassword: 'default',
    constructorModule: {
        setIds,
        convertToTreeData,
        findTagById,
        copyObject,
        getConstructorTemplate,
        idGenerator,
        updateChildrenText,
        html2childrenTags,
        resolveTagHandler,
        CodeGenerator,
        Properties
    },
    routerService,
    navigation: navigationService
};

export default storeDependencies;