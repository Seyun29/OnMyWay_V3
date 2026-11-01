import React, {
  useCallback,
  useMemo,
  type DependencyList,
  type PropsWithChildren,
} from 'react';
import {createStore, type StoreApi} from 'zustand/vanilla';
import {useStore} from 'zustand';

type ValueState<T> = {value: T};
type ResettableState = {reset: () => void};
export type RecoilState<T> = ResettableState & {
  initialValue: T;
  store: StoreApi<ValueState<T>>;
};
type ValueOrUpdater<T> = T | ((current: T) => T);

export const atom = <T>({
  default: initialValue,
}: {
  key: string;
  default: T;
}): RecoilState<T> => {
  const store = createStore<ValueState<T>>(() => ({value: initialValue}));
  return {
    initialValue,
    store,
    reset: () => store.setState({value: initialValue}),
  };
};

export const useRecoilValue = <T>(state: RecoilState<T>): T =>
  useStore(state.store, snapshot => snapshot.value);

export const useRecoilState = <T>(state: RecoilState<T>) => {
  const value = useRecoilValue(state);
  const setValue = useCallback(
    (next: ValueOrUpdater<T>) => {
      const current = state.store.getState().value;
      state.store.setState({
        value:
          typeof next === 'function'
            ? (next as (previous: T) => T)(current)
            : next,
      });
    },
    [state],
  );
  return [value, setValue] as const;
};

const reset = (state: ResettableState) => state.reset();

export const useRecoilCallback = <Args extends unknown[], Result>(
  factory: (tools: {reset: typeof reset}) => (...args: Args) => Result,
  dependencies: DependencyList,
) => useMemo(() => factory({reset}), dependencies);

export const RecoilRoot = ({children}: PropsWithChildren) =>
  React.createElement(React.Fragment, null, children);
