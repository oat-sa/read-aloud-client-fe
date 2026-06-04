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
 * Copyright (c) 2021-2023 (original work) Open Assessment Technologies SA ;
 */

import * as providers from './lib/providers/index.js';
import { volumes, speeds, pitches } from './lib/preferences.js';

/**
 * Get a read aloud client for a given provider with a specific config
 * @param {string} providerId - the identifier of the provider
 * @param {Object} config - the configuration given 'as is' to the provider
 * @returns {Promise<ReadAloudClient>} resolves with the client
 */
export default function getReadAloudClient(providerId, config = {}) {
    const providerFactory = providers[providerId];

    if (typeof providerFactory !== 'function') {
        return Promise.reject(new TypeError(`Provider ${providerId} not found.`));
    }

    return providerFactory(config).then(provider => {
        if (['play', 'playSelection', 'stop', 'destroy'].some(method => typeof provider[method] !== 'function')) {
            return Promise.reject(new TypeError(`The provider ${providerId} does not comply with the API.`));
        }

        /**
         * @typedef {Object} ReadAloudClient
         * @property {string} id
         * @property {function} play
         * @property {function} playSelection
         * @property {function} [pause]
         * @property {function} [resume]
         * @property {function} [isReading]
         * @property {function} [onReadStart]
         * @property {function} [onReadStop]
         * @property {function} stop
         * @property {function} [toggleClickToSpeak]
         * @property {function} [ignoreElements]
         * @property {function} [setPreferences]
         * @property {function} [getSupport]
         * @property {function} destroy
         */
        return {
            /**
             * Identifier
             * @returns {string}
             */
            get id() {
                return provider.id;
            },

            /**
             * Start playing from that element
             * @param {HTMLElement} element
             * @param {Object} [options]
             * @returns {*}
             */
            play(element, options) {
                return provider.play(element, options);
            },

            /**
             * Start playing the current text selection
             * @returns {*}
             */
            playSelection() {
                return provider.playSelection();
            },

            /**
             * Pause the current playing (with the ability to resume)
             * @returns {*}
             */
            pause() {
                if (typeof provider.pause === 'function') {
                    return provider.pause();
                }
            },

            /**
             * Resume the current paused playing
             * @returns {*}
             */
            resume() {
                if (typeof provider.resume === 'function') {
                    return provider.resume();
                }
            },

            /**
             * Is playing ongoing
             * @returns {boolean|undefined}
             */
            isReading() {
                if (typeof provider.isReading === 'function') {
                    return provider.isReading();
                }
            },

            /**
             * Calls the handler when reading starts
             * @param {function} handler
             */
            onReadStart(handler) {
                if (typeof provider.onReadStart === 'function' && typeof handler === 'function') {
                    provider.onReadStart(handler);
                }
            },

            /**
             * Calls the handler when reading ends
             * @param {function} handler
             */
            onReadEnd(handler) {
                if (typeof provider.onReadEnd === 'function' && typeof handler === 'function') {
                    provider.onReadEnd(handler);
                }
            },

            /**
             * Stop any ongoing plays
             * @returns {*}
             */
            stop() {
                return provider.stop();
            },

            /**
             * Enables or disables the "Click To Speak" mode
             * @returns {boolean|undefined} true if enabled
             */
            toggleClickToSpeak() {
                if (typeof provider.toggleClickToSpeak === 'function') {
                    return provider.toggleClickToSpeak();
                }
            },

            /**
             * Change the reading preferences
             * @param {Object} preferences - can be extended with vendor specific preferences
             * @param {string} preferences.speed - from the available speeds values
             * @param {string} preferences.pitch - from the available pitches values
             * @param {string} preferences.volume - from the available volumes values
             * @returns {*}
             */
            setPreferences(preferences = {}) {
                if (typeof provider.setPreferences === 'function') {
                    return provider.setPreferences(
                        Object.assign({}, preferences, {
                            speed: Object.values(speeds).includes(preferences.speed)
                                ? preferences.speed
                                : void 0,
                            pitch: Object.values(pitches).includes(preferences.pitch)
                                ? preferences.pitch
                                : void 0,
                            volume: Object.values(volumes).includes(preferences.volume)
                                ? preferences.volume
                                : void 0
                        })
                    );
                }
            },

            /**
             * Ignore elements with the given selector
             * @param {string} selector - any dom selector
             * @returns {*}
             */
            ignoreElements(selector) {
                if (typeof provider.ignoreElements === 'function') {
                    return provider.ignoreElements(selector);
                }
            },

            /**
             * @typedef {Object} OptionConstraints
             * @property {Object} voice - Voice configuration.
             * @property {boolean} voice.disabled
             * @property {Object} speed - Speed configuration.
             * @property {boolean} speed.disabled
             * @property {string[]} speed.options - Enabled speed options - values from the 'speeds' preferences.
             * @property {Object} pitch - Pitch configuration.
             * @property {boolean} pitch.disabled
             */

            /**
             * Supported provider configuration options
             * @returns {OptionConstraints}
             */
            getSupport() {
                if (typeof provider.getSupport === 'function') {
                    return provider.getSupport();
                } else {
                    /*
                     * Default "Enable all" case
                     */
                    return {
                        voice: { disabled: false },
                        speed: {
                            disabled: false,
                            options: [
                                speeds.slowest,
                                speeds.slow,
                                speeds.normal,
                                speeds.fast,
                                speeds.fastest
                            ],
                        },
                        pitch:  { disabled: false },
                        clickToSpeak: false,
                    };
                }
            },

            /**
             * Destroy the provider
             * @returns {*}
             */
            destroy() {
                return provider.destroy();
            }
        };
    });
}

/**
 * Expose the list of available providers
 * @returns {string[]} the list of provider ids
 */
export function getAvailableProviders() {
    return Object.keys(providers);
}
