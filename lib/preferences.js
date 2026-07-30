/**
 * SPDX-FileCopyrightText: 2021-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
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
