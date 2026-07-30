/**
 * SPDX-FileCopyrightText: 2023-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
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
