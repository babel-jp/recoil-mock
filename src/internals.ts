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

export const nonMockedDefaultValue = Symbol("NonMockedDefaultValue");

export const mockSelectorMap = new Map<string, RecoilValueReadOnly<unknown>>();

export const contextToMockMaps = new WeakMap<
  RecoilMockContext,
  {
    mockValueMap: Map<string, unknown>;
    refreshCallbacks: Set<(state: RecoilValueReadOnly<unknown>) => void>;
  }
>();

export const mockContextAtom = _atom<RecoilMockContext | undefined>({
  key: "__recoil-mock__mockContext",
  default: undefined,
});

/**
 * Makes given state mockable.
 */
export function wrapWithMockSelector<T, State extends RecoilValue<T>>(
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
