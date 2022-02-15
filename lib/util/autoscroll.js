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

/**
 * Checks whether element is visible
 * @param {HTMLElement} el
 * @returns {boolean} true is in viewport, false isn't
 */
export function isElementVisible(el) {
    const rect = el.getBoundingClientRect();
    const vWidth = window.innerWidth || document.documentElement.clientWidth;
    const vHeight = window.innerHeight || document.documentElement.clientHeight;

    // Return false if it's not in the viewport
    if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth || rect.top > vHeight) return false;

    // Return true if any of its four corners are visible
    return (
        el.contains(document.elementFromPoint(rect.left, rect.top)) ||
        el.contains(document.elementFromPoint(rect.right, rect.top)) ||
        el.contains(document.elementFromPoint(rect.right, rect.bottom)) ||
        el.contains(document.elementFromPoint(rect.left, rect.bottom))
    );
}

/**
 * Creates an observer to follow the highlighted element and scroll it into the view
 * @param {HTMLElement} targetNode
 * @param {() => HTMLElement} scrollTargetClass
 * @returns {HTMLElement}
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
                const target = mutation.target;
                if (!isElementVisible(target)) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
    });

    observer.observe(targetNode, { attributes: true, subtree: true });

    return observer;
}
