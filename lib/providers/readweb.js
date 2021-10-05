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
import { findClosestElementWithALang, getLanguagePart } from '../util/locale.js';
import { isTextSelected, getSelectionAncestor } from '../util/selection.js';
import { generateElementId } from '@oat-sa-private/ui-core/dom/dom.js';

const speedMap = {
    [speeds.slowest]: 3,
    [speeds.slow]: 5,
    [speeds.normal]: 2,
    [speeds.fast]: 1,
    [speeds.fastest]: 4
};

//seems to no have any effect
const pitchMap = {
    [pitches.lowest]: 3,
    [pitches.low]: 3,
    [pitches.medium]: 2,
    [pitches.high]: 1,
    [pitches.highest]: 1
};

//Readweb language map for non standard codes
const langMap = {
    da: 'dk',
    nb: 'no'
};

const ignoreClass = 'vFact_DoNotReadAloud';
const containerId = 'readweb-container';

let reading = false;

/**
 * Load the Readweb initial script. This has to be done once per page.
 * @param {string} url - the full of the script
 * @param {number} [loadingTimeoutMs] - script loading timeout
 * @returns {Promise} resolves when the script is loaded or if it's already loaded
 */
function loadReadWebScript(url, loadingTimeoutMs = 30000) {
    const currentScript = document.head.querySelector('script[data-tts="readweb"]');
    if (currentScript !== null) {
        if(currentScript.dataset.loaded){
            return Promise.resolve();
        }
        document.head.removeChild(currentScript);
    }

    let iframeContentInterval;
    let timeout;
    return Promise.race([
        new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.addEventListener('load', () => {
                if ('startleseweb' in window) {
                    //Readweb entry point
                    window.startleseweb();

                    //TODO check if this check is reliable with the provider
                    iframeContentInterval = setInterval(() => {
                        const frame = document.getElementById('vFact_audioFrame');
                        if (frame && 'vFactDetect2' in frame.contentWindow) {
                            clearInterval(iframeContentInterval);

                            //ensure the frame doesn't break the layout
                            frame.style.position = 'absolute';
                            frame.style.display = 'block';

                            script.dataset.loaded = true;
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
            script.crossOrigin = 'anonymous';
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
        topContainer.style.display = 'none';
        const container = document.createElement('div');
        container.id = containerId;
        topContainer.appendChild(container);

        document.body.appendChild(topContainer);
    }
}

/**
 * Readweb supports only the language subtag of a locale code,
 * and with some non standard values. So we swap the value of the lang attribute
 * with the value for Readweb during the reading
 * @param {HTMLElement} element
 */
function swapLangAttribute(element) {
    const langHolderElement = findClosestElementWithALang(element);
    if (langHolderElement) {
        const langValue = langHolderElement.getAttribute('lang');
        const langSubPart = getLanguagePart(langValue);
        if (langValue && langSubPart) {
            langHolderElement.dataset.ttsOriginalLang = langValue;
            langHolderElement.setAttribute('lang', langMap[langSubPart] ? langMap[langSubPart] : langSubPart);
        }
    }
}

/**
 * Restore all lang attributes to their original values
 */
function restoreLangAttribute() {
    const langHolderElements = document.querySelectorAll('[data-tts-original-lang]');
    for (let langHolderElement of langHolderElements) {
        langHolderElement.setAttribute('lang', langHolderElement.dataset.ttsOriginalLang);
        delete langHolderElement.dataset.ttsOriginalLang;
    }
}

/**
 * ReadWeb provider
 * @see http://leseweb.dk/
 *
 * @param {Object} config
 * @param {string} config.url - the base URL to load the Readweb script
 * @param {string} config.license - the license key
 * @param {boolean} [config.dev] - load Readweb in development mode (no cache)
 * @param {boolean} [config.showToolbar] - shows the Readweb toolbar (hidden by default)
 * @param {boolean} [config.loadingTimeoutMs=30000] - shows the Readweb toolbar (hidden by default)
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
                if (!reading) {
                    if (typeof readEndHandler === 'function') {
                        readEndHandler();
                    }
                    restoreLangAttribute();
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
                    swapLangAttribute(element);

                    window.vFact_playsection(element.id);
                }
            },

            /**
             * Plays the selected text
             */
            playSelection() {
                if (typeof window.vFact_doplay === 'function' && isTextSelected()) {

                    const ancestorElement = getSelectionAncestor();
                    updateIgnoredElements(ancestorElement);
                    swapLangAttribute(ancestorElement);

                    window.vFact_doplay();
                }
            },

            /**
             * Is Readweb currently reading
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
             * @param {Object} preferences
             * @param {string} preferences.speed - from the available speeds values
             * @param {string} preferences.pitch - from the available pitches values
             * @param {string} preferences.voice - read web supports only F or M
             */
            setPreferences({ speed, pitch, voice } = {}) {
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
