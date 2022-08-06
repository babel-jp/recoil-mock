export * from "../original-recoil";
import React, { useEffect } from "react";
import {
  atom as _atom,
  selector as _selector,
  RecoilRoot as OriginalRecoilRoot,
  useRecoilCallback,
  MutableSnapshot,
  useRecoilValue,
} from "../original-recoil";
import {
  contextToMockMaps,
  mockContextAtom,
  RecoilMockContext,
  wrapWithMockSelector,
} from "./internals";

export type { RecoilMockContext } from "./additions";
export { createRecoilMockContext, createRecoilMockWrapper } from "./additions";

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
