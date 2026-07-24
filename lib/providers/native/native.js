// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License


import { speeds, pitches, volumes } from '../../preferences.js';
import { normalize, findClosestLang, getLanguagePart } from '../../util/locale.js';
import { isTextSelected, getSelectionAncestor } from '../../util/selection.js';

const speedMap = {
    [speeds.slowest]: 0.5,
    [speeds.slow]: 0.75,
    [speeds.normal]: 1,
    [speeds.fast]: 1.15,
    [speeds.fastest]: 1.3
};

const pitchMap = {
    [pitches.lowest]: 0,
    [pitches.low]: 0.5,
    [pitches.medium]: 1,
    [pitches.high]: 1.5,
    [pitches.highest]: 2
};

const volumeMap = {
    [volumes.lowest]: 0,
    [volumes.low]: 0.25,
    [volumes.medium]: 0.5,
    [volumes.high]: 0.75,
    [volumes.highest]: 1
};

/**
 * Native provider based on browser's SpeechSynthesis
 *
 * Supported only by Chrome (deskop and mobile) and Firefox. Some OS config may be required.
 *
 * @param {Object} config
 * @param {string} [config.lang] - fallback lang code
 * @returns {Promise<ReadAloudClient>}
 */
export default function nativeProvider(config = {}) {
    if (!('speechSynthesis' in window)) {
        return Promise.reject(new Error('No speech synthesis system found for your setup.'));
    }

    const preferences = {
        pitch: pitchMap[pitches.medium],
        rate: speedMap[speeds.normal],
        volume: volumeMap[volumes.medium]
    };
    let ignoreSelector = config.ignoreSelector || '';
    const voicesByLang = new Map();

    /**
     * Creates the speech utterance
     * @param {string} text - the text to read aloud
     * @param {string} lang - the lang code of the voice to use
     * @returns {SpeechSynthesisUtterance}
     */
    function createUtterance(text, lang) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = preferences.rate;
        utterance.pitch = preferences.pitch;
        utterance.volume = preferences.volume;

        if (lang) {
            //try to find the voice for the lang as best effort (lang value and voice lang code aren't standardized)
            if (voicesByLang.has(lang)) {
                utterance.voice = voicesByLang.get(lang);
            } else if (voicesByLang.has(normalize(lang))) {
                utterance.voice = voicesByLang.get(normalize(lang));
            } else if (voicesByLang.has(getLanguagePart(lang))) {
                utterance.voice = voicesByLang.get(getLanguagePart(lang));
            } else if (/[a-z]{2}/.test(lang)) {
                const matching = Array.from(voicesByLang.keys()).filter(langKey => langKey.startsWith(lang));
                if (matching.length) {
                    utterance.voice = voicesByLang.get(matching[0]);
                }
            }
        }
        return utterance;
    }

    /**
     * Extract the text to read from an element,
     * by filtering out content we don't want to read aloud.
     * @param {HTMLElement} element
     * @returns {string} the text to read
     */
    function getTextToRead(element) {
        if (ignoreSelector) {
            const clone = element.cloneNode(true);
            const ignoredChildren = clone.querySelectorAll(ignoreSelector);
            ignoredChildren.forEach(child => {
                child.parentNode.removeChild(child);
            });
            /**
             * innerText is aplicable only to rendered nodes
             * as it also counts the CSS
             * for detached nodes, like the `clone` one
             * textContent should be used, as innerText would be empty
             */
            return clone.textContent.trim();
        }
        return element.innerText;
    }

    return Promise.race([
        new Promise(resolve => {
            let voices;
            const mapVoices = () => {
                if (voices.length === 0) {
                    throw new Error('No voice found for the speech system.');
                }
                voices.forEach(voice => voicesByLang.set(voice.lang, voice));
            };

            //getVoices is synchronous on FF, but on chrome, it works only
            //after being called and the `onvoiceschanged` triggered
            speechSynthesis.onvoiceschanged = function () {
                voices = speechSynthesis.getVoices();
                mapVoices();
                resolve();
            };
            voices = speechSynthesis.getVoices();
            if (voices.length) {
                mapVoices();
                resolve();
            }
        }),
        new Promise((resolve, reject) => setTimeout(() => reject(new Error('Unable to retrieve system voices')), 500))
    ]).then(() => ({
        id: 'native',

        /**
         * Plays the text extracted from that element
         * @param {HTMLElement} element
         */
        play(element) {
            if (element instanceof HTMLElement) {
                speechSynthesis.speak(createUtterance(getTextToRead(element), findClosestLang(element) || config.lang));
            }
        },

        /**
         * Plays the selected text
         */
        playSelection() {
            if (isTextSelected()) {
                speechSynthesis.speak(
                    createUtterance(
                        window.getSelection().toString(),
                        findClosestLang(getSelectionAncestor()) || config.lang
                    )
                );
            }
        },

        /**
         * Stop any ongoing play
         */
        stop() {
            speechSynthesis.cancel();
        },

        /**
         * Set the selector of elements to ignore while reading
         * @param {string} selector - the dom selector
         */
        ignoreElements(selector) {
            if (ignoreSelector && selector) {
                ignoreSelector = `${ignoreSelector},${selector}`;
            } else if (selector) {
                ignoreSelector = selector;
            }
        },

        /**
         * Change the reading preferences
         * @param {Object} preferences
         * @param {string} preferences.speed - from the available speeds values
         * @param {string} preferences.pitch - from the available pitches values
         * @param {string} preferences.volume - from the available volumes values
         */
        setPreferences({ speed, pitch, volume } = {}) {
            if (typeof speedMap[speed] === 'number') {
                preferences.rate = speedMap[speed];
            }
            if (typeof pitchMap[pitch] === 'number') {
                preferences.pitch = pitchMap[pitch];
            }
            if (typeof volumeMap[volume] === 'number') {
                preferences.volume = volumeMap[volume];
            }
        },
        /**
         * Supported provider configuration options
         * @returns {OptionConstraints}
         */
        getSupport() {
            /*
             * Voice packs a OS nd browser specific
             * we cannot be sure if a certain voice has gender options
             */
            return {
                voice: { disabled: true },
                speed: {
                    disabled: false,
                    options: [speeds.slowest, speeds.slow, speeds.normal, speeds.fast, speeds.fastest]
                },
                pitch: { disabled: false },
                clickToSpeak: false,
            };
        },

        /**
         * Destroy provider
         */
        destroy() {
            this.stop();
        }
    }));
}
