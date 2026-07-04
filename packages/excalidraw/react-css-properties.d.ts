// Allow CSS custom properties (e.g. `--swatch-color`) in inline `style` objects.
// https://github.com/frenic/csstype/issues/8 — csstype/React.CSSProperties
// intentionally doesn't type arbitrary `--*` vars, so components pass them via
// a widened style object.
//
// `export {}` makes this file a module, which is required for `declare
// module` to *augment* react's existing types instead of replacing them
// (declaring the same module from a global script file would shadow all of
// @types/react's real declarations instead of merging with them).
export {};

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
