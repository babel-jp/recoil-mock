// Tests the normal recoil behavior.

import { act, render } from "@testing-library/react";
import {
  atom,
  atomFamily,
  RecoilRoot,
  selector,
  selectorFamily,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "../index";

const wrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <RecoilRoot>{children}</RecoilRoot>;
};

test("atom", async () => {
  const fooAtom = atom({ key: "foo", default: "foo" });
  const App = () => {
    const [foo, setFoo] = useRecoilState(fooAtom);
    return (
      <div>
        <p>foo is {foo}</p>
        <button onClick={() => setFoo("bar")}>set foo to bar</button>
      </div>
    );
  };
  const { findByText, findByRole } = render(<App />, { wrapper });
  await findByText("foo is foo");
  const button = await findByRole("button");
  act(() => {
    button.click();
  });
  await findByText("foo is bar");
});

test("selector", async () => {
  const fooAtom = atom({ key: "foo2", default: "foo" });
  const doubleSelector = selector({
    key: "double",
    get: ({ get }) => {
      return get(fooAtom) + get(fooAtom);
    },
  });

  const App = () => {
    const doubled = useRecoilValue(doubleSelector);
    const setFoo = useSetRecoilState(fooAtom);
    return (
      <div>
        <p>doubled is {doubled}</p>
        <button onClick={() => setFoo("bar")}>set foo to bar</button>
      </div>
    );
  };

  const { findByText, findByRole } = render(<App />, { wrapper });
  await findByText("doubled is foofoo");
  const button = await findByRole("button");
  act(() => {
    button.click();
  });
  await findByText("doubled is barbar");
});

test("atomFamily", async () => {
  const fooAtomFamily = atomFamily({
    key: "foo3",
    default: "foo",
  });
  const App = () => {
    const [foo1, setFoo1] = useRecoilState(fooAtomFamily("key1"));
    const [foo2, setFoo2] = useRecoilState(fooAtomFamily("key2"));
    return (
      <div>
        <p>foo-key1 is {foo1}</p>
        <p>foo-key2 is {foo2}</p>
        <button onClick={() => setFoo1("baz")}>set foo-key1 to baz</button>
        <button onClick={() => setFoo2("baz")}>set foo-key2 to baz</button>
      </div>
    );
  };
  const { findByText, findByRole } = render(<App />, { wrapper });
  await findByText("foo-key1 is foo");
  await findByText("foo-key2 is foo");
  const button = await findByText("set foo-key1 to baz");
  act(() => {
    button.click();
  });
  await findByText("foo-key1 is baz");
  await findByText("foo-key2 is foo");
  const button2 = await findByText("set foo-key2 to baz");
  act(() => {
    button2.click();
  });
  await findByText("foo-key1 is baz");
  await findByText("foo-key2 is baz");
})

test("selectorFamily", async () => {
  const fooAtom = atom({
    key: "foo4",
    default: 1,
  });
  const multiplySelectorFamily = selectorFamily({
    key: "multiply",
    get: (factor: number) => ({ get }) => {
      return get(fooAtom) * factor;
    },
  });
  const App = () => {
    const doubled = useRecoilValue(multiplySelectorFamily(2));
    const tripled = useRecoilValue(multiplySelectorFamily(3));
    const setFoo = useSetRecoilState(fooAtom);
    return (
      <div>
        <p>doubled is {doubled}</p>
        <p>tripled is {tripled}</p>
        <button onClick={() => setFoo(10)}>set foo to 10</button>
      </div>
    );
  };
  const { findByText, findByRole } = render(<App />, { wrapper });
  await findByText("doubled is 2");
  await findByText("tripled is 3");
  const button = await findByText("set foo to 10");
  act(() => {
    button.click();
  });
  await findByText("doubled is 20");
  await findByText("tripled is 30");
})