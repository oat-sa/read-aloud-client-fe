// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2026 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { normalize, getLanguagePart } from '../../util/locale.js';

/**
 * @typedef {Object} Voice
 * @property {String} name
 * @property {String} vendor
 * @property {String} language
 */

// SpeechStream uses person names: each voice is tailored to a particular language (and sometimes region).
// Their support of locale codes is inconsistent (sometimes 'fr', sometimes 'it-it').
// So instead of letting SS auto-choose a voice based on lang, we map to our desired voices here.
// It's not mandatory to fill every locale, because SS will still provide a reasonable fallback for most missing cases.
//
// Unless indicated by a comment, the voice provider SS uses is 'Nuance' (their default provider, and standard billing).
// Voices from AWS Polly require `speechSettings.enablePollyVoices: true` to be set in the remote config (and are billed separately).
// Voices from Cereproc require `speechSettings.enableCereprocVoices: true` to be set in the remote config (and are billed separately).
//
// prettier-ignore
const defaultVoicesByLangGender = Object.freeze({
    female: {
        'ar': { name: 'Zeina', vendor: 'Polly', language: 'arb' },
        'ca': { name: 'Montserrat', vendor: 'Nuance', language: 'ca-es' },
        'cy': { name: 'Gwyneth', vendor: 'Polly', language: 'cy-GB' },
        'da': { name: 'Sara', vendor: 'Nuance', language: 'da-dk' },
        'de': { name: 'Anna', vendor: 'Nuance', language: 'de-de' },
        'el': { name: 'Melina', vendor: 'Nuance', language: 'el-gr' },
        'en': { name: 'Ava', vendor: 'Nuance', language: 'en-us' },
        'en-au': { name: 'Karen', vendor: 'Nuance', language: 'en-au' },
        'en-gb': { name: 'Serena', vendor: 'Nuance', language: 'en-gb' },
        'es': { name: 'Paulina', vendor: 'Nuance', language: 'es-mx' },
        'es-co': { name: 'Soledad', vendor: 'Nuance', language: 'es-co' },
        'es-es': { name: 'Monica', vendor: 'Nuance', language: 'es-es' },
        'es-es-x-castilla': { name: 'Conchita', vendor: 'Polly', language: 'es-ES' },
        'es-mx': { name: 'Penelope', vendor: 'Polly', language: 'es-US' },
        'es-us': { name: 'Lupe', vendor: 'Polly', language: 'es-US' },
        'fr': { name: 'Audrey', vendor: 'Nuance', language: 'fr' },
        'fr-ca': { name: 'Amelie', vendor: 'Nuance', language: 'fr-ca' },
        'hu': { name: 'Mariska', vendor: 'Nuance', language: 'hu-hu' },
        'is': { name: 'Dora', vendor: 'Polly', language: 'is-IS' },
        'it': { name: 'Alice', vendor: 'Nuance', language: 'it-it' },
        'ja': { name: 'Sakura', vendor: 'Nuance', language: 'ja-jp' },
        'lt': { name: 'Egle', vendor: 'Cereproc', language: 'lt' },
        'nl': { name: 'Claire', vendor: 'Nuance', language: 'nl-nl' },
        'nl-be': { name: 'Ellen', vendor: 'Nuance', language: 'nl-be' },
        'nb': { name: 'Nora', vendor: 'Nuance', language: 'no-no' },
        'nn': { name: 'Nora', vendor: 'Nuance', language: 'no-no' },
        'no': { name: 'Nora', vendor: 'Nuance', language: 'no-no' },
        'pl': { name: 'Ewa', vendor: 'Nuance', language: 'pl-pl' },
        'pt': { name: 'Joana', vendor: 'Nuance', language: 'pt-pt' },
        'pt-br': { name: 'Luciana', vendor: 'Nuance', language: 'pt-br' },
        'ro': { name: 'Ioana', vendor: 'Nuance', language: 'ro-ro' },
        'ru': { name: 'Milena', vendor: 'Nuance', language: 'ru-ru' },
        'sv': { name: 'Alva', vendor: 'Nuance', language: 'sv-se' },
        'tr': { name: 'Yelda', vendor: 'Nuance', language: 'tr-tr' },
        'uk': { name: 'Lesya', vendor: 'Nuance', language: 'uk-ua' },
        'val': { name: 'Montserrat', vendor: 'Nuance', language: 'ca-es' },
        'zh': { name: 'Tian-Tian', vendor: 'Nuance', language: 'zh-cn' },
        'zh-tw': { name: 'Mei-Jia', vendor: 'Nuance', language: 'zh-tw' },
    },
    male: {
        'ar': { name: 'Tarik', vendor: 'Nuance', language: 'ar' },
        'ca': { name: 'Jordi', vendor: 'Nuance', language: 'ca-es' },
        'cy': { name: 'Geraint', vendor: 'Polly', language: 'cy-GB' },
        'da': { name: 'Magnus', vendor: 'Nuance', language: 'da-dk' },
        'de': { name: 'Yannick', vendor: 'Nuance', language: 'de-de' },
        'el': { name: 'Nikos', vendor: 'Nuance', language: 'el-gr' },
        'en': { name: 'Tom', vendor: 'Nuance', language: 'en-us' },
        'en-au': { name: 'Lee', vendor: 'Nuance', language: 'en-au' },
        'en-gb': { name: 'Daniel', vendor: 'Nuance', language: 'en-gb' },
        'es': { name: 'Juan', vendor: 'Nuance', language: 'es-mx' },
        'es-co': { name: 'Carlos', vendor: 'Nuance', language: 'es-co' },
        'es-es': { name: 'Jorge', vendor: 'Nuance', language: 'es-es' },
        'es-es-x-castilla': { name: 'Enrique', vendor: 'Polly', language: 'es-ES' },
        'es-mx': { name: 'Juan', vendor: 'Nuance', language: 'es-mx' },
        'es-us': { name: 'Miguel', vendor: 'Polly', language: 'es-US' },
        'fr': { name: 'Thomas', vendor: 'Nuance', language: 'fr' },
        'hu': { name: 'Mariska', vendor: 'Nuance', language: 'hu-hu' }, // not male
        'is': { name: 'Karl', vendor: 'Polly', language: 'is-IS' },
        'it': { name: 'Luca', vendor: 'Nuance', language: 'it-it' },
        'ja': { name: 'Ichiro', vendor: 'Nuance', language: 'ja-jp' },
        'lt': { name: 'Egle', vendor: 'Cereproc', language: 'lt' },
        'nl': { name: 'Xander', vendor: 'Nuance', language: 'nl-nl' },
        'nb': { name: 'Henrik', vendor: 'Nuance', language: 'no-no' },
        'nn': { name: 'Henrik', vendor: 'Nuance', language: 'no-no' },
        'no': { name: 'Henrik', vendor: 'Nuance', language: 'no-no' },
        'pl': { name: 'Ewa', vendor: 'Nuance', language: 'pl-pl' }, // not male
        'pt': { name: 'Cristiano', vendor: 'Polly', language: 'pt-PT' },
        'pt-br': { name: 'Felipe', vendor: 'Nuance', language: 'pt-br' },
        'ro': { name: 'Ioana', vendor: 'Nuance', language: 'ro-ro' }, // not male
        'ru': { name: 'Yuri', vendor: 'Nuance', language: 'ru-ru' },
        'sv': { name: 'Oskar', vendor: 'Nuance', language: 'sv-se' },
        'tr': { name: 'Cem', vendor: 'Nuance', language: 'tr-tr' },
        'uk': { name: 'Lesya', vendor: 'Nuance', language: 'uk-ua' }, // not male
        'val': { name: 'Jordi', vendor: 'Nuance', language: 'ca-es' },
        'zh': { name: 'Tian-Tian', vendor: 'Nuance', language: 'zh-cn' }, // not male
        'zh-tw': { name: 'Mei-Jia', vendor: 'Nuance', language: 'zh-tw' }, // not male
    }
});

