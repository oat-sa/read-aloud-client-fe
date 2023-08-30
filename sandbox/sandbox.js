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
const pauseButton = controlsGroup.querySelector('[name="pause"]');
const resumeButton = controlsGroup.querySelector('[name="resume"]');
const stopButton = controlsGroup.querySelector('[name="stop"]');
const articleSelect = controlsGroup.querySelector('[name="article-lang"]');
const ctsCheckbox = controlsGroup.querySelector('[name="click-to-speak"]');

//preferences
const preferencesGroup = nav.querySelector('[name="preferences"]');
const speedRange = preferencesGroup.querySelector('[name="speed"]');
const pitchRange = preferencesGroup.querySelector('[name="pitch"]');
const volumeRange = preferencesGroup.querySelector('[name="volume"]');
const genderRadioF = preferencesGroup.querySelector('#gender_f');
const genderRadioM = preferencesGroup.querySelector('#gender_m');

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
pauseButton.addEventListener('click', () => {
    if (selectedClient) {
        selectedClient.pause();
    }
});
resumeButton.addEventListener('click', () => {
    if (selectedClient) {
        selectedClient.resume();
    }
});
stopButton.addEventListener('click', () => {
    if (selectedClient) {
        selectedClient.stop();
    }
});
ctsCheckbox.addEventListener('change', () => {
    if (selectedClient) {
        const result = selectedClient.toggleClickToSpeak();
        ctsCheckbox.checked = !!result;
    }
});
speedRange.addEventListener('change', () => setPreferences());
pitchRange.addEventListener('change', () => setPreferences());
volumeRange.addEventListener('change', () => setPreferences());
genderRadioF.addEventListener('change', () => setPreferences());
genderRadioM.addEventListener('change', () => setPreferences());

function setPreferences() {
    if (selectedClient) {
        selectedClient.setPreferences({
            speed: Object.values(speeds)[speedRange.value],
            pitch: Object.values(pitches)[pitchRange.value],
            volume: Object.values(volumes)[volumeRange.value],
            voice: genderRadioF.checked ? genderRadioF.value : genderRadioM.value
        });
    }
}

providerSelect.addEventListener('change', () => {
    const providerId = providerSelect.value;
    if (providerId) {
        let config;
        try {
            config = JSON.parse(providerConfigText.value || '{}');
        } catch (err) {
            window.console.error(err);
            return;
        }

        getReadAloudClient(providerId, config)
            .then(client => {
                client.ignoreElements('.do-not-read');
                selectedClient = client;

                if (selectedClient.id === 'texthelp') {
                    selectedClient.setPreferences({
                        autoscroll: false
                    });
                }

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
