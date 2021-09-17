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
import { speeds, pitches } from '../preferences.js';
import { generateElementId } from '@oat-sa-private/ui-core/dom/dom.js';

const speedMap = {
    [speeds.slowest]: 3,
    [speeds.slow]: 5,
    [speeds.normal]: 2,
    [speeds.fast]: 4,
    [speeds.fastest]: 1
};

const pitchMap = {
    [pitches.lowest]: 3,
    [pitches.low]: 3,
    [pitches.medium]: 2,
    [pitches.high]: 1,
    [pitches.highest]: 1
};

const ignoreClass = 'vFact_DoNotReadAloud';
const containerId = 'readweb-container';

let reading = false;

/**
 * Load the readweb initial script. This has to be done once per page.
 * @param {string} url - the full of the script
 * @param {number} [loadingTimeoutMs] - script loading timeout
 * @returns {Promise} resolves when the script is loaded or if it's already loaded
 */
function loadReadWebScript(url, loadingTimeoutMs = 30000) {
    if (document.head.querySelectorAll('script[data-tts="readweb"]').length > 0) {
        return Promise.resolve();
    }

    let iframeContentInterval;
    let timeout;
    return Promise.race([
        new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.addEventListener('load', () => {
                if ('startleseweb' in window) {
                    //readweb entry point
                    window.startleseweb();

                    //TODO check if this check is reliable with the provider
                    iframeContentInterval = setInterval(() => {
                        const frame = document.getElementById('vFact_audioFrame');
                        if (frame && 'vFactDetect2' in frame.contentWindow) {
                            clearInterval(iframeContentInterval);
                            resolve();
                        }
                    }, 50);
                } else {
                    reject(new Error(`Unable to find the readweb entrypoint 'startleseweb'`));
                }
            });
            script.addEventListener('error', reject);
            script.type = 'text/javascript';
            script.async = true;
            script.src = url;
            script.dataset.tts = 'readweb';
            document.head.appendChild(script);
        }),
        new Promise((resolve, reject) => {
            timeout = setTimeout(
                () => reject(new Error('Timeout: unable to load the read web script')),
                loadingTimeoutMs
            );
        })
    ]).finally(() => {
        if (timeout) {
            clearTimeout(timeout);
        }
        if (iframeContentInterval) {
            clearInterval(iframeContentInterval);
        }
    });
}

/**
 * Readweb toolbar is added as a sibling of a configured id,
 * so to hide it we create an hidden element
 */
function createToolBarContainer() {
    if (!document.getElementById(containerId)) {
        const topContainer = document.createElement('div');
        //topContainer.style.display = 'none';
        const container = document.createElement('div');
        container.id = containerId;
        topContainer.appendChild(container);

        document.body.appendChild(topContainer);
    }
}

/**
 * ReadWeb provider
 * @param {Object} config
 * @param {string} config.url - the base URL to load the readweb script
 * @param {string} config.license - the license key
 * @param {boolean} [config.dev] - load readweb in development mode (no cache)
 * @param {boolean} [config.showToolbar] - shows the readweb toolbar (hidden by default)
 * @param {boolean} [config.loadingTimeoutMs=30000] - shows the readweb toolbar (hidden by default)
 * @returns {Promise<ReadAloudClient>} resolves with the client
 */
export default function readwebProvider(config = {}) {
    if (!config.url) {
        return Promise.reject(new Error(`Missing service URL in the configuration 'config.url'`));
    }
    if (!config.license) {
        return Promise.reject(new Error(`Missing license key in the configuration 'config.license'`));
    }

    const scriptUrl = `${config.url}/${config.dev ? 'test-' : ''}${config.license}.js`;

    let ignoreSelector;
    let readStartHandler;
    let readEndHandler;

    /**
     * Update the list of elements to ignore from the reading
     * @param {HTMLElement} container
     */
    function updateIgnoredElements(container) {
        if (ignoreSelector && container) {
            const elementsToIgnore = container.querySelectorAll(ignoreSelector);
            if (elementsToIgnore) {
                for (let elementToIgnore of elementsToIgnore) {
                    if (!elementToIgnore.classList.contains(ignoreClass)) {
                        elementToIgnore.classList.add(ignoreClass);
                    }
                }
            }
        }
    }

    if (!config.showToolbar) {
        createToolBarContainer();
    }

    return loadReadWebScript(scriptUrl, config.loadingTimeoutMs).then(() => {
        if ('vFact_HTML5Player' in window) {
            window.vFact_HTML5Player.setEventHandler_OnChangePlaylistStatus(status => {
                reading = status !== 0;
                if (reading && typeof readStartHandler === 'function') {
                    readStartHandler();
                }
                if (!reading && typeof readEndHandler === 'function') {
                    readEndHandler();
                }
            });
        }

        return {
            /**
             * Starts playing from the given element
             * @param {HTMLElement} element
             */
            play(element) {
                if (element instanceof HTMLElement && typeof window.vFact_playsection === 'function') {
                    //read web requires an id on element to read them
                    if (!element.id) {
                        element.id = generateElementId(element.nodeName);
                    }

                    //run it before every play in case of dynamic update of the nodes
                    updateIgnoredElements(element);
                    window.vFact_playsection(element.id);
                }
            },

            /**
             * Plays the selected text
             */
            playSelection() {
                if (typeof window.vFact_doplay === 'function') {
                    window.vFact_doplay();
                }
            },

            /**
             * Is readweb currently playing
             * @returns {boolean} true when playing
             */
            isReading() {
                return reading;
            },

            /**
             * Calls the handler when reading starts
             * @param {function} handler
             */
            onReadStart(handler) {
                readStartHandler = handler;
            },

            /**
             * Calls the handler when reading ends
             * @param {function} handler
             */
            onReadEnd(handler) {
                readEndHandler = handler;
            },

            /**
             * Stop ongoing playing
             */
            stop() {
                if (typeof window.vFact_dostop === 'function') {
                    window.vFact_dostop();
                }
            },

            /**
             * Prevent reading element matching a selector
             * @param {string} selector - a DOM selector
             */
            ignoreElements(selector) {
                ignoreSelector = selector;
            },

            /**
             * Change the reading preferences
             * @param {string} speed - from the available speeds values
             * @param {string} pitch - from the available pitches values
             * @param {string} [volume] - not supported
             * @param {string} voice - read web supports only F or M
             */
            setPreferences(speed, pitch, volume, voice) {
                if (typeof window.vfact_SetCustomParams === 'function') {
                    window.vfact_SetCustomParams(
                        typeof speedMap[speed] === 'number' ? speedMap[speed] : speedMap.normal,
                        ['F', 'M'].includes(voice) ? voice : config.voice || 'F',
                        typeof pitchMap[pitch] === 'number' ? pitchMap[pitch] : pitchMap.medium
                    );
                }
            }
        };
    });
}
