/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { IntlProvider } from 'react-intl';
import { TProtypoElement } from 'ibax/protypo';
import mockState from 'test/mockStore';
import Protypo from './Protypo';

vi.mock('components/Map/MapView', () => ({ default: () => null }));

const render = (content: TProtypoElement[] | undefined) => renderToStaticMarkup(
    <Provider store={createStore(() => mockState)}>
        <IntlProvider locale="en-US" messages={{}} textComponent="span">
            <Protypo
                apiHost="http://node"
                context="page"
                section="home"
                content={content}
                menuPush={() => undefined}
                displayData={() => undefined}
            />
        </IntlProvider>
    </Provider>
);

describe('Protypo', () => {
    // Native array spread (ES2022 target) throws on null where the old ES5 output tolerated it
    it('renders a page without content', () => {
        expect(render(undefined)).toBe('<div class="fullscreen protypo-content"></div>');
        expect(render([])).toBe('<div class="fullscreen protypo-content"></div>');
    });

    it('renders page elements', () => {
        expect(render([{ tag: 'p', children: [{ tag: 'text', text: 'Hello' }] }])).toContain('Hello');
    });
});
