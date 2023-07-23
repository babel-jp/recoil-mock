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

### Mocking Recoil atoms

In each test case, call `createRecoilMockWrapper` to create a pair of a mock context and a wrapper that wraps your component with a customized `RecoilRoot`.

The mock context provides methods `set`, `clear` and `clearAll` to modify mocked value of any Recoil atom or selector.

```js
import { act, render } from "@testing-library/react";
import { createRecoilMockWrapper } from "recoil-mock";

const fooAtom = atom({ key: "foo", default: "foo" });
// App for testing
const MyApp = () => {
  const foo = useRecoilValue(fooAtom);
  return <div>foo is {foo}</div>;
};

test("mock Recoil atom", async () => {
  const { context, wrapper } = createRecoilMockWrapper();
  context.set(fooAtom, "bar");
  const { findByText } = render(<MyApp />, { wrapper });
  // The mocked value is applied
  await findByText("foo is bar");

  // If you update mocked value after rendering, you should wrap it in an `act` call.
  act(() => {
    context.set(fooAtom, "pika!");
  });
  // Your app should have reflected to the update here.
  await findByText("foo is pika!");
});
```

### Mocking Recoil selectors

With `recoil-mock`, you can mock selectors as well. You can apply mocked values directly to any selector without touching its dependencies. When a selector is mocked, its dependencies are not evaluated. 

```js
import { act, render } from "@testing-library/react";
import { createRecoilMockWrapper } from "recoil-mock";

const fooAtom = atom({ key: "foo", default: "foo" });
const barAtom = atom({ key: "bar", default: "bar" });
const fooBarSelector = selector({
  key: "fooBar",
  get: ({ get }) => get(fooAtom) + get(barAtom),
});
// App for testing
const MyApp = () => {
  const fooBar = useRecoilValue(fooBarSelector);
  return <div>fooBar is {fooBar}</div>;
};

test("mock Recoil selector", async () => {
  const { context, wrapper } = createRecoilMockWrapper();
  context.set(fooBarSelector, "pika!");
  const { findByText } = render(<MyApp />, { wrapper });
  // The mocked value is applied
  await findByText("fooBar is pika!");
});
```

### Mocking atom/selector families

When you want to mock an atom family or a selector family, you mock individual atoms/selectors created by the family. 
  
```js
import { act, render } from "@testing-library/react";
import { createRecoilMockWrapper } from "recoil-mock";

const fooAtom = atom({
  key: "foo",
  default: "foo",
});
const repeatedFooFamily = selectorFamily({
  key: "repeatedFooFamily",
  get: (times) => ({ get }) => get(fooAtom).repeat(times),
});
// App for testing
const MyApp = () => {
  const repeatedFoo = useRecoilValue(repeatedFooFamily(3));
  return <div>repeatedFoo is {repeatedFoo}</div>;
};

test("mock Recoil selector family", async () => {
  const { context, wrapper } = createRecoilMockWrapper();
  const { findByText } = render(<MyApp />, { wrapper });
  await findByText("repeatedFoo is foofoofoo");

  act(() => {
    context.set(repeatedFooFamily(3), "pika!");
  });
  // The mocked value is applied
  await findByText("repeatedFoo is pika!");
});
```


## For maintainers

### How to publish a new version

Just build and publish locally. :sweat_smile:

## License

[MIT](./LICENSE)
