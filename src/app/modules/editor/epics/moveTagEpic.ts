/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import * as actions from '../actions';
import { IRootState } from 'modules';

const moveTagEpic: Epic<Action, IRootState> =
  (action$, store, { constructorModule }) => action$.ofAction(actions.moveTag.started)
    .map(action => {
      const state = store.getState().editor;
      const tab = state.tabs[state.tabIndex].designer;
      const tabData = tab && tab.data || null;
      let jsonData = tabData.jsonData && constructorModule.copyObject(tabData.jsonData) || null;

      let tagCopy = constructorModule.copyObject(action.payload.tag);
      tagCopy.id = constructorModule.idGenerator.generateId();

      let moved = false;

      if ('string' === typeof action.payload.destinationTagID &&
        'string' === typeof action.payload.position) {
        let tag = constructorModule.findTagById(jsonData, action.payload.destinationTagID);
        if (tag.el) {
          switch (action.payload.position) {
            case 'inside':
              const Handler = constructorModule.resolveTagHandler(tag.el.tag);
              if (Handler) {
                const Tag = new Handler();
                if (Tag.canHaveChildren) {
                  if (!tag.el.children) {
                    tag.el.children = [];
                  }
                  tag.el.children.push(tagCopy);
                  moved = true;
                }
              }
              break;
            case 'before':
              if (tag.parent && tag.parent.id && tag.parent.children) {
                tag.parent.children.splice(tag.parentPosition, 0, tagCopy);
              }
              else {
                jsonData.splice(tag.parentPosition, 0, tagCopy);
              }
              moved = true;
              break;
            case 'after':
              if (tag.parent && tag.parent.id && tag.parent.children) {
                tag.parent.children.splice(tag.parentPosition + 1, 0, tagCopy);
              }
              else {
                jsonData.splice(tag.parentPosition + 1, 0, tagCopy);
              }
              moved = true;
              break;
            default:
              break;
          }
        }
      }
      else {
        jsonData = jsonData.concat(
          tagCopy
        );
        moved = true;
      }

      if (moved) {
        let sourceTag = constructorModule.findTagById(jsonData.concat(), action.payload.tag.id);
        if (sourceTag.parent) {
          sourceTag.parent.children.splice(sourceTag.parentPosition, 1);
        }
        else {
          // root
          jsonData.splice(sourceTag.parentPosition, 1);
        }
      }

      jsonData = constructorModule.updateChildrenText(jsonData);

      return actions.moveTag.done({
        params: action.payload,
        result: {
          jsonData,
          treeData: constructorModule.convertToTreeData(jsonData)
        }
      });
    });

export default moveTagEpic;