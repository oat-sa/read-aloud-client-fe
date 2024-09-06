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
 * Copyright (c) 2023-2024 (original work) Open Assessment Technologies SA ;
 */
import { normalize, getLanguagePart } from '../../util/locale.js';

// SpeechStream uses person names: each voice is tailored to a particular language (and sometimes region).
// Their support of locale codes is inconsistent (sometimes 'fr', sometimes 'it-it').
// So instead of letting SS auto-choose a voice based on lang, we map to our desired voices here.
//
// Unless indicated by a comment, the voice provider SS uses is 'Nuance' (their default provider, and standard billing).
// Voices from AWS Polly require `speechSettings.enablePollyVoices: true` to be set in the remote config (and are billed separately).
// Voices from Cereproc require `speechSettings.enableCereprocVoices: true` to be set in the remote config (and are billed separately).
export const languageToVoiceByGender = {
    female: {
        'ar': 'Tarik', // not female
        'cy': 'Gwyneth', // AWS Polly voice
        'da': 'Sara',
        'de': 'Anna',
        'en': 'Ava',
        'en-au': 'Karen',
        'en-gb': 'Serena',
        'es': 'Paulina',
        'es-es': 'Monica',
        'fr': 'Audrey',
        'fr-ca': 'Amelie',
        'hu': 'Mariska',
        'it': 'Alice',
        'ja': 'Sakura',
        'lt': 'Egle', // Cereproc voice
        'nl': 'Claire',
        'nl-be': 'Ellen',
        'nb': 'Nora',
        'nn': 'Nora',
        'no': 'Nora',
        'pl': 'Ewa',
        'pt': 'Joana',
        'pt-br': 'Luciana',
        'ro': 'Ioana',
        'ru': 'Milena',
        'sv': 'Alva',
        'uk': 'Lesya',
    },
    male: {
        // Note: langs wth no male voice or no regional variant could be improved by asking to enable the 'Polly' provider
        'ar': 'Tarik',
        'cy': 'Geraint', // AWS Polly voice
        'da': 'Magnus',
        'de': 'Yannick',
        'en': 'Tom',
        'en-au': 'Lee',
        'en-gb': 'Daniel',
        'es': 'Juan',
        'es-es': 'Jorge',
        'fr': 'Thomas',
        'hu': 'Mariska', // not male
        'it': 'Luca',
        'ja': 'Ichiro',
        'lt': 'Egle', // Cereproc voice; not male
        'nl': 'Xander',
        'nb': 'Henrik',
        'nn': 'Henrik',
        'no': 'Henrik',
        'pl': 'Ewa', // not male
        'pt': 'Felipe', // no pt-pt voice exists
        'ro': 'Ioana', // not male
        'ru': 'Yuri',
        'sv': 'Oskar',
        'uk': 'Lesya', // not male
    }
};

/**
 * Look up a voice name from the mapping
 * @param {string} gender
 * @param {string} lang
 * @returns {string} voice name
 */
export function lookupVoice(gender = 'female', lang = 'en') {
    const langVoiceMap = languageToVoiceByGender[gender];

    const lowerLangValue = normalize(lang).toLowerCase();
    const lowerLangPrefix = getLanguagePart(lowerLangValue);

    if (lowerLangValue && lowerLangValue in langVoiceMap) {
        return langVoiceMap[lowerLangValue];
    } else if (lowerLangPrefix && lowerLangPrefix in langVoiceMap) {
        return langVoiceMap[lowerLangPrefix];
    }
    return langVoiceMap['en'];
}
