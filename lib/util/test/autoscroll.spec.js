// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License


import { createScrollTargetObserver } from '../autoscroll.js';

describe('autoscroll', () => {
    const container = document.createElement('div');
    container.id = 'fixtures';
    document.body.appendChild(container);

    afterEach(() => {
        container.innerHTML = '';
    });

    it('scrolls element into view', done => {
        container.innerHTML = `<p>Some <span id="mark">text</span> to read</p>`;

        const targetClass = 'some_highlighted_class';
        const observer = createScrollTargetObserver(container, targetClass);

        const html = document.querySelector('html');
        html.scroll = jest.fn();

        const marker = container.querySelector('#mark');
        marker.getBoundingClientRect = () => ({ top: -1 }); // fake the element is not in viewport

        // fake the library adds highlighted class
        marker.classList.add(targetClass);

        setTimeout(() => {
            expect(html.scroll).toHaveBeenCalled();

            observer.disconnect();

            done();
        }, 0); // tick
    });
});
