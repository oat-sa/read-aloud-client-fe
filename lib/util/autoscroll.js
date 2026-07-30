/**
 * SPDX-FileCopyrightText: 2022-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */

import scrollIntoView from 'scroll-into-view-if-needed';

/**
 * Creates an observer to follow the highlighted element and scroll it into the view
 * @param {HTMLElement} targetNode
 * @param {() => HTMLElement} scrollTargetClass
 * @returns {MutationObserver}
 */
export function createScrollTargetObserver(targetNode, scrollTargetClass) {
    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(mutationList => {
        mutationList
            .filter(
                mutation =>
                    mutation.type === 'attributes' &&
                    mutation.attributeName === 'class' &&
                    mutation.target.classList.contains(scrollTargetClass)
            )
            .forEach(mutation => {
                scrollIntoView(mutation.target, {
                    scrollMode: 'if-needed',
                    behavior: 'smooth'
                });
            });
    });

    observer.observe(targetNode, { attributes: true, subtree: true });

    return observer;
}