// This one stores all the usable alternative voice names per gender and language prefix
// In each set, Nuance is listed before Polly, because Polly is not guaranteed to be enabled.
// Data was extracted from remote speechstream javascript file
//
// prettier-ignore
const altVoicesByLangGender = Object.freeze({
    female: {
        // First array element must be the default voice we defined in our other mapping
        da: [
            { name: 'Sara', vendor: 'Nuance', language: 'da-dk' },
            { name: 'Naja', vendor: 'Polly', language: 'da-DK' }
        ],
        de: [
            { name: 'Anna', vendor: 'Nuance', language: 'de-de' },
            { name: 'Petra', vendor: 'Nuance', language: 'de-de' },
            { name: 'Marlene', vendor: 'Polly', language: 'de-DE' }
        ],
        en: [
            { name: 'Ava', vendor: 'Nuance', language: 'en-us' },
            { name: 'Karen', vendor: 'Nuance', language: 'en-au' },
            { name: 'Serena', vendor: 'Nuance', language: 'en-gb' },
            { name: 'Amy', vendor: 'Polly', language: 'en-GB' },
            { name: 'Nicole', vendor: 'Polly', language: 'en-AU' },
            { name: 'Kendra', vendor: 'Polly', language: 'en-US' },
            { name: 'Aditi', vendor: 'Polly', language: 'en-IN' }
        ],
        es: [
            { name: 'Paulina', vendor: 'Nuance', language: 'es-mx' },
            { name: 'Soledad', vendor: 'Nuance', language: 'es-co' },
            { name: 'Monica', vendor: 'Nuance', language: 'es-es' },
            { name: 'Conchita', vendor: 'Polly', language: 'es-ES' },
            { name: 'Penelope', vendor: 'Polly', language: 'es-US' },
            { name: 'Lupe', vendor: 'Polly', language: 'es-US' }
        ],
        fr: [
            { name: 'Audrey', vendor: 'Nuance', language: 'fr' },
            { name: 'Amelie', vendor: 'Nuance', language: 'fr-ca' },
            { name: 'Chantal', vendor: 'Polly', language: 'fr-CA' },
            { name: 'Celine', vendor: 'Polly', language: 'fr-FR' },
            { name: 'Lea', vendor: 'Polly', language: 'fr-FR' },
            { name: 'Gabrielle', vendor: 'Polly', language: 'fr-ca' }
        ],
        it: [
            { name: 'Alice', vendor: 'Nuance', language: 'it-it' },
            { name: 'Federica', vendor: 'Nuance', language: 'it-it' },
            { name: 'Paola', vendor: 'Nuance', language: 'it-it' },
            { name: 'Bianca', vendor: 'Polly', language: 'it-IT' },
            { name: 'Carla', vendor: 'Polly', language: 'it-IT' }
        ],
        ja: [
            { name: 'Sakura', vendor: 'Nuance', language: 'ja-jp' },
            { name: 'Mizuki', vendor: 'Polly', language: 'ja-JP' }
        ],
        nb: [
            { name: 'Liv', vendor: 'Polly', language: 'nb-NO' },
            { name: 'Inger_nb', vendor: 'Webappella', language: 'nb-no' } // Inferior
        ],
        nl: [
            { name: 'Claire', vendor: 'Nuance', language: 'nl-nl' },
            { name: 'Ellen', vendor: 'Nuance', language: 'nl-be' },
            { name: 'Lotte', vendor: 'Polly', language: 'nl-NL' }
        ],
        nn: [
            { name: 'Nora', vendor: 'Nuance', language: 'no-no' }, // will only play if element lang="nn"
            { name: 'Inger_nn', vendor: 'Webappella', language: 'nn-no' } // Inferior
        ],
        no: [
            { name: 'Nora', vendor: 'Nuance', language: 'no-no' }
        ],
        pl: [
            { name: 'Ewa', vendor: 'Nuance', language: 'pl-pl' },
            { name: 'Zosia', vendor: 'Nuance', language: 'pl-pl' },
            { name: 'Maja', vendor: 'Polly', language: 'pl-PL' }
        ],
        pt: [
            { name: 'Joana', vendor: 'Nuance', language: 'pt-pt' },
            { name: 'Catarina', vendor: 'Nuance', language: 'pt-pt' },
            { name: 'Luciana', vendor: 'Nuance', language: 'pt-br' },
            { name: 'Vitoria', vendor: 'Polly', language: 'pt-BR' },
            { name: 'Camila', vendor: 'Polly', language: 'pt-BR' }
        ],
        ro: [
            { name: 'Ioana', vendor: 'Nuance', language: 'ro-ro' },
            { name: 'Carmen', vendor: 'Polly', language: 'ro-RO' }
        ],
        sv: [
            { name: 'Alva', vendor: 'Nuance', language: 'sv-se' },
            { name: 'Astrid', vendor: 'Polly', language: 'sv-SE' }
        ]
    },
    male: {
        da: [
            { name: 'Magnus', vendor: 'Nuance', language: 'da-dk' },
            { name: 'Mads', vendor: 'Polly', language: 'da-DK' }
        ],
        de: [
            { name: 'Yannick', vendor: 'Nuance', language: 'de-de' },
            { name: 'Hans', vendor: 'Polly', language: 'de-DE' }
        ],
        en: [
            { name: 'Tom', vendor: 'Nuance', language: 'en-us' },
            { name: 'Lee', vendor: 'Nuance', language: 'en-au' },
            { name: 'Brian', vendor: 'Polly', language: 'en-GB' },
            { name: 'Russell', vendor: 'Polly', language: 'en-AU' },
            { name: 'Matthew', vendor: 'Polly', language: 'en-US' }
        ],
        es: [
            { name: 'Juan', vendor: 'Nuance', language: 'es-mx' },
            { name: 'Carlos', vendor: 'Nuance', language: 'es-co' },
            { name: 'Jorge', vendor: 'Nuance', language: 'es-es' },
            { name: 'Enrique', vendor: 'Polly', language: 'es-ES' },
            { name: 'Miguel', vendor: 'Polly', language: 'es-US' }
        ],
        fr: [
            { name: 'Thomas', vendor: 'Nuance', language: 'fr' },
            { name: 'Mathieu', vendor: 'Polly', language: 'fr-FR' }
        ],
        it: [
            { name: 'Luca', vendor: 'Nuance', language: 'it-it' },
            { name: 'Giorgio', vendor: 'Polly', language: 'it-IT' }
        ],
        ja: [
            { name: 'Ichiro', vendor: 'Nuance', language: 'ja-jp' },
            { name: 'Takumi', vendor: 'Polly', language: 'ja-JP' }
        ],
        nb: [
            { name: 'Isak_nb', vendor: 'Webappella', language: 'nb-no' } // Inferior
        ],
        nl: [
            { name: 'Xander', vendor: 'Nuance', language: 'nl-nl' },
            { name: 'Ruben', vendor: 'Polly', language: 'nl-NL' }
        ],
        nn: [
            { name: 'Henrik', vendor: 'Nuance', language: 'no-no' }, // will only play if lang="nn"
            { name: 'Isak_nn', vendor: 'Webappella', language: 'nn-no' } // Inferior
        ],
        no: [
            { name: 'Henrik', vendor: 'Nuance', language: 'no-no' }
        ],
        pl: [
            { name: 'Jacek', vendor: 'Polly', language: 'pl-PL' },
            { name: 'Jan', vendor: 'Polly', language: 'pl-PL' }
        ],
        pt: [
            { name: 'Felipe', vendor: 'Nuance', language: 'pt-br' },
            { name: 'Cristiano', vendor: 'Polly', language: 'pt-PT' },
            { name: 'Ricardo', vendor: 'Polly', language: 'pt-BR' }
        ]
    }
});

