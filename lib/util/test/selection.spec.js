/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */
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
