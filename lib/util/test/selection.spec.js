// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { isTextSelected, getSelectionAncestor } from '../selection';

describe('isTextSelected', () => {
    afterEach(() => delete window.getSelection);

    it('returns false without a range count', () => {
        window.getSelection = jest.fn(() => ({
            rangeCount: 0
        }));

        expect(isTextSelected()).toBeFalsy();
    });

    it('returns false if the selection is collapsed', () => {
        window.getSelection = jest.fn(() => ({
            rangeCount: 1,
            isCollapsed: true
        }));

        expect(isTextSelected()).toBeFalsy();
    });

    it('returns false if the selection is empty', () => {
        window.getSelection = jest.fn(() => ({
            rangeCount: 1,
            isCollapsed: true,
            getRangeAt: () => ({
                toString: jest.fn(() => '  ')
            })
        }));

        expect(isTextSelected()).toBeFalsy();
    });

    it('detects selection', () => {
        window.getSelection = jest.fn(() => ({
            rangeCount: 1,
            isCollapsed: false,
            getRangeAt: () => ({
                toString: jest.fn(() => 'hello')
            })
        }));

        expect(isTextSelected()).toBeTruthy();
    });
});

describe('getSelectionAncestor', () => {
    const container = document.createElement('div');
    container.id = 'fixtures';
    document.body.appendChild(container);

    afterEach(() => {
        container.innerHTML = '';
        delete window.getSelection;
    });

    it('returns null without a selection', () => {
        window.getSelection = jest.fn(() => ({
            rangeCount: 1,
            isCollapsed: true
        }));

        expect(getSelectionAncestor()).toBeNull();
    });

    it('returns the selection ancestor', () => {
        container.innerHTML = `
        <div>
            <p>hello world</p>
        </div>`;

        const ancestor = container.querySelector('p');

        window.getSelection = jest.fn(() => ({
            rangeCount: 1,
            isCollapsed: false,
            getRangeAt: () => ({
                toString: jest.fn(() => 'hello'),
                commonAncestorContainer: ancestor
            })
        }));

        expect(getSelectionAncestor()).toBe(ancestor);
    });

    it('returns the selection ancestor element', () => {
        container.innerHTML = `
        <div>
            <p>hello world</p>
        </div>`;

        const ancestor = container.querySelector('p');

        window.getSelection = jest.fn(() => ({
            rangeCount: 1,
            isCollapsed: false,
            getRangeAt: () => ({
                toString: jest.fn(() => 'hello'),
                commonAncestorContainer: ancestor.childNodes[0]
            })
        }));

        expect(getSelectionAncestor()).toBe(ancestor);
    });
});
