/**
 * SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */

/**
 * Normalize language codes to IETF BPC47
 * From en_US to en-US
 *
 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang
 * @param {string} code
 * @returns {string?} the normalized code
 */
export function normalize(code){
    if(typeof code === 'string' && code.length) {
        return code.trim().replace(/[^a-z\d\s]/gi, '-')
                .replace(/^-/, '')
                .replace(/-$/,'');
    }
    return null;
}

/**
 * Get the language subtag of the code
 * @param {string} code - the lang code
 * @returns {string?} the language part
 */
export function getLanguagePart(code) {
    const normalized = normalize(code);
    if(normalized && normalized.length){
        const subtags = normalized.split('-');
        if(subtags.length) {
            return subtags[0];
        }
    }
    return null;
}

/**
 * Find the closest element with a lang attribute
 * @param {HTMLElement} element - reference element
 * @returns {Element?} the closest element with a lang attribute
 */
export function findClosestElementWithALang(element) {
    if(element && element instanceof HTMLElement){
        if (element.getAttribute('lang')) {
            return element;
        }
        const ancestorElement = element.closest('[lang]');
        if (ancestorElement) {
            return ancestorElement;
        }
    }
    return null;
}

/**
 * Find the closest lang attribute from an element
 * @param {HTMLElement} element
 * @returns {string?} the value of the closest lang attribute, if any
 */
export function findClosestLang(element) {
    const ancestorElement = findClosestElementWithALang(element);
    if (ancestorElement) {
        return ancestorElement.getAttribute('lang');
    }
    return null;
}

