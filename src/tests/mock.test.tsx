import { act, render } from "@testing-library/react";
import React from "react";
import {
  atom,
  createRecoilMockWrapper,
  RecoilMockContext,
  selector,
  useRecoilValue,
  RecoilRoot,
  atomFamily,
  selectorFamily,
} from "../index";

describe("Basic functionality", () => {
  test("Mock of atom (mocked before rendering)", async () => {
    const { context, wrapper } = createRecoilMockWrapper();
    const fooAtom = atom({ key: "foo", default: "foo" });
    context.set(fooAtom, "hey!");
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
    const { context, wrapper } = createRecoilMockWrapper();
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
      context.set(fooAtom, "hey!");
    });
    await findByText("foo is hey!");
  });

  test("Mock of selector (mocked before rendering)", async () => {
    const { context, wrapper } = createRecoilMockWrapper();
    const fooAtom = atom({ key: "foo3", default: "foo" });
    const doubleSelector = selector({
      key: "double",
      get: ({ get }) => {
        return get(fooAtom) + get(fooAtom);
      },
    });
    context.set(doubleSelector, "hey!");
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
    const { context, wrapper } = createRecoilMockWrapper();
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
      context.set(doubleSelector, "hey!");
    });
    await findByText("doubled is hey!");
  });

  test("Clearing mocks (before rendering)", async () => {
    const { context, wrapper } = createRecoilMockWrapper();
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

    context.set(fooAtom, "hey!");
    context.clear(fooAtom);
    const { findByText } = render(<App />, { wrapper });
    await findByText("doubled is foofoo");
  });

  test("Clearing mocks (after rendering)", async () => {
    const { context, wrapper } = createRecoilMockWrapper();
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

    context.set(fooAtom, "hey!");
    const { findByText } = render(<App />, { wrapper });
    await findByText("doubled is hey!hey!");
    act(() => {
      context.clear(fooAtom);
    });
    await findByText("doubled is foofoo");
  });

  test("clear mock all", async () => {
    const { context, wrapper } = createRecoilMockWrapper();
    const fooAtom = atom({ key: "foo7", default: "foo" });
    const barAtom = atom({ key: "bar7", default: "bar" });
    const App = () => {
      const foo = useRecoilValue(fooAtom);
      const bar = useRecoilValue(barAtom);
      return (
        <div>
          <p>
            foobar is {foo}
            {bar}
          </p>
        </div>
      );
    };

    context.set(fooAtom, "pika");
    context.set(barAtom, "chu");

    const { findByText } = render(<App />, { wrapper });
    await findByText("foobar is pikachu");
    act(() => {
      context.clearAll();
    });
    await findByText("foobar is foobar");
  });
});

describe("Families", () => {
  test("atomFamily", async () => {
    const { context, wrapper } = createRecoilMockWrapper();
    const fooAtomFamily = atomFamily({
      key: "fooFamily",
      default: (id: string) => `foo${id}`,
    });
    const App = () => {
      const foo1 = useRecoilValue(fooAtomFamily("1"));
      const foo2 = useRecoilValue(fooAtomFamily("2"));
      return (
        <div>
          <p>foo-key1 is {foo1}</p>
          <p>foo-key2 is {foo2}</p>
        </div>
      );
    };
    const { findByText } = render(<App />, { wrapper });
    await findByText("foo-key1 is foo1");
    await findByText("foo-key2 is foo2");
    act(() => {
      context.set(fooAtomFamily("1"), "hey!");
    });
    await findByText("foo-key1 is hey!");
    await findByText("foo-key2 is foo2");
    act(() => {
      context.set(fooAtomFamily("2"), "hey!");
    });
    await findByText("foo-key1 is hey!");
    await findByText("foo-key2 is hey!");
  });

  test("selectorFamily", async () => {
    const { context, wrapper } = createRecoilMockWrapper();
    const fooAtom = atom({
      key: "foo8",
      default: 1,
    });
    const multiplySelectorFamily = selectorFamily({
      key: "multiplyFamily",
      get:
        (factor: number) =>
        ({ get }) => {
          return get(fooAtom) * factor;
        },
    });
    const App = () => {
      const doubled = useRecoilValue(multiplySelectorFamily(2));
      const tripled = useRecoilValue(multiplySelectorFamily(3));
      return (
        <div>
          <p>doubled is {doubled}</p>
          <p>tripled is {tripled}</p>
        </div>
      );
    };
    const { findByText } = render(<App />, { wrapper });
    await findByText("doubled is 2");
    await findByText("tripled is 3");
    act(() => {
      context.set(multiplySelectorFamily(2), 3.14);
    });
    await findByText("doubled is 3.14");
    await findByText("tripled is 3");
    act(() => {
      context.set(multiplySelectorFamily(3), 100);
    });
    await findByText("doubled is 3.14");
    await findByText("tripled is 100");
  });
});

