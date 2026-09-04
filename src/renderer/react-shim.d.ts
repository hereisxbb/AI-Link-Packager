declare module "react" {
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useState<S = undefined>(): [S | undefined, (value: S | undefined | ((previous: S | undefined) => S | undefined)) => void];
  export function useState<S>(initial: S | (() => S)): [S, (value: S | ((previous: S) => S)) => void];

  const React: {
    StrictMode: unknown;
  };

  export default React;
}

declare module "react-dom/client" {
  export function createRoot(element: HTMLElement): {
    render(children: unknown): void;
  };
}

declare module "react/jsx-runtime" {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}
