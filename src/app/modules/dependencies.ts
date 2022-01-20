/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IbaxAPI from 'lib/ibaxAPI';
import CodeGenerator, { setIds, convertToTreeData, findTagById, copyObject, idGenerator, updateChildrenText, html2childrenTags } from 'lib/constructor';
import Properties from 'lib/constructor/properties';
import getConstructorTemplate from 'lib/constructor/templates';
import resolveTagHandler from 'lib/constructor/tags';
import * as routerService from 'services/router';
import 'whatwg-fetch';

export interface IStoreDependencies {
    api: IAPIDependency;
    defaultKey: string;
    defaultPassword: string;
    constructorModule: IConstructorDependenies;
    routerService: typeof routerService;
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
    defaultKey: 'e5a87a96a445cb55a214edaad3661018061ef2936e63a0a93bdb76eb28251c1f',
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
    routerService
};

export default storeDependencies;