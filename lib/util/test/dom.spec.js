/**
 * SPDX-FileCopyrightText: 2019-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
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
