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
