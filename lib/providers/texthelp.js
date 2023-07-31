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
 * Copyright (c) 2023 (original work) Open Assessment Technologies SA ;
 */
import { speeds, voices } from '../preferences.js';
import { isTextSelected, getSelectionAncestor } from '../util/selection.js';
import { generateElementId } from '../util/dom.js';

// TODO: SpeechStream supports only 3 speeds
const speedMap = Object.freeze({
    [speeds.slowest]: 3,
    [speeds.slow]: 5,
    [speeds.normal]: 2,
    [speeds.fast]: 1,
    [speeds.fastest]: 4
});

// TODO: SpeechStream uses person names, we should re-map them
const voiceMap = Object.freeze({
    [voices.female]: 'F',
    [voices.male]: 'M'
});

const ignoreClass = 'vFact_DoNotReadAloud'; // TODO:

// let reading = false;

/**
 * Load the SpeechStream initial script. This has to be done once per page.
 * @param {string} url - the full URL of the script
 * @param {string} speechstreamConfig - the name of the config to read
 * @param {number} [loadingTimeoutMs] - script loading timeout
 * @returns {Promise<SpeechStreamAPI>} resolves when the script is loaded or if it's already loaded
 */
function loadSpeechStreamScript(url, speechstreamConfig, loadingTimeoutMs = 30000) {
    const currentScript = document.head.querySelector('script[data-tts="texthelp"]');
    if (currentScript !== null) {
        if (currentScript.dataset.loaded) {
            return Promise.resolve();
        }
        document.head.removeChild(currentScript);
    }

    let timeout;
    return Promise.race([
        new Promise((resolve, reject) => {
            // Inject a script tag, according to this example:
            // <script src="https://toolbar.speechstream.net/SpeechStream/3.9.0/speechstream.js" type="text/javascript" data-speechstream-config="TAOPremiumv390R1"></script>
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = url;
            script.dataset.speechstreamConfig = speechstreamConfig;
            script.dataset.tts = 'texthelp';

            script.addEventListener('load', () => {
                script.dataset.loaded = true;

                const doLateLoad = event => {
                    window.removeEventListener('toolbarLoaderLoaded', doLateLoad);

                    if (typeof event.detail.Loader.lateLoad === 'function') {
                        // resolves with SpeechStream API
                        resolve(event.detail.Loader.lateLoad());
                    } else {
                        reject(new Error('SpeechStream Loader.lateLoad() is not available'));
                    }
                };
                // event fired from the loaded script - means Loader API is ready to be called
                window.addEventListener('toolbarLoaderLoaded', doLateLoad);
            });
            script.addEventListener('error', reject);

            document.head.appendChild(script);
        }),
        new Promise((resolve, reject) => {
            timeout = setTimeout(
                () => reject(new Error('Timeout: unable to load the SpeechStream script')),
                loadingTimeoutMs
            );
        })
    ]).finally(() => {
        if (timeout) {
            clearTimeout(timeout);
        }
    });
}

/**
 * TextHelp provider (aka SpeechStream)
 * @see https://docs.speechstream.net
 *
 * Certain configs are baked into config files on TextHelp's servers.
 * These values are modifiable only by requesting it from TextHelp support.
 * Includes: hideUI, voiceList, defaultVoice, delayload
 *
 * The values that we _can_ change on the fly are documented below:
 * @param {Object} config
 * @param {string} config.url - the base URL to load the SpeechStream script
 * @param {string} config.speechstreamConfig - the name of the config to read
 * @param {boolean} [config.loadingTimeoutMs=30000] - script loading timeout
 * @param {boolean} [config.languageVoiceMapping]
 * @param {boolean} [config.highlightStyle]
 * @returns {Promise<TextHelpClient>} resolves with the client
 */
