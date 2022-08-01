export * from "./original-recoil";
import { useEffect } from "react";
import {
  atom as _atom,
  selector as _selector,
  RecoilValue,
  RecoilRoot as OriginalRecoilRoot,
  useRecoilCallback,
  RecoilValueReadOnly,
} from "./original-recoil";

// テスト用にモック機能を追加したrecoilパッケージ

/**
 * モックされた値を管理するマップ。keyはatom / selectorのkey, valueはモックされた値（無ければモックされていない）
 */
const mockValueMap = new Map<string, unknown>();
const mockSelectorMap = new Map<string, RecoilValueReadOnly<unknown>>();
const refreshCallbacks = new Set<
  (state: RecoilValueReadOnly<unknown>) => void
>();

const nonMockedDefaultValue = Symbol("NonMockedDefaultValue");

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
    get() {
      if (mockValueMap.has(resultKey)) {
        return mockValueMap.get(resultKey) as T;
      }
      return nonMockedDefaultValue;
    },
    dangerouslyAllowMutability: !!options.dangerouslyAllowMutability,
  });

  mockSelectorMap.set(resultKey, mockSelector);

  // mockAtomの値が設定されていたらそちらを常に返す
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
      // `state` がreadonlyだった場合はsetできないが、その場合は型で制御されて防がれているので大丈夫
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      set(state, value);
    },
    dangerouslyAllowMutability: !!options.dangerouslyAllowMutability,
  }) as State;
}

// ----- recoilのエクスポートを上書き -----

export const atom: typeof _atom = (options) => {
  return wrapWithMockSelector(_atom(options), options);
};
atom.value = _atom.value;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export const selector: typeof _selector = (options) => {
  return wrapWithMockSelector(_selector(options), options);
};
selector.value = _selector.value;

export const RecoilRoot: typeof OriginalRecoilRoot = ({
  children,
  ...props
}) => {
  return (
    <OriginalRecoilRoot {...props}>
      <RecoilRootInternal />
      {children}
    </OriginalRecoilRoot>
  );
};

/**
 * RecoilRootがレンダリングされている間、refresh関数をrefreshCallbacksに登録するためのコンポーネント
 */
const RecoilRootInternal: React.FC = () => {
  const refresh = useRecoilCallback(({ refresh }) => refresh, []);

  useEffect(() => {
    refreshCallbacks.add(refresh);
    return () => {
      refreshCallbacks.delete(refresh);
    };
  }, [refresh]);
  return null;
};

// ----- recoil-mock独自のエクスポート -----

/**
 * 指定したatom / selectorのmock値を設定する
 */
export function setRecoilMockValue<T>(
  atomOrSelector: RecoilValue<T>,
  value: T
) {
  mockValueMap.set(atomOrSelector.key, value);
  const mockSelector = mockSelectorMap.get(atomOrSelector.key);
  /* istanbul ignore if */
  if (!mockSelector) {
    throw new Error("No mockSelector registered");
  }

  for (const refresh of refreshCallbacks) {
    refresh(mockSelector);
  }
}

/**
 * 全てのmock値をクリアする
 */
export function clearRecoilMockValues() {
  mockValueMap.clear();
  for (const refresh of refreshCallbacks) {
    for (const selector of mockSelectorMap.values()) {
      refresh(selector);
    }
  }
}
