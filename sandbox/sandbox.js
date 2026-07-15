// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2023 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License


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
