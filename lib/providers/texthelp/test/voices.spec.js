/**
 * SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
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
