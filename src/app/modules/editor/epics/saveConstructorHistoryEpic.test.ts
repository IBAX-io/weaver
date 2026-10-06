/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { Action } from 'redux';
import { saveConstructorHistory } from '../actions';
import saveConstructorHistoryEpic from './saveConstructorHistoryEpic';
import dependencies from 'modules/dependencies';
import mockState from 'test/mockStore';
import { runEpic } from 'test/runEpic';

describe('saveConstructorHistory', () => {
    it('save constructor history', async () => {

        const actions: Action[] = [saveConstructorHistory.started(null)];

        const expectedOutput: any = [
            {
                payload: {
                    params: null,
                    result: {
                        data: [
                            [
                                {
                                    tag: 'image',
                                    attr: {
                                        alt: 'Image',
                                        src: '/img/dummy.png'
                                    },
                                    id: 'tag_0'
                                },
                                {
                                    tag: 'p',
                                    attr: {
                                        'class': 'text-primary'
                                    },
                                    children: [
                                        {
                                            tag: 'text',
                                            text: 'Paragraph text here',
                                            id: 'tag_2'
                                        }
                                    ],
                                    id: 'tag_1',
                                    childrenText: 'Paragraph text here'
                                },
                                {
                                    tag: 'form',
                                    children: [
                                        {
                                            tag: 'label',
                                            children: [
                                                {
                                                    tag: 'text',
                                                    text: 'Firstname:',
                                                    id: 'tag_5'
                                                }
                                            ],
                                            id: 'tag_4',
                                            childrenText: 'Firstname:'
                                        },
                                        {
                                            tag: 'input',
                                            attr: {
                                                'class': 'form-control',
                                                name: 'sample input'
                                            },
                                            id: 'tag_6'
                                        }
                                    ],
                                    id: 'tag_3',
                                    childrenText: null
                                },
                                {
                                    tag: 'form',
                                    children: [
                                        {
                                            tag: 'label',
                                            children: [
                                                {
                                                    tag: 'text',
                                                    text: 'Lastname:',
                                                    id: 'tag_9'
                                                }
                                            ],
                                            id: 'tag_8',
                                            childrenText: 'Lastname:'
                                        },
                                        {
                                            tag: 'input',
                                            attr: {
                                                'class': 'form-control',
                                                name: 'sample input'
                                            },
                                            id: 'tag_10'
                                        },
                                        {
                                            tag: 'button',
                                            children: [
                                                {
                                                    tag: 'text',
                                                    text: 'Submit',
                                                    id: 'tag_12'
                                                }
                                            ],
                                            id: 'tag_11',
                                            childrenText: 'Submit'
                                        }
                                    ],
                                    id: 'tag_7',
                                    childrenText: null
                                }
                            ],
                            [
                                {
                                    tag: 'image',
                                    attr: {
                                        alt: 'Image',
                                        src: '/img/dummy.png'
                                    },
                                    id: 'tag_0'
                                },
                                {
                                    tag: 'p',
                                    attr: {
                                        'class': 'text-primary'
                                    },
                                    children: [
                                        {
                                            tag: 'text',
                                            text: 'Paragraph text here',
                                            id: 'tag_2'
                                        }
                                    ],
                                    id: 'tag_1',
                                    childrenText: 'Paragraph text here'
                                },
                                {
                                    tag: 'form',
                                    children: [
                                        {
                                            tag: 'label',
                                            children: [
                                                {
                                                    tag: 'text',
                                                    text: 'Firstname:',
                                                    id: 'tag_5'
                                                }
                                            ],
                                            id: 'tag_4',
                                            childrenText: 'Firstname:'
                                        },
                                        {
                                            tag: 'input',
                                            attr: {
                                                'class': 'form-control',
                                                name: 'sample input'
                                            },
                                            id: 'tag_6'
                                        }
                                    ],
                                    id: 'tag_3',
                                    childrenText: null
                                },
                                {
                                    tag: 'form',
                                    children: [
                                        {
                                            tag: 'label',
                                            children: [
                                                {
                                                    tag: 'text',
                                                    text: 'Lastname:',
                                                    id: 'tag_9'
                                                }
                                            ],
                                            id: 'tag_8',
                                            childrenText: 'Lastname:'
                                        },
                                        {
                                            tag: 'input',
                                            attr: {
                                                'class': 'form-control',
                                                name: 'sample input'
                                            },
                                            id: 'tag_10'
                                        },
                                        {
                                            tag: 'button',
                                            children: [
                                                {
                                                    tag: 'text',
                                                    text: 'Submit',
                                                    id: 'tag_12'
                                                }
                                            ],
                                            id: 'tag_11',
                                            childrenText: 'Submit'
                                        }
                                    ],
                                    id: 'tag_7',
                                    childrenText: null
                                },
                                {
                                    tag: 'table',
                                    id: 'tag_13',
                                    attr: {
                                        source: 'keysStr',
                                        columns: 'KEY_ID=id,MONEY=amount'
                                    }
                                }
                            ],
                            [
                                {
                                    tag: 'image',
                                    attr: {
                                        alt: 'Image',
                                        src: '/img/dummy.png'
                                    },
                                    id: 'tag_0'
                                },
                                {
                                    tag: 'p',
                                    attr: {
                                        'class': 'text-primary'
                                    },
                                    children: [
                                        {
                                            tag: 'text',
                                            text: 'Paragraph text here',
                                            id: 'tag_2'
                                        }
                                    ],
                                    id: 'tag_1',
                                    childrenText: 'Paragraph text here'
                                },
                                {
                                    tag: 'form',
                                    children: [
                                        {
                                            tag: 'label',
                                            children: [
                                                {
                                                    tag: 'text',
                                                    text: 'Firstname:',
                                                    id: 'tag_5'
                                                }
                                            ],
                                            id: 'tag_4',
                                            childrenText: 'Firstname:'
                                        },
                                        {
                                            tag: 'input',
                                            attr: {
                                                'class': 'form-control',
                                                name: 'sample input'
                                            },
                                            id: 'tag_6'
                                        }
                                    ],
                                    id: 'tag_3',
                                    childrenText: null
                                },
                                {
                                    tag: 'form',
                                    children: [
                                        {
                                            tag: 'label',
                                            children: [
                                                {
                                                    tag: 'text',
                                                    text: 'Lastname:',
                                                    id: 'tag_9'
                                                }
                                            ],
                                            id: 'tag_8',
                                            childrenText: 'Lastname:'
                                        },
                                        {
                                            tag: 'input',
                                            attr: {
                                                'class': 'form-control',
                                                name: 'sample input'
                                            },
                                            id: 'tag_10'
                                        },
                                        {
                                            tag: 'button',
                                            children: [
                                                {
                                                    tag: 'text',
                                                    text: 'Submit',
                                                    id: 'tag_12'
                                                }
                                            ],
                                            id: 'tag_11',
                                            childrenText: 'Submit'
                                        }
                                    ],
                                    id: 'tag_7',
                                    childrenText: null
                                },
                                {
                                    tag: 'table',
                                    id: 'tag_13',
                                    attr: {
                                        source: 'keysStr',
                                        columns: 'KEY_ID=id,MONEY=amount'
                                    }
                                }
                            ]
                        ],
                        position: 3,
                        canUndo: true,
                        canRedo: false
                    }
                },
                type: 'editor/SAVE_CONSTRUCTOR_HISTORY_DONE'
            }
        ];

        const actualOutput = await runEpic(saveConstructorHistoryEpic, actions, mockState, { constructorModule: dependencies.constructorModule });
            expect(actualOutput).toEqual(expectedOutput);
    });
});