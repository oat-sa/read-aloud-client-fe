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
import { normalize, getLanguagePart, findClosestElementWithALang, findClosestLang } from '../locale.js';

describe('normalize', () => {
    it.each([
        ['', null],
        [12, null],
        [[], null],
        ['de', 'de'],
        ['en_US', 'en-US'],
        ['fr_FR', 'fr-FR'],
        ['es-013', 'es-013'],
        ['ru_Cyrl-BY', 'ru-Cyrl-BY'],
        [' it_IT ', 'it-IT'],
        ['sr-Latn_BA', 'sr-Latn-BA'],
        [' fr-BE-', 'fr-BE']
    ])('normalize the code %s', (code, normalized) => {
        expect(normalize(code)).toEqual(normalized);
    });
});

describe('getLanguagePart', () => {
    it.each([
        ['', null],
        [12, null],
        [[], null],
        ['de', 'de'],
        ['en_US', 'en'],
        ['fr_FR', 'fr'],
        ['es-013', 'es'],
        ['ru_Cyrl-BY', 'ru'],
        [' it_IT ', 'it'],
        ['sr-Latn_BA', 'sr'],
        [' fr-BE-', 'fr'],
        ['nn', 'nn']
    ])('extracts the language from the code %s', (code, normalized) => {
        expect(getLanguagePart(code)).toEqual(normalized);
    });
});

describe('findClosestElementWithALang and findClosestLang', () => {
    const container = document.createElement('div');
    container.id = 'fixtures';
    document.body.appendChild(container);

    afterEach(() => (container.innerHTML = ''));
    afterAll(() => document.body.removeChild(container));

    it('returns null without an element', () => {
        expect(findClosestElementWithALang()).toBeNull();
        expect(findClosestLang()).toBeNull();
    });
    it('returns the element itself if it has a lang', () => {
        container.innerHTML = `
            <div>
                <p lang="en-US">Hello</p>
            </div>
        `;
        const element = document.querySelector('p');

        expect(findClosestElementWithALang(element)).toBe(element);
        expect(findClosestLang(element)).toBe('en-US');
    });

    it('returns the element ancestor if it has a lang', () => {
        container.innerHTML = `
        <section lang="de">
            <div>
                <p>Hello</p>
                <span>world</span>
            </div>
        </section>
        `;
        const element = document.querySelector('p');

        const ancestor = findClosestElementWithALang(element);
        expect(ancestor).not.toBeNull();
        expect(ancestor.nodeName).toEqual('SECTION');

        expect(findClosestLang(element)).toBe('de');
    });

    it('returns the closest element with a lang', () => {
        container.innerHTML = `
        <section lang="de">
            <div lang="it">
                <p xml:lang="fr">Hello</p>
                <span lang="es">world</span>
            </div>
        </section>
        `;
        const element = document.querySelector('p');

        const ancestor = findClosestElementWithALang(element);
        expect(ancestor).not.toBeNull();
        expect(ancestor.nodeName).toEqual('DIV');

        expect(findClosestLang(element)).toBe('it');
    });

    it('returns null if no element is found', () => {
        container.innerHTML = `
        <section>
            <div>
                <p>Hello</p>
            </div>
        </section>
        `;
        const element = document.querySelector('p');

        expect(findClosestElementWithALang(element)).toBeNull();
        expect(findClosestLang(element)).toBeNull();
    });
});
