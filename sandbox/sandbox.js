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

import getReadAloudClient from '../index.js';
import { speeds, pitches, volumes } from '../lib/preferences.js';

const nav = document.querySelector('nav');

//provider selection
const providersGroup = nav.querySelector('[name="providers"]');
const providerSelect = providersGroup.querySelector('[name="provider"]');
const providerConfigText = providersGroup.querySelector('[name="provider-config"]');

//controls
const controlsGroup = nav.querySelector('[name="controls"]');
const playButton = controlsGroup.querySelector('[name="play"]');
const playSelectionButton = controlsGroup.querySelector('[name="play-selection"]');
const stopButton = controlsGroup.querySelector('[name="stop"]');
const articleSelect = controlsGroup.querySelector('[name="article-lang"]');

//preferences
const preferencesGroup = nav.querySelector('[name="preferences"]');
const speedRange = preferencesGroup.querySelector('[name="speed"]');
const pitchRange = preferencesGroup.querySelector('[name="pitch"]');
const volumeRange = preferencesGroup.querySelector('[name="volume"]');

let selectedClient;

playButton.addEventListener('click', () => {
    if (selectedClient) {
        const article = document.querySelector(`article[lang='${articleSelect.value}']`);

        article.scrollTo(0, 0);
        article.scrollIntoView();

        selectedClient.play(article);
    }
});
playSelectionButton.addEventListener('click', () => {
    if (selectedClient) {
        selectedClient.playSelection();
    }
});
stopButton.addEventListener('click', () => {
    if (selectedClient) {
        selectedClient.stop();
    }
});
speedRange.addEventListener('change', () => setPreferences());
pitchRange.addEventListener('change', () => setPreferences());
volumeRange.addEventListener('change', () => setPreferences());

function setPreferences(){
    if(selectedClient){
        selectedClient.setPreferences({
            speed: Object.values(speeds)[speedRange.value],
            pitch: Object.values(pitches)[pitchRange.value],
            volume: Object.values(volumes)[volumeRange.value]
        });
    }
}

providerSelect.addEventListener('change', () => {
    const providerId = providerSelect.value;
    if (providerId) {
        let config = {};
        try {
            config = JSON.parse(providerConfigText.value);
        } catch (err) {
            window.console.error(err);
        }

        getReadAloudClient(providerId, config)
            .then(client => {
                client.ignoreElements('.do-not-read');
                selectedClient = client;

                for (let controlElt of document.querySelectorAll('button,select,input')) {
                    controlElt.removeAttribute('disabled');
                }
                for (let providerElt of providersGroup.querySelectorAll('select,textarea')) {
                    providerElt.setAttribute('disabled', 'disabled');
                }
            })
            .catch(err => window.console.error(err));
    }
});
