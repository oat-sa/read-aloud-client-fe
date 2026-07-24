// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License


/**
 * Generate element id for node
 * @param {String} nodeType
 * @param {number} length
 * @param {String} platformPrefix
 * @returns {String}
 */
export function generateElementId(nodeType, length = 8, platformPrefix = 'tao') {
    const allLowerAlpha = [...'abcdefghijklmnopqrstuvwxyz'];
    const allNumbers = [...'0123456789'];
    const base = [...allNumbers, ...allLowerAlpha];

    const hash = [...Array(length)].map(() => base[Math.floor(Math.random() * base.length)]).join('');
    return `${platformPrefix}-${nodeType}-${hash}`;
}
