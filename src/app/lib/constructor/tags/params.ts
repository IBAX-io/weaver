/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const params = {
    'alt': 'Alt',
    'app': 'App',
    'appid': 'AppID',
    'body': 'Body',
    'class': 'Class',
    'cancelbutton': 'CancelButton',
    'column': 'Column',
    'columns': 'Columns',
    'colors': 'Colors',
    'condition': 'Condition',
    'confirmbutton': 'ConfirmButton',
    'contract': 'Contract',
    'data': 'Data',
    'datetime': 'DateTime',
    'disabled': 'Disabled',
    'exp': 'Exp',
    'fieldlabel': 'FieldLabel',
    'fieldvalue': 'FieldValue',
    'for': 'For',
    'format': 'Format',
    'from': 'From',
    'icon': 'Icon',
    'hmap': 'Hmap',
    'index': 'Index',
    'interval': 'Interval',
    'lang': 'Lang',
    'limit': 'Limit',
    'maptype': 'MapType',
    'memberid': 'MemberID',
    'minlength': 'minLength',
    'maxlength': 'maxLength',
    'name': 'Name',
    'namecolumn': 'NameColumn',
    'page': 'Page',
    'pageparams': 'PageParams',
    'params': 'Params',
    'placeholder': 'Placeholder',
    'prec': 'Prec',
    'prefix': 'Prefix',
    'ratio': 'Ratio',
    'source': 'Source',
    'src': 'Src',
    'step': 'Step',
    'style': 'Style',
    'table': 'table',
    'text': 'Text',
    'time1': 'Time1',
    'time2': 'Time2',
    'title': 'Title',
    'to': 'To',
    'type': 'Type',
    'value': 'Value',
    'valuecolumn': 'ValueColumn',
    'vde': 'Vde',
    'width': 'Width',
    'where': 'Where'
};

const LogicTagNames = {
    'getvar': 'GetVar',
    'setvar': 'SetVar',
    'addtoolbutton': 'AddToolButton',
    'linkpage': 'LinkPage',
    'and': 'And',
    'calculate': 'Calculate',
    'cmptime': 'CmpTime',
    'datetime': 'DateTime',
    'dbfind': 'DBFind',
    'now': 'Now',
    'or': 'Or',
    'code': 'Code',
    'chart': 'Chart',
    'forlist': 'ForList',
    'menugroup': 'MenuGroup',
    'menuitem': 'MenuItem',
    'qrcode': 'QRcode',
    'address': 'Address',
    'appparam': 'AppParam',
    'data': 'Data',
    'ecosysparam': 'EcosysParam',
    'jsontosource': 'JsonToSource',
    'langres': 'LangRes',
    'range': 'Range',
    'sysparam': 'SysParam',
    'binary': 'Binary',
    'settitle': 'SetTitle',
    'inputerr': 'InputErr',
    'select': 'Select',
    'inputmap': 'InputMap',
    'inputMap': 'InputMap',
    'map': 'Map',
    'include': 'Include'
};

const TailTagNames = {
    'alert': 'Alert',
    'columns': 'Columns',
    'count': 'Count',
    'custom': 'Custom',
    'ecosystem': 'Ecosystem',
    'limit': 'Limit',
    'offset': 'Offset',
    'order': 'Order',
    'popup': 'Popup',
    'style': 'Style',
    'vars': 'Vars',
    'validate': 'Validate',
    'where': 'Where',
    'whereid': 'WhereId'
};

export function getTailTagName(name: string) {
    return TailTagNames[name] || name;
}

export function getLogicTagName(name: string) {
    return LogicTagNames[name] || name;
}

export default function getParamName(name: string) {
    return params[name] || name;
}