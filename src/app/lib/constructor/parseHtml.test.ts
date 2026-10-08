/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { parseHtmlNodes } from './helpers';
import { html2childrenTags } from '.';

// Expected trees were recorded from the html2json library this parser replaced (with attribute
// values always as arrays), so the constructor keeps receiving the same structure.
const cases: [string, unknown][] = [
    [
        "Paragraph text here",
        [
            {
                "node": "text",
                "text": "Paragraph text here"
            }
        ]
    ],
    [
        "Hello <b>bold</b> and <i>italic</i> text",
        [
            {
                "node": "text",
                "text": "Hello "
            },
            {
                "node": "element",
                "tag": "b",
                "child": [
                    {
                        "node": "text",
                        "text": "bold"
                    }
                ]
            },
            {
                "node": "text",
                "text": " and "
            },
            {
                "node": "element",
                "tag": "i",
                "child": [
                    {
                        "node": "text",
                        "text": "italic"
                    }
                ]
            },
            {
                "node": "text",
                "text": " text"
            }
        ]
    ],
    [
        "<p class=\"a b\">Para</p><span class=\"one\">x</span>",
        [
            {
                "node": "element",
                "tag": "p",
                "attr": {
                    "class": [
                        "a",
                        "b"
                    ]
                },
                "child": [
                    {
                        "node": "text",
                        "text": "Para"
                    }
                ]
            },
            {
                "node": "element",
                "tag": "span",
                "attr": {
                    "class": [
                        "one"
                    ]
                },
                "child": [
                    {
                        "node": "text",
                        "text": "x"
                    }
                ]
            }
        ]
    ],
    [
        "a&nbsp;b &amp; c &lt;tag&gt;",
        [
            {
                "node": "text",
                "text": "a&nbsp;b &amp; c &lt;tag&gt;"
            }
        ]
    ],
    [
        "<strong>nested <span>deep <em>er</em></span></strong> tail",
        [
            {
                "node": "element",
                "tag": "strong",
                "child": [
                    {
                        "node": "text",
                        "text": "nested "
                    },
                    {
                        "node": "element",
                        "tag": "span",
                        "child": [
                            {
                                "node": "text",
                                "text": "deep "
                            },
                            {
                                "node": "element",
                                "tag": "em",
                                "child": [
                                    {
                                        "node": "text",
                                        "text": "er"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "node": "text",
                "text": " tail"
            }
        ]
    ],
    [
        "Firstname: <span class=\"text-muted\">value</span>",
        [
            {
                "node": "text",
                "text": "Firstname: "
            },
            {
                "node": "element",
                "tag": "span",
                "attr": {
                    "class": [
                        "text-muted"
                    ]
                },
                "child": [
                    {
                        "node": "text",
                        "text": "value"
                    }
                ]
            }
        ]
    ]
];

describe('parseHtmlNodes', () => {
    it.each(cases)('%s', (html, expected) => {
        expect(parseHtmlNodes(html)).toEqual(expected);
    });

    it('handles a single class without crashing the constructor', () => {
        const [paragraph] = html2childrenTags('<p class="lead">Text</p>');
        expect(paragraph.attr.className).toBe('lead');
    });
});
