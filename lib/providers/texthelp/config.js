/**
 * SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */

import { speeds } from '../../preferences.js';

/**
 * Set a new map of speed names (predefined) to values (1-100)
 * @param {Object} newSpeedMap
 * @returns {Boolean}
 */
export function validateSpeedMap(newSpeedMap = {}) {
    // prettier-ignore
    if (typeof newSpeedMap !== 'object' || Array.isArray(newSpeedMap) || newSpeedMap === null || Object.keys(newSpeedMap).length === 0) {
        console.warn('invalid speedMap - not an object with keys'); // eslint-disable-line no-console
        return false;
    }
    if (Object.keys(newSpeedMap).some(val => !(val in speeds))) {
        console.warn('invalid speedMap - contains an unrecognised key'); // eslint-disable-line no-console
        return false;
    }
    if (Object.values(newSpeedMap).some(val => !Number.isFinite(val) || val < 1 || val > 100 )) {
        console.warn('invalid speedMap - contains an invalid value'); // eslint-disable-line no-console
        return false;
    }
    return true;
}