/**
 * Module-scoped in-memory storage for overrides set through provider API
 */
const overridenVoicesByLangGender = { female: {}, male: {} };

/**
 * Get a copy of the overridden voices
 * @returns {Object}
 */
export function getOverridenVoices() {
    // Because it's not a hot code path and structuredClone isn't available in jsdom
    return JSON.parse(JSON.stringify(overridenVoicesByLangGender));
}

/**
 * Set a voice override for a gender and locale
 * The provided voiceName must be one of the voices listed in the altVoices
 * @param {String} gender
 * @param {String} locale
 * @param {String} voiceName
 * @returns {Boolean} true if successful
 */
export function updateOverridenVoices(gender, locale, voiceName) {
    if (!gender || !locale || !voiceName) {
        return false;
    }

    const foundVoice = altVoicesByLangGender[gender][locale]?.find(voice => voice.name === voiceName);
    if (foundVoice) {
        overridenVoicesByLangGender[gender][locale] = foundVoice;
        return true;
    }
    return false;
}

/**
 * Reset some or all overrides
 * @param {String} gender
 * @param {String} locale
 */
export function resetOverridenVoices(gender, locale) {
    if (gender && locale && locale in overridenVoicesByLangGender[gender]) {
        delete overridenVoicesByLangGender[gender][locale];
        return;
    }
    // without any missing parameter, full reset
    overridenVoicesByLangGender.female = {};
    overridenVoicesByLangGender.male = {};
}

