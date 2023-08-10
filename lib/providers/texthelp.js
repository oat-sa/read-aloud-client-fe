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
import { isTextSelected } from '../util/selection.js';

// TODO: SpeechStream supports (according to docs) a number 1-100,
// but (according to support) only 3 distinct speeds should be used
const speedMap = Object.freeze({
    [speeds.slowest]: 20,
    [speeds.slow]: 20,
    [speeds.normal]: 50,
    [speeds.fast]: 80,
    [speeds.fastest]: 80
});

// SpeechStream uses person names, these are the defaults
// It can also auto-switch to a different person based on the language being read
// TODO: allow these values to be set by the consumer
const voiceMap = Object.freeze({
    [voices.female]: 'Ava',
    [voices.male]: 'Tom'
});

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

    let ignoreSelector = '';
    let readStartHandler;
    let readEndHandler;

    return loadSpeechStreamScript(config.url, config.speechstreamConfig, config.loadingTimeoutMs).then(api => {
        if (!api) {
            throw new Error('No SpeechStream API available after it was loaded!');
        }

        const { speechTools, domControlTools } = api || {};

        if (!speechTools || !domControlTools) {
            throw new Error('SpeechStream API available but it looks incompatible!');
        }

        const domControl = domControlTools.getNewDomControl(document);

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
                if (element instanceof HTMLElement && typeof speechTools.speakElement === 'function') {
                    // run it before every play in case of dynamic update of the nodes
                    this.ignoreElements();

                    const andContinue = true;
                    speechTools.speakElement(element, andContinue);
                }
            },

            /**
             * Plays the selected text
             */
            playSelection() {
                if (isTextSelected()) {
                    try {
                        // run it before every play in case of dynamic update of the nodes
                        this.ignoreElements();

                        // can throw depending on how selection crosses node boundaries
                        speechTools.play();
                    } catch (e) {
                        console.error(e); // eslint-disable-line no-console
                    }
                }
            },

            /**
             * Pause the current playing (with the ability to resume)
             */
            pause() {
                if (typeof speechTools.isPaused === 'function' && typeof speechTools.pause === 'function') {
                    if (!speechTools.isPaused()) {
                        speechTools.pause();
                    }
                }
            },

            /**
             * Resume the current paused playing
             */
            resume() {
                if (typeof speechTools.isPaused === 'function' && typeof speechTools.pause === 'function') {
                    if (speechTools.isPaused()) {
                        speechTools.pause(); // same call pauses & resumes
                    }
                }
            },

            /**
             * Is it currently reading?
             * @returns {boolean|undefined} true when playing
             */
            isReading() {
                if (typeof speechTools.isSpeaking === 'function') {
                    return speechTools.isSpeaking();
                }
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
             * Enables or disables the "Click To Speak" mode.
             * In this mode, a pointer action on the document will try to play the targeted element.
             * Note: CTS mode can be 'click' or 'hover' depending on remote config file.
             * Note: initial state could be determined by config file (usually off)
             * @returns {boolean} true if the feature is now enabled
             */
            toggleClickToSpeak() {
                if (
                    typeof speechTools.clickToSpeak === 'function' &&
                    typeof speechTools.getClickToSpeakState === 'function' &&
                    typeof speechTools.setContinuousReading === 'function'
                ) {
                    speechTools.clickToSpeak();
                    const newCtsState = speechTools.getClickToSpeakState();
                    speechTools.setContinuousReading(!newCtsState);
                    return newCtsState;
                }
                return false;
            },

            /**
             * Prevent reading elements matching a selector.
             * SpeechStream v3 uses querySelectorAll to select only elements which are presently rendered
             * (not future elements matching the selector), so call this again later if content is dynamic
             * @param {string} selector - a DOM selector
             */
            ignoreElements(selector = '') {
                if (ignoreSelector && selector) {
                    ignoreSelector = `${ignoreSelector},${selector}`;
                } else if (selector) {
                    ignoreSelector = selector;
                }
                if (typeof domControl.addIgnoreListQuerySelector === 'function') {
                    domControl.addIgnoreListQuerySelector(ignoreSelector);
                }
            },

            /**
             * Change the reading preferences
             * @param {Object} preferences
             * @param {string} preferences.speed - from the available speeds values
             * @param {string} preferences.voice - from the available voices values
             * @param {boolean} [preferences.autoscroll] - scroll viewport continuously to element being read
             *                                             (whether true or false, there will always be 1 initial scroll to it)
             * @param {string} [preferences.highlightStyle] - CSS rules applied to highlighted text (background, color)
             */
            setPreferences({ speed, voice, autoscroll, highlightStyle } = {}) {
                if (speed && typeof speechTools.setVoiceSpeed === 'function') {
                    speechTools.setVoiceSpeed(
                        typeof speedMap[speed] === 'number' ? speedMap[speed] : speedMap[speeds.normal]
                    );
                }
                if (voice && typeof speechTools.setVoice === 'function') {
                    speechTools.setVoice(
                        typeof voiceMap[voice] === 'string' ? voiceMap[voice] : voiceMap[voices.female]
                    );
                }
                if (typeof autoscroll !== 'undefined' && typeof domControlTools.setNoScroll === 'function') {
                    domControlTools.setNoScroll(!autoscroll);
                }
                if (
                    typeof highlightStyle === 'string' &&
                    highlightStyle.length &&
                    typeof speechTools.setSentenceHighlightStyle === 'function'
                ) {
                    speechTools.setSentenceHighlightStyle(highlightStyle);
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

/**
 * The Content Security Policy recommended by TextHelp.
 * Can be applied as a HTTP response header or a `<meta http-equiv="Content-Security-Policy">` tag.
 * @see https://support.texthelp.com/help/content-security-policies-for-reachdeck
 */
export const contentSecurityPolicy = `
default-src
    'self';
  style-src
    'self'
    'unsafe-inline'
    https://*.speechstream.net/;
  Script-src
    https://*.speechstream.net
    https://www.googletagmanager.com/
    https://www.google-analytics.com/
    https://apis.google.com
   'sha256-aEDmoObzmjNv962J42VzD3ELW5yetlhKLnYGA32/4aU=';
  img-src
    https://speechstreamv3-webservices-8.texthelp.com/
    https://speechstreamv3-webservices-eu.texthelp.com/
    https://*.speechstream.net
    'self'
    https://*.speechstream.net
    https://www.google-analytics.com/
    https://stats.g.doubleclick.net
    data:;
  child-src
    'self'
    https://content.googleapis.com
    https://www.googletagmanager.com/ns.html;
  Connect-src
    blob:
    https://*.speechstream.net
    https://en.wikipedia.org/
    https://speechstreamv3-webservices-8.texthelp.com/
    https://speechstreamv3-webservices-eu.texthelp.com/
    https://stats.g.doubleclick.net
    https://www.google-analytics.com/;
  media-src
    'self'
    blob:
    https://*.speechstream.net;`;
