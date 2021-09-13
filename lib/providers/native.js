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

import { speeds, pitches, volumes } from '../preferences.js';

const speedMap = {
    [speeds.slowest]: 0.1,
    [speeds.slow]: 0.5,
    [speeds.normal]: 1,
    [speeds.fast]: 2,
    [speeds.fastest]: 10
};

const pitchMap = {
    [pitches.lowest]: 0,
    [pitches.low]: 0.,
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
        return Promise.reject(new Error('No voice found for the speech system.'));
    }

    const preferences = {
        pitch: pitchMap[pitches.medium],
        rate: speedMap[speeds.normal],
        volume: volumeMap[volumes.medium]
    };
    let ignoreSelector;
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
            } else if (/[a-z]{2,}_[A-Z0-9]{2}/.test(lang) && voicesByLang.has(lang.replace('_', '-'))) {
                utterance.voice = voicesByLang.get(lang.replace('_', '-'));
            } else if (/[-_]+/.test(lang)) {
                const localeLang = lang.split(/[-_]+/)[0];
                if (voicesByLang.has(localeLang)) {
                    utterance.voice = voicesByLang.get(localeLang);
                }
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
     * Find the closest lang attribute for an element
     * @param {HTMLElement} element
     * @returns {string} the lang code, fallback to the config
     */
    function findClosestLang(element) {
        if (element.getAttribute('lang')) {
            return element.getAttribute('lang');
        }
        const parentElement = element.closest('[lang]');
        if (parentElement) {
            return parentElement.getAttribute('lang');
        }
        return config.lang;
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
            const toFilterElements = clone.querySelectorAll(ignoreSelector);
            for (let toFilterElement of toFilterElements) {
                toFilterElement.innerHTML = '';
            }
            return clone.textContent;
        }
        return element.textContent;
    }

    return new Promise((resolve, reject) => {

        //getVoices is synchronous on FF, but on chrome, it works only
        //after being called and the `onvoiceschanged` triggered
        speechSynthesis.onvoiceschanged = function () {
            const voices = speechSynthesis.getVoices();
            if (voices.length === 0) {
                return reject(new Error('No voice found for the speech system.'));
            }
            voices.forEach(voice => voicesByLang.set(voice.lang, voice));
            resolve();
        };
        speechSynthesis.getVoices();
    }).then(() => ({

        /**
         * Plays the text extracted from that element
         * @param {HTMLElement} element
         */
        play(element) {
            if (element instanceof HTMLElement) {
                speechSynthesis.speak(createUtterance(getTextToRead(element), findClosestLang(element)));
            }
        },

        /**
         * Plays the selected text
         */
        playSelection() {
            const selection = window.getSelection();
            if (selection.rangeCount) {
                let parentElement = selection.getRangeAt(0).commonAncestorContainer;
                if (parentElement.nodeType !== 1) {
                    parentElement = parentElement.parentNode;
                }
                speechSynthesis.speak(createUtterance(selection.toString(), findClosestLang(parentElement)));
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
            ignoreSelector = selector;
        },

        /**
         * Change the reading preferences
         * @param {string} speed - from the available speeds values
         * @param {string} pitch - from the available pitches values
         * @param {string} volume - from the available volumes values
         */
        setPreferences(speed, pitch, volume) {
            if(typeof speedMap[speed] === 'number') {
                preferences.rate = speedMap[speed];
            }
            if(typeof pitchMap[pitch] === 'number') {
                preferences.pitch = pitchMap[pitch];
            }
            if(typeof volumeMap[volume] === 'number') {
                preferences.volume = volumeMap[volume];
            }
        }
    }));
}
