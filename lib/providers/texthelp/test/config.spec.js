/**
 * SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */

import { validateSpeedMap } from '../config.js';

describe('validateSpeedMap', () => {
    beforeAll(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it.each([
        void 0,
        null,
        [],
        {},
        '{ normal: 50 }',
        { slow: 0 },
        { fast: 101 },
        { slow: 1, wackadoo: 1000 },
    ])('should return false for invalid speedMaps', candidate => {
        expect(validateSpeedMap(candidate)).toBe(false);
    });

    it.each([
        { slowest: 1 },
        { fastest: 100 },
        { slowest: 20, slow: 40, normal: 60, fast: 80, fastest: 100 },
    ])('should return true for valid speedMaps', candidate => {
        expect(validateSpeedMap(candidate)).toBe(true);
    });
});
