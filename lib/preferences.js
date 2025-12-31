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
 * Copyright (c) 2021-2022 (original work) Open Assessment Technologies SA ;
 */

/**
 * Preferences values, inspired by the Speech Synthesis API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance#properties
 */

//possible voice speeds
export const speeds = Object.freeze({
    slowest: 'slowest',
    slow: 'slow',
    normal: 'normal',
    fast: 'fast',
    fastest: 'fastest'
});

//possible pitch values
export const pitches = Object.freeze({
    lowest: 'lowest',
    low: 'low',
    medium: 'medium',
    high: 'high',
    highest: 'highest'
});

//possible volume values
export const volumes = Object.freeze({
    lowest: 'lowest',
    low: 'low',
    medium: 'medium',
    high: 'high',
    highest: 'highest'
});

// possible voice values
export const voices = Object.freeze({
    female: 'female',
    male: 'male'
});

// html element attribute: read this attribute's content instead of element's inner content
export const pronunciationAttributeName = 'data-tts-text';
