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
        expect(lookupVoice('female', 'en').name).toBe('Ava');
        expect(lookupVoice('female', 'en-GB').name).toBe('Serena');
        expect(lookupVoice('female', 'en-AU').name).toBe('Karen');

        expect(lookupVoice('male', 'es').name).toBe('Juan');
        expect(lookupVoice('male', 'es-ES').name).toBe('Jorge');
    });

    it('should return fallback matches from the mapping', () => {
        expect(lookupVoice('female', 'en-US').name).toBe('Ava');
        expect(lookupVoice('female', 'fr-FR').name).toBe('Audrey');

        expect(lookupVoice('male', 'es-MX').name).toBe('Juan');
        expect(lookupVoice('male', 'es-AR').name).toBe('Juan');
    });

    it('should return a default voice when no voice is found', () => {
        expect(lookupVoice().name).toBe('Ava');
        expect(lookupVoice('female', 'foobar').name).toBe('Ava');
        expect(lookupVoice('male', 'foobar').name).toBe('Tom');
    });
});
