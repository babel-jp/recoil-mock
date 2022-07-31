// Tests the normal recoil behavior.

import { act, render } from "@testing-library/react";
import {
  atom,
  RecoilRoot,
  selector,
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
