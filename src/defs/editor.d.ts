/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/editor' {
  import { TProtypoElement } from 'ibax/protypo';

  type TConstructorData = {
    jsonData: TProtypoElement[],
    treeData?: TConstructorTreeElement[],
    pageTemplate?: string,
    selectedTag?: TProtypoElement
  };

  type TConstructorTreeElement = {
    title: string,
    children?: TConstructorTreeElement[],
    expanded?: boolean,
    id?: string,
    selected: boolean,
    logic: boolean,
    canMove: boolean,
    canDrop: boolean,
    tag?: TProtypoElement
  };

  type TEditorTab = {
    readonly type: string;
    readonly uuid: string;
    readonly id: string;
    readonly new: boolean;
    readonly name: string;
    readonly tool: string;
    readonly value: string;
    readonly initialValue: string;
    readonly preview?: TProtypoElement[];
    readonly designer?: {
      data: TConstructorData,
      history?: {
        data: TProtypoElement[][],
        position?: number,
        canUndo?: boolean,
        canRedo?: boolean
      };
    };
    readonly dirty: boolean;
    readonly appId?: number;
  };

  interface IEditorTabCreateCall {
    uuid: string;
    id: string;
    name: string;
    value: string
  }

  interface ILoadEditorTabCall {
    type: string;
    name: string;
  }

  interface IReloadEditorTabCall {
    type: string;
    id: string;
    data: Partial<TEditorTab>;
  }

  interface IChangePageCall {
    text?: string;
    attrName?: string;
    attrValue?: string;
    canDropPosition?: string;
    tagID: string;
    pageID?: string;
  }

  interface IChangePageResult {
    jsonData: TProtypoElement[];
    treeData: TConstructorTreeElement[];
    selectedTag?: TProtypoElement;
  }

  interface IGetPageTreeResult {
    name?: string;
    jsonData: TProtypoElement[];
    treeData?: TConstructorTreeElement[];
    error?: string;
  }

  interface IAddTagCall {
    tag: ISourceElement;
    destinationTagID?: string;
    position?: string;
  }

  interface IOperateTagCall {
    tag: TProtypoElement;
    destinationTagID?: string;
    position?: string;
  }

  interface IOperateTagResult {
    jsonData: TProtypoElement[];
    treeData: TConstructorTreeElement[];
  }

  interface IMoveTreeTag {
    treeData: TConstructorTreeElement[];
    tagID: string;
  }

  interface ISaveConstructorHistoryResult {
    data: TProtypoElement[][];
    position: number;
    canUndo: boolean;
    canRedo: boolean;
  }

  interface IConstructorUndoRedoResult {
    position: number;
    canUndo: boolean;
    canRedo: boolean;
    jsonData: TProtypoElement[];
    treeData: TConstructorTreeElement[];
  }

  interface ISetTagCanDropPositionCall {
    tagID: string;
    position: string;
  }

  interface ISetTagCanDropPositionResult {
    jsonData: TProtypoElement[];
    treeData: TConstructorTreeElement[];
  }

  interface ISelectTagResult {
    selectedTag: TProtypoElement;
    treeData: TConstructorTreeElement[];
  }

  interface ISourceElement {
    new: boolean;
    element: string;
    template?: string;
    text?: string;
  }

  interface IConstructorElementProps {
    editable?: boolean;
    selected?: boolean;
    logic?: boolean;
    changePage?: (attrs: IChangePageCall) => void;
    setTagCanDropPosition?: (attrs: ISetTagCanDropPositionCall) => void;
    addTag?: (attrs: IAddTagCall) => void;
    copyTag?: (attrs: IOperateTagCall) => void;
    moveTag?: (attrs: IOperateTagCall) => void;
    removeTag?: (attrs: IOperateTagCall) => void;
    selectTag?: (attrs: TProtypoElement) => void;
    selectedTag?: TProtypoElement;
    tag?: TProtypoElement;
    canDropPosition?: string;
    isOver?: boolean;
    isDragging?: boolean;

    connectDropTarget?: any;
    connectDragSource?: any;
    connectDragPreview?: any;
  }

  interface IFindTagResult {
    el: TProtypoElement | null;
    parent: TProtypoElement | null,
    parentPosition: number,
    tail: boolean
  }
}