export default function texthelpProvider(config = {}) {
    if (!config.url) {
        return Promise.reject(new Error(`Missing service URL in the configuration 'config.url'`));
    }
    if (!config.speechstreamConfig) {
        console.warn(`Missing configuration 'config.speechstreamConfig'. Default will be used.`); // eslint-disable-line no-console
    }

    let ignoreSelector;
    let readStartHandler;
    let readEndHandler;

    /**
     * Update the list of elements to ignore from the reading
     * @param {HTMLElement} container
     * TODO: remove, if SS is capable of managing ignores in a dynamic DOM
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

    return loadSpeechStreamScript(config.url, config.speechstreamConfig, config.loadingTimeoutMs).then(api => {
        console.log(api);
        if (!api) {
            throw new Error('No SpeechStream API available after it was loaded!');
        }
        const { speechTools, domControlTools } = api || {};
        if (!speechTools) {
            throw new Error('SpeechStream API available but it looks incompatible!');
        }
        const domControl = domControlTools.getNewDomControl(window.document);

        // Connect this provider's readStart/readEnd handlers (if assigned) to SpeechStream API
        speechTools.setSpeechStartedCallback(() => {
            if (typeof readStartHandler === 'function') {
                readStartHandler();
            }
        });
        speechTools.setSpeechStoppedCallback(() => {
            if (typeof readEndHandler === 'function') {
                readEndHandler();
            }
        });

        return {
            id: 'texthelp',

            /**
             * Starts playing from the given element
             * @param {HTMLElement} element
             */
            play(element) {
                if (element instanceof HTMLElement && typeof speechTools.play === 'function') {
                    // SpeechStream requires an id on an element to read it
                    // if (!element.id) {
                    //     element.id = generateElementId(element.nodeName);
                    // }

                    //run it before every play in case of dynamic update of the nodes
                    updateIgnoredElements(element);

                    const andContinue = true; // TODO: configure?
                    speechTools.speakElement(element, andContinue);
                }
            },

            /**
             * Plays the selected text
             */
            playSelection() {
                if (isTextSelected()) {
                    const ancestorElement = getSelectionAncestor();

                    // FIXME: doesn't read single selected word
                    // FIXME: SS throws error if this was an ignored element
                    this.play(ancestorElement);
                }
            },

            /**
             * Is it currently reading
             * @returns {boolean} true when playing
             */
            isReading() {
                return speechTools.isSpeaking();
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
                if (typeof speechTools.stop === 'function') {
                    speechTools.stop();
                }
            },

            /**
             * Prevent reading element matching a selector
             * @param {string} selector - a DOM selector
             */
            ignoreElements(selector) {
                ignoreSelector = selector;
                domControl.addIgnoreListQuerySelector(selector);
            },

            /**
             * Change the reading preferences
             * @param {Object} preferences
             * @param {string} preferences.speed - from the available speeds values
             * @param {string} preferences.voice - from the available voices values
             * @param {boolean} [preferences.autoscroll] - scroll viewport to element
             * @param {string} [preferences.highlightStyle] - CSS rules applied to highlighted text
             */
            setPreferences({ speed, voice, autoscroll, highlightStyle } = {}) {
                if (speed && typeof speechTools.setVoiceSpeed === 'function') {
                    speechTools.setVoiceSpeed(typeof speedMap[speed] === 'number' ? speedMap[speed] : speedMap[speeds.normal]);
                }
                if (voice && typeof speechTools.setVoice === 'function') {
                    speechTools.setVoice(typeof voiceMap[voice] === 'string' ? voiceMap[voice] : voiceMap[voices.female]);
                }
                if (typeof autoscroll !== 'undefined' && typeof domControlTools.setNoScroll === 'function') {
                    domControlTools.setNoScroll(!!autoscroll);
                }
                if (typeof highlightStyle === 'string' && highlightStyle.length && typeof domControlTools.setSentenceHighlightStyle === 'function') {
                    domControlTools.setSentenceHighlightStyle(highlightStyle);
                }
            },

            /**
             * Destroy provider
             */
            destroy() {
                this.stop();
            }
        };
    });
}
