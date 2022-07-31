import { RecoilValue } from "recoil";
export * from "recoil";

/**
 * 指定したatom / selectorのmock値を設定する
 */
export declare function setRecoilMockValue<T>(
  atomOrSelector: RecoilValue<T>,
  value: T
): void;
/**
 * 全てのmock値をクリアする
 */
export declare function clearRecoilMockValues(): void;
