import { act, render } from "@testing-library/react";
import {
  atom,
  createRecoilMockWrapper,
  selector,
  useRecoilValue,
} from "../index";

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
