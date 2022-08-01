# recoil-mock

An npm package that helps mocking Recoil states during tests.

Tested with Recoil 0.7.4 and Jest 28.1. It may not work with other testing frameworks. Help us improve it!

## Usage with Jest

### Setting up

First install by:

```sh
npm install -D recoil-mock
```

In your `jest.config.js`, map `recoil` to `recoil-mock`. This makes any Recoil state in your codebase mockable. 

```json
"moduleNameMapper": {
  "^recoil$": "recoil-mock"
}
```

In your setup file (maybe `jest.setup.js`), call `clearRecoilMockValues` so that it clears any mock values that were set in previous tests. Alternatively, you can place below code in each test file that mocks Recoil states.

```js
const { clearRecoilMockValues } = require('recoil-mock');

beforeEach(() => {
  clearRecoilMockValues();
})
```

### Mocking Recoil states

You can mock values of both Recoil atoms and selectors by calling `setRecoilMockValue`.

```js
import { setRecoilMockValue } from 'recoil-mock';

test('mock Recoil atom', () => {
  setRecoilMockValue(myAtom, 'mocked value');
  render(<MyApp />);
  // If you update mocked value after rendering, you should wrap it in an `act` call.
  act(() => {
    setRecoilMockValue(myAtom, 'new mocked value');
  });
  // Your app should have reflected to the update here.
});
```


## For maintainers

### How to publish a new version

Just build and publish locally. :sweat_smile:

## Liecnse

[MIT](./LICENSE)