/**
 * Look up a default voice name from the mapping
 * We have this because it gives more control over genders and fallback lookups, than SpeechStream's setLanguageVoiceMapping()
 * @param {string} gender
 * @param {string} lang
 * @returns {Voice} voice object
 */
export function lookupVoice(gender = 'female', lang = 'en') {
    const lowerLangValue = normalize(lang)?.toLowerCase() || '';
    const lowerLangPrefix = getLanguagePart(lowerLangValue);

    const langVoiceMapOverrides = overridenVoicesByLangGender[gender];
    const langVoiceMap = defaultVoicesByLangGender[gender];

    // first, overrides
    if (lowerLangPrefix && lowerLangPrefix in langVoiceMapOverrides) {
        return langVoiceMapOverrides[lowerLangPrefix];
    }
    // second, defaults
    if (lowerLangValue && lowerLangValue in langVoiceMap) {
        return langVoiceMap[lowerLangValue];
    } else if (lowerLangPrefix && lowerLangPrefix in langVoiceMap) {
        return langVoiceMap[lowerLangPrefix];
    }

    return langVoiceMap['en'];
}

/**
 * Look up the alternative voices from the mapping
 * @param {string} gender
 * @param {string} lang
 * @returns {Voice[]} voice objects
 */
export function lookupAltVoices(gender = 'female', lang = 'en') {
    const langVoiceMapByGender = altVoicesByLangGender;

    const langVoiceMap = langVoiceMapByGender[gender];

    const lowerLangValue = normalize(lang)?.toLowerCase() || '';
    const lowerLangPrefix = getLanguagePart(lowerLangValue);

    // only lang prefixes are supported for alt voices
    if (lowerLangPrefix && lowerLangPrefix in langVoiceMap) {
        return langVoiceMap[lowerLangPrefix];
    }
    return [];
}