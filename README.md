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

### Mocking Recoil states

In each test case, call `createRecoilMockWrapper` to create a pair of a mock context and a wrapper that wraps your component with a customized `RecoilRoot`.

The mock context provides methods `set`, `clear` and `clearAll` to modify mocked value of any Recoil atom or selector.

```js
import { act, render } from "@testing-library/react";
import { createRecoilMockWrapper } from 'recoil-mock';

const fooAtom = atom({ key: 'foo', default: 'foo' })
// App for testing
const MyApp = () => {
  const foo = useRecoilValue(fooAtom);
  return (
    <div>foo is {foo}</div>
  );
};

test('mock Recoil atom', async () => {
  const { context, wrapper } = createRecoilMockWrapper();
  context.set(fooAtom, 'bar');
  const { findByText } = render(<MyApp />, { wrapper });
  // The mocked value is applied
  await findByText('foo is bar');

  // If you update mocked value after rendering, you should wrap it in an `act` call.
  act(() => {
    context.set(fooAtom, 'pika!');
  });
  // Your app should have reflected to the update here.
  await findByText('foo is pika!');
});
```


## For maintainers

### How to publish a new version

Just build and publish locally. :sweat_smile:

## Liecnse

[MIT](./LICENSE)
