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
 * Copyright (c) 2023-2024 (original work) Open Assessment Technologies SA ;
 */
import { lookupVoice } from '../voices.js';

describe('lookupVoice', () => {
    it('should return direct matches from the mapping', () => {
        expect(lookupVoice('female', 'en')).toBe('Ava');
        expect(lookupVoice('female', 'en-GB')).toBe('Serena');
        expect(lookupVoice('female', 'en-AU')).toBe('Karen');

        expect(lookupVoice('male', 'es')).toBe('Juan');
        expect(lookupVoice('male', 'es-ES')).toBe('Jorge');
    });

    it('should return fallback matches from the mapping', () => {
        expect(lookupVoice('female', 'en-US')).toBe('Ava');
        expect(lookupVoice('female', 'fr-FR')).toBe('Audrey');

        expect(lookupVoice('male', 'es-MX')).toBe('Juan');
        expect(lookupVoice('male', 'es-AR')).toBe('Juan');
    });

    it('should return a default voice when no voice is found', () => {
        expect(lookupVoice()).toBe('Ava');
        expect(lookupVoice('female', 'foobar')).toBe('Ava');
        expect(lookupVoice('male', 'foobar')).toBe('Tom');
    });
});
