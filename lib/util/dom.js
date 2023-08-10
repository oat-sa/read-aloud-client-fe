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
 * Copyright (c) 2019-2023 (original work) Open Assessment Technologies SA ;
 */

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
