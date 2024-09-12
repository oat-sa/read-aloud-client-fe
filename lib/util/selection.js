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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */

/**
 * Check if some text is selected
 * @returns {boolean}
 */
export function isTextSelected() {
    const selection = window.getSelection();
    return !!(
        selection && selection.rangeCount && !selection.isCollapsed && selection.getRangeAt(0).toString().trim().length
    );
}

/**
 * Get the common ancestor of the currently selected text, if any
 * @returns {HTMLElement?}
 */
export function getSelectionAncestor() {
    if (isTextSelected()) {
        const selection = window.getSelection();
        let ancestorElement = selection?.getRangeAt(0).commonAncestorContainer;
        if (ancestorElement && ancestorElement.nodeType !== 1) {
            return ancestorElement.parentNode;
        }
        return ancestorElement;
    }
    return null;
}
