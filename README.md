# Read Aloud Client

Multi vendor Text-To-Speech client

[![GPLv2 License](https://img.shields.io/badge/License-GPL%20v2-yellow.svg)](./LICENSE) - ![ci](https://github.com/oat-sa/read-alound-client/actions/workflows/continous-integration.yml/badge.svg)

## Installation

You need to have access to the OAT private npm organization.

```bash
npm i  @oat-sa-private/read-aloud-client
```

## Usage

```js
import getReadAloudClient from '@oat-sa-private/read-alound-client';

getReadAloudClient('native', {})
    .then(client => {
        client.ignoreElements('.do-not-read');

        client.playSelection();
    })
    .catch(err => window.console.error(err));
```

### Client API

-   `play(HTMLElement: element)` : Starts reading from the given element.
-   `playSelection()` : Starts reading the selected text.
-   `stop()` : Stop any ongoing plays.
-   `boolean: isReading()` : Returns true if any reading is ongoing.
-   `onReadStart(function: handler)` : calls back the handler when reading starts
-   `onReadEnd(function: handler)` : calls back the handler when reading ends
-   `setPreferences(string: speed, string: pitch, string: volume, string: voice)` : Change the reading preferences. See the [available values for the preferences].(./lib/preferences.js).
-   `ignoreElements(string: selector)` : do not read the elements matching the given DOM selector.

## Supported Providers

### Native

|               |                                                             |
| ------------- | ----------------------------------------------------------- |
| id            | `native`                                                    |
| support level | experimental                                                |
| availability  | native, browser/OS based                                    |
| browsers      | Firefox Desktop and Chrome Desktop & Android (not Chromium) |

### Readweb

|               |                                                                |
| ------------- | -------------------------------------------------------------- |
| id            | `readweb`                                                      |
| support level | testing                                                        |
| availability  | licensed per domain                                            |
| browsers      | all                                                            |
| configuration | - `url`: the service base url<br> - `license`: the license key |
| prerequisite  | configure it through the ReadWeb Control Panel                 |

## Development

Clone the repository and install it:

```bash
git clone https://github.com/oat-sa/read-aloud-client-fe
cd read-aloud-client-fe
npm ci
```

### Sandbox

A sandbox is available to test the client.

First generate some SSL certificates:

```bash
mkcert -install
cd keys
mkcert -cert-file localhost-cert.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1
```

Run the sandbox:

```
npm run dev:sandbox
```

### Tests

## License

Copyright (c) 2021 Open Assessment Technologies SA

Licensed under the terms of the [GNU GPL v2](./LICENSE)
