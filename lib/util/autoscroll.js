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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA ;
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
