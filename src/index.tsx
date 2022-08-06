export * from "../original-recoil";
import React, { useEffect } from "react";
import {
  atom as _atom,
  selector as _selector,
  RecoilValue,
  RecoilRoot as OriginalRecoilRoot,
  useRecoilCallback,
  RecoilValueReadOnly,
  MutableSnapshot,
  useRecoilValue,
} from "../original-recoil";

const nonMockedDefaultValue = Symbol("NonMockedDefaultValue");

const mockSelectorMap = new Map<string, RecoilValueReadOnly<unknown>>();

const contextToMockMaps = new WeakMap<
  RecoilMockContext,
  {
    mockValueMap: Map<string, unknown>;
    refreshCallbacks: Set<(state: RecoilValueReadOnly<unknown>) => void>;
  }
>();

const mockContextAtom = _atom<RecoilMockContext | undefined>({
  key: "__recoil-mock__mockContext",
  default: undefined,
});

/**
 * 与えられたstateをモック可能にする
 */
function wrapWithMockSelector<T, State extends RecoilValue<T>>(
  state: State,
  options: {
    dangerouslyAllowMutability?: boolean;
  }
): State {
  const resultKey = state.key + "___mock_selector";
  const mockSelector = _selector<T | typeof nonMockedDefaultValue>({
    key: state.key + "___mock_value",
    get({ get }) {
      const mockContext = get(mockContextAtom);
      if (mockContext === undefined) {
        // not mocked
        return nonMockedDefaultValue;
      }
      const mockMaps = contextToMockMaps.get(mockContext);
      if (mockMaps === undefined) {
        throw new Error("mock context is not initialized (mockMaps not found)");
      }
      if (mockMaps.mockValueMap.has(resultKey)) {
        return mockMaps.mockValueMap.get(resultKey) as T;
      }
      return nonMockedDefaultValue;
    },
    dangerouslyAllowMutability: !!options.dangerouslyAllowMutability,
  });

  mockSelectorMap.set(resultKey, mockSelector);

  return _selector<T>({
    key: resultKey,
    get: ({ get }) => {
      const mockedValue = get(mockSelector);
      if (mockedValue !== nonMockedDefaultValue) {
        return mockedValue;
      }
      return get(state);
    },
    set: ({ set }, value) => {
      // `state` cannot be set if it is read-only, but that case is prevented by types
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      set(state, value);
    },
    dangerouslyAllowMutability: !!options.dangerouslyAllowMutability,
  }) as State;
}

export type RecoilMockContext = {
  /**
   * Mocks given atom/selector with given value.
   */
  set<T>(atomOrSelector: RecoilValue<T>, value: T): void;
  /**
   * Clears mock value of given atom/selector.
   */
  clear(atomOrSelector: RecoilValue<unknown>): void;
  /**
   * Clears all mock values.
   */
  clearAll(): void;
};

// ----- re-exporting recoil exports -----

export const atom: typeof _atom = (options) => {
  return wrapWithMockSelector(_atom(options), options);
};
atom.value = _atom.value;

// @ts-expect-error
export const selector: typeof _selector = (options) => {
  return wrapWithMockSelector(_selector(options), options);
};
selector.value = _selector.value;

type RecoilRootProps = React.ComponentProps<typeof OriginalRecoilRoot> & {
  mockContext?: RecoilMockContext;
};

export const RecoilRoot: React.FC<RecoilRootProps> = ({
  children,
  mockContext,
  ...props
}) => {
  if (props.override === false) {
    return <OriginalRecoilRoot {...props}>{children}</OriginalRecoilRoot>;
  }
  const initializeState = (snapshot: MutableSnapshot) => {
    props.initializeState?.(snapshot);
    snapshot.set(mockContextAtom, mockContext);
  };
  return (
    <OriginalRecoilRoot {...props} initializeState={initializeState}>
      <RecoilRootInternal />
      {children}
    </OriginalRecoilRoot>
  );
};

/**
 * RecoilRootがレンダリングされている間、refresh関数をrefreshCallbacksに登録するためのコンポーネント
 */
const RecoilRootInternal: React.FC = () => {
  const mockContext = useRecoilValue(mockContextAtom);
  const refresh = useRecoilCallback(({ refresh }) => refresh, []);

  useEffect(() => {
    if (mockContext === undefined) {
      return;
    }
    const mockMaps = contextToMockMaps.get(mockContext);
    if (mockMaps === undefined) {
      throw new Error("mock context is not initialized (mockMaps not found)");
    }

    mockMaps.refreshCallbacks.add(refresh);
    return () => {
      mockMaps.refreshCallbacks.delete(refresh);
    };
  }, [mockContext, refresh]);
  return null;
};

// ----- recoil-mock's own exports -----

/**
 * Creates a RecoilMockContext.
 */
export function createRecoilMockContext(): RecoilMockContext {
  const mockValueMap = new Map<string, unknown>();
  const refreshCallbacks = new Set<
    (state: RecoilValueReadOnly<unknown>) => void
  >();

  function refresh(selector: RecoilValueReadOnly<unknown>) {
    for (const callback of refreshCallbacks) {
      callback(selector);
    }
  }

  const context: RecoilMockContext = {
    set(atomOrSelector, value) {
      mockValueMap.set(atomOrSelector.key, value);
      const mockSelector = mockSelectorMap.get(atomOrSelector.key);
      /* istanbul ignore if */
      if (!mockSelector) {
        throw new Error("No mockSelector registered");
      }
      refresh(mockSelector);
    },
    clear(atomOrSelector) {
      mockValueMap.delete(atomOrSelector.key);
      const mockSelector = mockSelectorMap.get(atomOrSelector.key);
      /* istanbul ignore if */
      if (!mockSelector) {
        throw new Error("No mockSelector registered");
      }
      refresh(mockSelector);
    },
    clearAll() {
      mockValueMap.clear();
      for (const mockSelector of mockSelectorMap.values()) {
        refresh(mockSelector);
      }
    },
  };

  contextToMockMaps.set(context, {
    mockValueMap,
    refreshCallbacks,
  });

  return context;
}

/**
 * Creates a pair of mock context and wrapper that wraps given React Node with a RecoilRoot with the mock context.
 *
 * @param innerWrapper Additional wrapper to wrap the given React Node with.
 */
export function createRecoilMockWrapper(
  innerWrapper?: React.JSXElementConstructor<{ children: React.ReactElement }>
): {
  context: RecoilMockContext;
  wrapper: React.FC<{ children?: React.ReactNode }>;
} {
  const context = createRecoilMockContext();
  const W = innerWrapper ?? React.Fragment;
  return {
    context,
    wrapper: ({ children }) => (
      <RecoilRoot mockContext={context}>
        <W>
          <>{children}</>
        </W>
      </RecoilRoot>
    ),
  };
}
