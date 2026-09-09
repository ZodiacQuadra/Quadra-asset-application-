import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { FluentProvider, teamsLightTheme, Theme } from "@fluentui/react-components";

// Fluent's theme tokens (including font sizes) are plain CSS custom
// properties set on the FluentProvider's own DOM node and inherited by real
// DOM descendants — that inheritance follows the DOM tree, not React's
// component tree. A popup portaled out to `document.body` therefore does
// NOT pick up an ambient theme from wherever it was logically declared in
// JSX; it only sees whatever theme this hook's own FluentProvider below
// sets. Historically that was unconditionally `teamsLightTheme`, so any
// page rendering under a *different* theme (e.g. the Asset module's
// compact-font theme) still got its Dropdown/Tooltip popups rendered at
// the default, non-compact sizes. PopupThemeContext lets a route-level
// layout (see AssetSectionLayout in ResponsiveSidebar.tsx) declare "popups
// under me should use this theme instead" without every one of this hook's
// ~25 call sites needing to know or care — everywhere that doesn't provide
// this context keeps the exact previous behavior (teamsLightTheme).
export const PopupThemeContext = createContext<Theme | null>(null);

let sharedContainer: HTMLDivElement | null = null;

const getSharedContainer = (): HTMLDivElement => {
  if (!sharedContainer) {
    sharedContainer = document.createElement("div");
    sharedContainer.id = "quadra-shared-portal-root";
    sharedContainer.style.background = "transparent";
    document.body.appendChild(sharedContainer);
  }
  return sharedContainer;
};

/**
 * Mount target for Fluent UI Dropdown/Combobox popups rendered inside a Dialog.
 *
 * Dialog surfaces animate with a CSS `transform`, which makes them the containing
 * block for any `position: fixed` descendant — Fluent's popup positioning breaks
 * (renders full-screen) unless the popup escapes to `document.body`. But escaping
 * to a raw DOM node also escapes Fluent's theme (CSS variables only cascade to
 * real DOM descendants of the FluentProvider that sets them) and the Dialog's own
 * z-index stacking (so the popup can render invisibly behind the dialog backdrop).
 *
 * This renders a small themed, high-z-index container as an actual child of
 * `document.body` via its own portal, so a Dropdown's `mountNode` can target a
 * node that is simultaneously: outside the transformed Dialog, correctly themed,
 * and stacked above the Dialog.
 */
export function useThemedMountNode(): { mountNode: HTMLDivElement | null; portal: React.ReactNode } {
  const [innerNode, setInnerNode] = useState<HTMLDivElement | null>(null);
  const ambientTheme = useContext(PopupThemeContext);

  const portal = createPortal(
    <FluentProvider
      theme={ambientTheme ?? teamsLightTheme}
      style={{ position: "static", background: "transparent", backgroundColor: "transparent" }}
    >
      <div ref={setInnerNode} style={{ position: "fixed", top: 0, left: 0, zIndex: 2147483647 }} />
    </FluentProvider>,
    getSharedContainer()
  );

  return { mountNode: innerNode, portal };
}
