import { act, render } from "@testing-library/react";
import {
  atom,
  clearRecoilMockValues,
  RecoilRoot,
  selector,
  setRecoilMockValue,
  useRecoilState,
  useRecoilValue,
} from "../index";

const wrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <RecoilRoot>{children}</RecoilRoot>;
};

test("Mock of atom (mocked before rendering)", async () => {
  const fooAtom = atom({ key: "foo", default: "foo" });
  setRecoilMockValue(fooAtom, "hey!");
  const App = () => {
    const foo = useRecoilValue(fooAtom);
    return (
      <div>
        <p>foo is {foo}</p>
      </div>
    );
  };
  const { findByText } = render(<App />, { wrapper });
  await findByText("foo is hey!");
});

test("Mock of atom (mocked after rendering)", async () => {
  const fooAtom = atom({ key: "foo2", default: "foo" });
  const App = () => {
    const foo = useRecoilValue(fooAtom);
    return (
      <div>
        <p>foo is {foo}</p>
      </div>
    );
  };
  const { findByText } = render(<App />, { wrapper });
  await findByText("foo is foo");
  act(() => {
    setRecoilMockValue(fooAtom, "hey!");
  });
  await findByText("foo is hey!");
});

test("Mock of selector (mocked before rendering)", async () => {
  const fooAtom = atom({ key: "foo3", default: "foo" });
  const doubleSelector = selector({
    key: "double",
    get: ({ get }) => {
      return get(fooAtom) + get(fooAtom);
    },
  });
  setRecoilMockValue(doubleSelector, "hey!");
  const App = () => {
    const doubled = useRecoilValue(doubleSelector);
    return (
      <div>
        <p>doubled is {doubled}</p>
      </div>
    );
  };
  const { findByText } = render(<App />, { wrapper });
  await findByText("doubled is hey!");
});

test("Mock of selector (mocked after rendering)", async () => {
  const fooAtom = atom({ key: "foo4", default: "foo" });
  const doubleSelector = selector({
    key: "double2",
    get: ({ get }) => {
      return get(fooAtom) + get(fooAtom);
    },
  });
  const App = () => {
    const doubled = useRecoilValue(doubleSelector);
    return (
      <div>
        <p>doubled is {doubled}</p>
      </div>
    );
  };
  const { findByText } = render(<App />, { wrapper });
  await findByText("doubled is foofoo");
  act(() => {
    setRecoilMockValue(doubleSelector, "hey!");
  });
  await findByText("doubled is hey!");
});

test("Clearing mocks (before rendering)", async () => {
  const fooAtom = atom({ key: "foo5", default: "foo" });
  const doubleSelector = selector({
    key: "double3",
    get: ({ get }) => {
      return get(fooAtom) + get(fooAtom);
    },
  });
  const App = () => {
    const doubled = useRecoilValue(doubleSelector);
    return (
      <div>
        <p>doubled is {doubled}</p>
      </div>
    );
  };

  setRecoilMockValue(fooAtom, "hey!");
  clearRecoilMockValues();
  const { findByText } = render(<App />, { wrapper });
  await findByText("doubled is foofoo");
});

test("Clearing mocks (after rendering)", async () => {
  const fooAtom = atom({ key: "foo6", default: "foo" });
  const doubleSelector = selector({
    key: "double4",
    get: ({ get }) => {
      return get(fooAtom) + get(fooAtom);
    },
  });
  const App = () => {
    const doubled = useRecoilValue(doubleSelector);
    return (
      <div>
        <p>doubled is {doubled}</p>
      </div>
    );
  };

  setRecoilMockValue(fooAtom, "hey!");
  const { findByText } = render(<App />, { wrapper });
  await findByText("doubled is hey!hey!");
  act(() => {
    clearRecoilMockValues();
  });
  await findByText("doubled is foofoo");
});
