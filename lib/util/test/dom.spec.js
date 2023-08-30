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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
import { generateElementId } from '../dom.js';

describe('generateElementId', () => {
    it('generate id with right nodeType', () => {
        const id = generateElementId('option');
        expect(id).toMatch(/tao-option-[a-z, 0-9]{8}/);
    });
    it('generate id with right length', () => {
        const id = generateElementId('option', 3);
        expect(id).toMatch(/tao-option-[a-z, 0-9]{3}/);
    });
    it('generate id with right platformPrefix', () => {
        const id = generateElementId('option', 8, 'my');
        expect(id).toMatch(/my-option-[a-z, 0-9]{3}/);
    });
    it('generate different ids for the same nodeType', () => {
        const id1 = generateElementId('option');
        const id2 = generateElementId('option');
        expect(id1).not.toEqual(id2);
    });
});