test("inner wrapper", async () => {
  const innerWrapper: React.FC<{
    children: React.ReactNode;
  }> = ({ children }) => {
    return (
      <div>
        <p>wrapper!</p>
        {children}
      </div>
    );
  };

  const fooAtom = atom({ key: "inner wrapper/foo", default: "foo" });
  const App = () => {
    const foo = useRecoilValue(fooAtom);
    return <p>foo is {foo}</p>;
  };

  const { context, wrapper } = createRecoilMockWrapper(innerWrapper);
  const { findByText } = render(<App />, { wrapper });
  await findByText("foo is foo");
  await findByText("wrapper!");
  act(() => {
    context.set(fooAtom, "hey!");
  });
  await findByText("foo is hey!");
  await findByText("wrapper!");
});

describe("parallel tests", () => {
  const fooAtom = atom({
    key: "parallel-1",
    default: "foo",
  });
  const App = () => {
    const foo = useRecoilValue(fooAtom);
    return (
      <div>
        <p>foo is {foo}</p>
      </div>
    );
  };

  test("test 1", async () => {
    const { context, wrapper } = createRecoilMockWrapper();
    const { findByText } = render(<App />, { wrapper });
    await findByText("foo is foo");
    act(() => {
      context.set(fooAtom, "hey!");
    });
    await findByText("foo is hey!");
  });
  test("test 2", async () => {
    const { context, wrapper } = createRecoilMockWrapper();
    const { findByText } = render(<App />, { wrapper });
    await findByText("foo is foo");
    act(() => {
      context.set(fooAtom, "pika!");
    });
    await findByText("foo is pika!");
  });
  test("test 3", async () => {
    const { context, wrapper } = createRecoilMockWrapper();
    const { findByText } = render(<App />, { wrapper });
    await findByText("foo is foo");
    act(() => {
      context.set(fooAtom, "bar");
    });
    await findByText("foo is bar");
  });
});

describe("Error Handling", () => {
  it("Using invalid context", () => {
    const { errorBox, ErrorBoundary } = getErrorBoundary();
    const context: RecoilMockContext = {
      set: () => {},
      clear: () => {},
      clearAll: () => {},
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <ErrorBoundary>
          <RecoilRoot mockContext={context}>{children}</RecoilRoot>
        </ErrorBoundary>
      );
    };
    const fooAtom = atom({
      key: "Error Handling/foo1",
      default: "foo",
    });
    const App = () => {
      const foo = useRecoilValue(fooAtom);
      return (
        <div>
          <p>foo is {foo}</p>
        </div>
      );
    };
    render(<App />, { wrapper });
    expect(errorBox.error).toEqual(
      new Error("mock context is not initialized (mockMaps not found)"),
    );
  });
});

function getErrorBoundary() {
  const errorBox: { error: unknown } = { error: undefined };
  class ErrorBoundary extends React.Component<{
    children?: React.ReactNode;
  }> {
    state = { error: null };
    componentDidCatch(error: Error) {
      this.setState({ error });
      errorBox.error = error;
    }
    render() {
      if (this.state.error) {
        return null;
      }
      return this.props.children;
    }
  }
  return {
    errorBox,
    ErrorBoundary,
  };
}
