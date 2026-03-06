/**
 * Store accessor — breaks the circular dependency:
 *   axiosInstance → store → auth-mgt-slice → auth-mgt (thunks) → axiosInstance
 *
 * axiosInstance imports THIS file (no Redux imports here).
 * store.ts calls injectStore() once after the store is created.
 */

type AnyStore = {
  getState: () => Record<string, unknown>;
  dispatch: (action: unknown) => unknown;
};

let _store: AnyStore | null = null;

export function injectStore(store: AnyStore) {
  _store = store;
}

export function getStoreState(): AnyStore["getState"] extends () => infer S ? S : never {
  if (!_store) throw new Error("Redux store not injected yet.");
  return _store.getState() as ReturnType<AnyStore["getState"]>;
}

export function dispatchToStore(action: unknown) {
  if (!_store) throw new Error("Redux store not injected yet.");
  return _store.dispatch(action);
}
