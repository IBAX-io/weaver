/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import * as actions from '../actions';
import { IRootState } from 'modules';

const changePageEpic: Epic<Action, IRootState> =
    (action$, store, { constructorModule }) => action$.ofAction(actions.changePage.started)
        .map(action => {
            const state = store.getState().editor;
            const tabData = state.tabs[state.tabIndex].designer.data;
            let jsonData = tabData && constructorModule.copyObject(tabData.jsonData) || null;
            let selectedTag = tabData && tabData.selectedTag || null;

            let tag = constructorModule.findTagById(jsonData, action.payload.tagID).el;
            if (tag) {
                if (typeof (action.payload.text) !== 'undefined') {
                    tag.children = constructorModule.html2childrenTags(action.payload.text);
                }

                if (!tag.attr) {
                    tag.attr = {};
                }

                if ('string' === typeof action.payload.attrName) {
                    let properties = new constructorModule.Properties();
                    const value = action.payload.attrValue;
                    switch (action.payload.attrName) {
                        case 'align':
                            tag.attr.class = properties.updateClassList(tag.attr.class || '', 'align', value);
                            break;
                        case 'transform':
                            tag.attr.class = properties.updateClassList(tag.attr.class || '', 'transform', value);
                            break;
                        case 'wrap':
                            tag.attr.class = properties.updateClassList(tag.attr.class || '', 'wrap', value);
                            break;
                        case 'color':
                            tag.attr.class = properties.updateClassList(tag.attr.class || '', 'color', value);
                            break;
                        case 'btn':
                            tag.attr.class = properties.updateClassList(tag.attr.class || '', 'btn', value);
                            break;
                        default:
                            tag.attr[action.payload.attrName] = value;
                            break;
                    }
                }
            }

            jsonData = constructorModule.updateChildrenText(jsonData);

            if (selectedTag && tag && selectedTag.id === tag.id) {
                selectedTag = constructorModule.copyObject(tag);
            }

            return actions.changePage.done({
                params: action.payload,
                result: {
                    jsonData,
                    treeData: constructorModule.convertToTreeData(jsonData),
                    selectedTag
                }
            });

        });

export default changePageEpic;