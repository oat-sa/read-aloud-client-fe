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
const providerSelect = nav.querySelector('[name="provider"]');
const providerConfigText = nav.querySelector('[name="provider-config"]');

//controls
const playButton = nav.querySelector('[name="play"]');
const playSelectionButton = nav.querySelector('[name="play-selection"]');
const stopButton = nav.querySelector('[name="stop"]');
const articleSelect = nav.querySelector('[name="article-lang"]');

//preferences
const speedRange = nav.querySelector('[name="speed"]');
const pitchRange = nav.querySelector('[name="pitch"]');
const volumeRange = nav.querySelector('[name="volume"]');

let selectedClient;

playButton.addEventListener('click', () => {
    if (selectedClient) {
        const article = document.querySelector(`article[lang='${articleSelect.value}']`);
        article.focus();
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
        selectedClient.setPreferences(
            Object.values(speeds)[speedRange.value],
            Object.values(pitches)[pitchRange.value],
            Object.values(volumes)[volumeRange.value]
        );
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

                selectedClient.onReadStart(() => console.log('read start'));
                selectedClient.onReadEnd(() => console.log('read end'));

                for (let control of nav.querySelectorAll('button,select,input')) {
                    control.removeAttribute('disabled');
                }
            })
            .catch(err => window.console.error(err));
    }
});
