/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as _ from 'lodash';
import syntax from './monarch';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const langName = 'protypo';

const register = (editor: typeof monaco) => {
  if (monaco.languages.getLanguages().find(l => langName === l.id)) {
    return;
  }

  const staticParamTypes = {
    Body: {
      label: 'Body',
      kind: monaco.languages.CompletionItemKind.Property,
      documentation: 'Contents of this element',
      insertText: 'Body: '
    },
    Class: {
      label: 'Class',
      kind: monaco.languages.CompletionItemKind.Property,
      documentation: 'HTML class value',
      insertText: 'Class: '
    }
  };

  const functionDefs = {
    Address: {
      label: 'Address',
      documentation: 'Converts wallet ID to address in readable format',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'Address(',
      params: [
        {
          label: 'Wallet',
          documentation: 'Wallet ID to convert',
          insertText: 'Wallet: '
        }
      ]
    },
    AddToolButton: {
      label: 'AddToolButton',
      documentation: 'Add a tool button to the page header',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'AddToolButton(',
      params: [
        {
          label: 'Title',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Button title to show',
          insertText: 'Title:'
        },
        {
          label: 'Icon',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Optional icon to show near the button',
          insertText: 'Icon: '
        },
        {
          label: 'Page',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Page that will be loaded on click',
          insertText: 'Page: '
        },
        {
          label: 'PageParams',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Parameters which will be passed to the page upon redirection',
          insertText: 'Params: '
        }
      ]
    },
    And: {
      label: 'And',
      documentation: 'Logical "And" operator. All parameters must be truthy',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'And('
    },
    ArrayToSource: {
      label: 'ArrayToSource',
      documentation: 'Data emitter that converts JSON array to a source',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'ArrayToSource(',
      params: [
        {
          label: 'Source',
          documentation: 'Source identificator to bind results',
          insertText: 'Source: '
        },
        {
          label: 'Data',
          documentation: 'Emitted data that must be a valid json-formatted string',
          insertText: 'Data: '
        }
      ]
    },
    DBFind: {
      label: 'DBFind',
      documentation: 'Database search',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'DBFind(',
      params: [
        {
          label: 'Name',
          documentation: 'Table name to search',
          insertText: 'Name: '
        },
        {
          label: 'Source',
          documentation: 'Source identificator to bind results',
          insertText: 'Source: '
        }
      ]
    },
    Button: {
      label: 'Button',
      documentation: 'Button element',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Button(',
      params: [
        staticParamTypes.Body,
        staticParamTypes.Class,
        {
          label: 'Page',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Page to redirect after successful action',
          insertText: 'Page: '
        },
        {
          label: 'Contract',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Contract name to execute (case-sensitive)',
          insertText: 'Contract: '
        },
        {
          label: 'Params',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Contract execution parameters (case-sensitive)',
          insertText: 'Params: '
        },
        {
          label: 'PageParams',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Parameters which will be passed to the page upon successful redirection',
          insertText: 'PageParams: '
        }
      ]
    },
    Data: {
      label: 'Data',
      documentation: 'Data emitter that is filled with data by hand',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'Data(',
      params: [
        {
          label: 'Source',
          documentation: 'Source identificator to bind results',
          insertText: 'Source: '
        },
        {
          label: 'Columns',
          documentation: 'List of columns separated with comma',
          insertText: 'Columns: '
        },
        {
          label: 'Data',
          documentation: 'Emitted data separated with comma line by line for each row',
          insertText: 'Data: '
        }
      ]
    },
    Div: {
      label: 'Div',
      documentation: 'Generic container for the content. You can use it to group other elements and apply specific styling or classes',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Div(',
      params: [
        staticParamTypes.Class,
        staticParamTypes.Body
      ]
    },
    Em: {
      label: 'Em',
      documentation: 'Specific element that marks the text that has stress emphasis',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Em(',
      params: [
        staticParamTypes.Body,
        staticParamTypes.Class
      ]
    },
    ForList: {
      label: 'ForList',
      documentation: 'List-iteration function. Body will be rendered once per element of the source',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'ForList(',
      params: [
        {
          label: 'Source',
          documentation: 'Source identificator to fetch the results',
          insertText: 'Source: '
        },
        staticParamTypes.Body
      ]
    },
    Form: {
      label: 'Form',
      documentation: 'Contract form container. All input elements must be placed within a form',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Form(',
      params: [
        staticParamTypes.Body,
        staticParamTypes.Class
      ]
    },
    GetHistory: {
      label: 'GetHistory',
      documentation: 'Retrieve entity change history',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'GetHistory(',
      params: [
        {
          label: 'Source',
          documentation: 'Source identificator to bind results',
          insertText: 'Source: '
        },
        {
          label: 'Name',
          documentation: 'Entity type',
          insertText: 'Name: '
        },
        {
          label: 'Id',
          documentation: 'Database entry id',
          insertText: 'Id: '
        },
        {
          label: 'RollbackId',
          documentation: 'Rollback ID bound to the result',
          insertText: 'RollbackId: '
        }
      ]
    },
    GetVar: {
      label: 'GetVar',
      documentation: 'Get variable value',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'GetVar(',
      params: [
        {
          label: 'Name',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Variable name to get the value of',
          insertText: 'Name: '
        }
      ]
    },
    If: {
      label: 'If',
      documentation: 'Conditional clause. Body elements will be shown only if the condition is truthy',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'If(',
      params: [
        {
          label: 'Condition',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Condition to met for this function to succeed',
          insertText: 'Condition: '
        },
        staticParamTypes.Body
      ]
    },
    Image: {
      label: 'Image',
      documentation: 'Static image element',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Image(',
      params: [
        {
          label: 'Src',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Image URI',
          insertText: 'Src: '
        },
        {
          label: 'Alt',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Alternative text that is displayed when image is unable to load',
          insertText: 'Alt: '
        },
        staticParamTypes.Class
      ]
    },
    ImageInput: {
      label: 'ImageInput',
      documentation: 'Image upload component with ability to crop images',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'ImageInput(',
      params: [
        {
          label: 'Name',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Unique input name to bind the value to',
          insertText: 'Name: '
        },
        {
          label: 'Width',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Minimum width of the resulting image',
          insertText: 'Width: '
        },
        {
          label: 'Ratio',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Aspect ratio of the resulting image (WIDTH / HEIGHT)',
          insertText: 'Ratio: '
        },
        {
          label: 'Format',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'What format to use when generating the result',
          insertText: 'Format: '
        },
        staticParamTypes.Class
      ]
    },
    Include: {
      label: 'Include',
      documentation: 'Include another page or block and output its contents',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'Include(',
      params: [
        {
          label: 'Name',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Page or block name to include',
          insertText: 'Name: '
        }
      ]
    },
    Input: {
      label: 'Input',
      documentation: 'Form input element to request user to enter some data',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Input(',
      params: [
        staticParamTypes.Class,
        {
          label: 'Name',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Unique input name to bind the value to',
          insertText: 'Name: '
        },
        {
          label: 'Placeholder',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Placeholder text to show when input is empty',
          insertText: 'Placeholder: '
        },
        {
          label: 'Type',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Input type such as text or password',
          insertText: 'Type: '
        },
        {
          label: 'Value',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Default input value',
          insertText: 'Value: '
        },
        {
          label: 'Disabled',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Sets input state to read-only. Any non-empty value will be treated as true',
          insertText: 'Disabled: '
        }
      ]
    },
    InputErr: {
      label: 'InputErr',
      documentation: 'Validation message for the specific input',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'InputErr(',
      params: [
        staticParamTypes.Class,
        {
          label: 'Name',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Unique input name to validate',
          insertText: 'Name: '
        }
      ]
    },
    InputMap: {
      label: 'InputMap',
      documentation: 'Form element to work with map coords',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'InputMap(',
      params: [
        staticParamTypes.Class,
        {
          label: 'Name',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Unique input name to bind the value to',
          insertText: 'Name: '
        },
        {
          label: 'Value',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Default input value',
          insertText: 'Value: '
        },
        {
          label: 'Type',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: '',
          insertText: 'Type: '
        },
        {
          label: 'MapType',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Identifier for common map types',
          insertText: 'MapType: '
        }
      ]
    },
    JsonToSource: {
      label: 'JsonToSource',
      documentation: 'Data emitter that converts JSON string to a source',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'JsonToSource(',
      params: [
        {
          label: 'Source',
          documentation: 'Source identificator to bind results',
          insertText: 'Source: '
        },
        {
          label: 'Data',
          documentation: 'Emitted data that must be a valid json-formatted string',
          insertText: 'Data: '
        }
      ]
    },
    Label: {
      label: 'Label',
      documentation: 'Form input label. Will set focus to bound input on click',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Label(',
      params: [
        staticParamTypes.Body,
        staticParamTypes.Class,
        {
          label: 'For',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Unique input name to bind the label',
          insertText: 'For: '
        }
      ]
    },
    LangRes: {
      label: 'LangRes',
      documentation: 'Get language resource by name',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'LangRes(',
      params: [
        {
          label: 'Name',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Unique resource name to get',
          insertText: 'Name: '
        },
        {
          label: 'Lang',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Explicitly set language of the resource to get',
          insertText: 'Lang: '
        }
      ]
    },
    LinkPage: {
      label: 'LinkPage',
      documentation: 'Static redirect link',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'LinkPage(',
      params: [
        staticParamTypes.Body,
        {
          label: 'Page',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Page that will be loaded on click',
          insertText: 'Page: '
        },
        staticParamTypes.Class,
        {
          label: 'PageParams',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Parameters which will be passed to the page upon redirection',
          insertText: 'Params: '
        }
      ]
    },
    MenuGroup: {
      label: 'MenuGroup',
      documentation: 'Menu group that will replace current menu on click',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'MenuGroup(',
      params: [
        staticParamTypes.Body,
        {
          label: 'Title',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Title of the menu button',
          insertText: 'Title: '
        },
        {
          label: 'Icon',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Optional icon to show near the menu button',
          insertText: 'Icon: '
        }
      ]
    },
    MenuItem: {
      label: 'MenuItem',
      documentation: 'Menu item button used to redirect user to another page',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'MenuItem(',
      params: [
        {
          label: 'Title',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Title of the menu button',
          insertText: 'Title: '
        },
        {
          label: 'Page',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Page that will be loaded on click',
          insertText: 'Page: '
        },
        {
          label: 'Params',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Parameters which will be passed to the page upon redirection',
          insertText: 'Params: '
        },
        {
          label: 'Icon',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Optional icon to show near the button',
          insertText: 'Icon: '
        },
        {
          label: 'Vde',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Sets link destination: "true" for VDE and "false" for blockchain',
          insertText: 'Vde: '
        }
      ]
    },
    Or: {
      label: 'Or',
      documentation: 'Logical "Or" operator. One of the parameters must be truthy',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'Or('
    },
    P: {
      label: 'P',
      documentation: 'HTML element that represents a paragraph of text',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'P(',
      params: [
        staticParamTypes.Body,
        staticParamTypes.Class
      ]
    },
    QRcode: {
      label: 'QRcode',
      documentation: 'Generate QRCode image from text payload',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'QRcode(',
      params: [
        {
          label: 'Text',
          documentation: 'Text payload to encode',
          insertText: 'Text: '
        }
      ]
    },
    RadioGroup: {
      label: 'RadioGroup',
      documentation: 'List of options represented with radio buttons',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'RadioGroup(',
      params: [
        {
          label: 'Name',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Unique input name to bind the value to',
          insertText: 'Name: '
        },
        {
          label: 'Source',
          documentation: 'Source identificator to fetch the results',
          insertText: 'Source: '
        },
        {
          label: 'NameColumn',
          documentation: 'Name of the column that will be shown near the button',
          insertText: 'NameColumn: '
        },
        {
          label: 'ValueColumn',
          documentation: 'Value that will be passed to the form',
          insertText: 'ValueColumn: '
        },
        {
          label: 'Value',
          documentation: 'Default value that will be selected',
          insertText: 'Value: '
        },
        staticParamTypes.Class
      ]
    },
    Range: {
      label: 'Range',
      documentation: 'Generate array of numbers. Represents a data-source',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'Range(',
      params: [
        {
          label: 'Source',
          documentation: 'Source identificator to bind results',
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: 'Source: '
        },
        {
          label: 'From',
          documentation: 'Initial counter value',
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: 'From: '
        },
        {
          label: 'To',
          documentation: 'Final counter value(exclusive)',
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: 'To: '
        },
        {
          label: 'Step',
          documentation: 'Value that will be added for each step',
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: 'Step: '
        }
      ]
    },
    Select: {
      label: 'Select',
      documentation: 'Element with dropdown menu used to select one value from multiple choices',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Select(',
      params: [
        {
          label: 'Name',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Unique input name to bind the value to',
          insertText: 'Name: '
        },
        {
          label: 'Source',
          documentation: 'Source identificator to fetch the results',
          insertText: 'Source: '
        },
        {
          label: 'NameColumn',
          documentation: 'Name of the column that will be shown in the dropdown menu',
          insertText: 'NameColumn: '
        },
        {
          label: 'ValueColumn',
          documentation: 'Value that will be passed to the form',
          insertText: 'ValueColumn: '
        },
        {
          label: 'Value',
          documentation: 'Default value that will be selected',
          insertText: 'Value: '
        },
        staticParamTypes.Class
      ]
    },
    SetVar: {
      label: 'SetVar',
      documentation: 'Set variable value by name',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'SetVar(',
      params: [
        {
          label: 'Name',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Variable name to set the value of',
          insertText: 'Name: '
        },
        {
          label: 'Value',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Variable name to set the value of',
          insertText: 'Value: '
        }
      ]
    },
    SetTitle: {
      label: 'SetTitle',
      documentation: 'Set text shown in the page header',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'SetTitle(',
      params: [
        {
          label: 'Title',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Text to show in the header',
          insertText: 'Title: '
        }
      ]
    },
    Span: {
      label: 'Span',
      documentation: 'Generic container for the content. You can use it to group other elements and apply specific styling or classes',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Span(',
      params: [
        staticParamTypes.Body,
        staticParamTypes.Class
      ]
    },
    Strong: {
      label: 'Strong',
      documentation: 'Generic container for the content that will give text strong importance',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Strong(',
      params: [
        staticParamTypes.Body,
        staticParamTypes.Class
      ]
    },
    Table: {
      label: 'Table',
      documentation: 'Generic container for the content that will give text strong importance',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Table(',
      params: [
        {
          label: 'Source',
          documentation: 'Source identificator to fetch the results',
          insertText: 'Source: '
        },
        {
          label: 'Columns',
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: 'Optional filter for the coulmns to show. Format: ColumnTitle1=column1,ColumnTitle2=column2',
          insertText: 'Columns: '
        }
      ]
    },
  };

  const functionProposals = () =>
    _.map(functionDefs, (value) => value);

  editor.languages.registerCompletionItemProvider(langName, {
    provideCompletionItems: (model, position) => {
      const textUntilPosition = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });

      // Match function parameters. There must be an opening bracket or separating comma
      const paramsMatch = textUntilPosition.match(/([A-Z][a-zA-Z]*)\(/g);

      if (paramsMatch) {
        const token = paramsMatch[paramsMatch.length - 1].slice(0, -1);
        if (functionDefs[token]) {
          return {
            suggestions: functionDefs[token].params
          };
        }
      }

      return {
        suggestions: functionProposals()
      };
    }
  });

  /*editor.languages.registerSignatureHelpProvider(langName, {
      signatureHelpTriggerCharacters: ['(', ','],
      provideSignatureHelp: (model, position) => {
          const textUntilPosition = model.getValueInRange({ startLineNumber: position.lineNumber, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });

          // Match function name. There must be an opening bracket to provide signature help
          const funcMatch = textUntilPosition.match(/([a-z0-9]+)\((([a-z]+,?)*)$/i);
          if (funcMatch && functionDefs[funcMatch[1]]) {
              const functionDef = functionDefs[funcMatch[1]];
              const paramNames = functionDef.params.map((l: any) => l.label);

              return {
                  signatures: [{
                      label: `${functionDef.label}(${paramNames.join(',')})`,
                      parameters: functionDef.params
                  }],

                  activeSignature: 0,
                  activeParameter: 1
              };
          }
          else {
              return null;
          }
      }
  });*/

  monaco.languages.register({
    id: langName
  });

  editor.languages.setMonarchTokensProvider(langName, syntax(
    _.map(functionDefs, (value, key) => value.kind === monaco.languages.CompletionItemKind.Method ? key : null).filter(l => l),
    _.map(functionDefs, (value, key) => value.kind === monaco.languages.CompletionItemKind.Function ? key : null).filter(l => l)
  ));
};

export default register;