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
import { findClosestElementWithALang } from '../util/locale.js';
import { getSelectionAncestor, isTextSelected } from '../util/selection.js';
import { lookupVoice } from './texthelp/voices.js';

// SpeechStream supports (according to docs) a number 1-100,
// but (according to support, to ease caching) only 3 distinct speeds should be used
const speedMap = Object.freeze({
    [speeds.slowest]: 25,
    [speeds.slow]: 25,
    [speeds.normal]: 40,
    [speeds.fast]: 55,
    [speeds.fastest]: 55
});

const voiceMap = Object.freeze({
    [voices.female]: 'female',
    [voices.male]: 'male'
});

let cache = null;

/**
 * Load the SpeechStream initial script. This has to be done once per page.
 * @param {string} url - the full URL of the script
 * @param {string} speechstreamConfig - the name of the config to read
 * @param {number} [loadingTimeoutMs] - script loading timeout
 * @returns {Promise<SpeechStreamAPI>} resolves when the script is loaded or if it's already loaded
 */
function loadSpeechStreamScript(url, speechstreamConfig, loadingTimeoutMs = 30000) {
    if (cache && cache.url === url && cache.speechstreamConfig === speechstreamConfig) {
        return Promise.resolve(cache.api);
    }
    cache = null;

    const currentScript = document.head.querySelector('script[data-tts="texthelp"]');
    if (currentScript !== null) {
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
            script.addEventListener('error', reject);

            const doLateLoad = event => {
                window.removeEventListener('toolbarLoaderLoaded', doLateLoad);

                if (typeof event.detail.Loader.lateLoad === 'function') {
                    // resolves with SpeechStream API
                    const api = event.detail.Loader.lateLoad();
                    cache = { api, url, speechstreamConfig };
                    script.dataset.loaded = true;
                    resolve(api);
                } else {
                    reject(new Error('SpeechStream Loader.lateLoad() is not available'));
                }
            };
            // event fired from the loaded script - means Loader API is ready to be called
            window.addEventListener('toolbarLoaderLoaded', doLateLoad);

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
 * @param {string} [config.ignoreSelector] - CSS selector of elements to be ignored when speaking
 * @param {boolean} [config.disableLangCheck] - if true, the DOM will be checked for a lang on each play. If false, a default voice should be specified.
 * @param {string} [config.voiceGender] - the default voice gender. It will be applied permanently only if using disableLangCheck.
 * @param {string} [config.voiceLanguage] - the default voice language. It will be applied permanently only if using disableLangCheck.
 * @returns {Promise<TextHelpClient>} resolves with the client
 */
export default function texthelpProvider(config = {}) {
    if (!config.url) {
        return Promise.reject(new Error(`Missing service URL in the configuration 'config.url'`));
    }
    if (!config.speechstreamConfig) {
        console.warn(`Missing configuration 'config.speechstreamConfig'. Default will be used.`); // eslint-disable-line no-console
    }

    let ignoreSelector = config.ignoreSelector || '';

    let voiceGender = config.voiceGender || voices.female;
    let voiceLanguage = config.voiceLanguage || 'en';
    let defaultVoice = lookupVoice(voiceGender, voiceLanguage);

    let allowLangCheck = !config.disableLangCheck;

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

        // Set the initial voice, as it may or may not be set again on play
        speechTools.setVoice(defaultVoice);
        /**
         * SpeechStrem has their own `lang` attribute
         * recognition flow, that is to be disabled when
         * config.disableLangcheck is set to true
         */
        speechTools.setUseElementLangTags(allowLangCheck);

        // Intercept all clicks, in case we should change voice settings based on the element in click-to-speak mode
        function setVoiceForClickedElement(event) {
            if (event.target instanceof HTMLElement && speechTools.getClickToSpeakState() && allowLangCheck) {
                setVoiceBasedOnElementLang(event.target);
            }
        }
        document.addEventListener('click', setVoiceForClickedElement);

        /**
         * Sets the SpeechStream voice based on current voiceGender setting
         * and the `lang` attribute closest to the element being read.
         * @param {HTMLElement} element
         */
        function setVoiceBasedOnElementLang(element) {
            const langHolderElement = findClosestElementWithALang(element);
            if (langHolderElement) {
                const voice = lookupVoice(voiceGender, langHolderElement.getAttribute('lang'));
                speechTools.setVoice(voice);
            }
        }

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

                    if (allowLangCheck) {
                        setVoiceBasedOnElementLang(element);
                    }

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

                        const ancestorElement = getSelectionAncestor();
                        if (allowLangCheck) {
                            setVoiceBasedOnElementLang(ancestorElement);
                        }

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
             * @param {string} preferences.voice - from the available voices values (modifies value initially read from config.voiceGender)
             * @param {string} preferences.language - a default language for the voice (modifies value initially read from config.voiceLanguage)
             * @param {boolean} preferences.disableLangCheck - modifies value initially read from config.disableLangCheck
             * @param {boolean} [preferences.autoscroll] - scroll viewport continuously to element being read
             *                                             (whether true or false, there will always be 1 initial scroll to it)
             */
            setPreferences({ speed, voice, language, disableLangCheck, autoscroll } = {}) {
                if (speed && typeof speechTools.setVoiceSpeed === 'function') {
                    speechTools.setVoiceSpeed(
                        typeof speedMap[speed] === 'number' ? speedMap[speed] : speedMap[speeds.normal]
                    );
                }
                const mappedVoice = voice && voiceMap[voice];
                if (mappedVoice) {
                    voiceGender = mappedVoice;
                }
                if (language) {
                    voiceLanguage = language;
                }
                if ((mappedVoice || language) && typeof speechTools.setVoice === 'function') {
                    defaultVoice = lookupVoice(voiceGender, voiceLanguage);
                    speechTools.setVoice(defaultVoice);
                }
                if (typeof disableLangCheck === 'boolean') {
                    allowLangCheck = !disableLangCheck;
                    speechTools.setUseElementLangTags(allowLangCheck);
                }
                if (typeof autoscroll === 'boolean' && typeof domControlTools.setNoScroll === 'function') {
                    domControlTools.setNoScroll(!autoscroll);
                }
            },

            /**
             * Supported provider configuration options
             * @returns {OptionConstraints}
             */
            getSupport() {
                /*
                 * For text help voice gender and speed are enabled
                 * Speed has three options available; RFE-614
                 */
                return {
                    voice: { disabled: false },
                    speed: {
                        disabled: false,
                        options: [
                            speeds.slowest,
                            speeds.normal,
                            speeds.fastest
                        ],
                    },
                    pitch:  { disabled: true },
                    clickToSpeak: true,
                };
            },

            /**
             * Destroy provider
             */
            destroy() {
                this.stop();
                document.removeEventListener('click', setVoiceForClickedElement);
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
