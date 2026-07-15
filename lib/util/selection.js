// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License


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
