// recoil-mock's own exports

import React from "react";
import { RecoilValueReadOnly } from "../original-recoil";
import { RecoilRoot } from "./index";
import {
  contextToMockMaps,
  mockSelectorMap,
  RecoilMockContext,
} from "./internals";

export type { RecoilMockContext } from "./internals";

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
