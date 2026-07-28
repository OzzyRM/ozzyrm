import { OZZYRM_CSS } from "./styles-css";

const STYLE_ID = "ozzyrm-styles";
/** Set on <html> by local Next playground when Tailwind is compiled live */
const LIVE_ATTR = "data-ozzyrm-tw-live";

/** Inject bundled OzzyRM styles once (Swagger-style; no consumer CSS setup). */
export function ensureOzzyrmStyles(): void {
    if (typeof document === "undefined") {
        return;
    }

    // local test app compiles Tailwind via PostCSS — skip stale inject
    if (document.documentElement.hasAttribute(LIVE_ATTR)) {
        return;
    }

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
    }

    // update on HMR when styles-css.ts changes (full reload not required)
    if (style.textContent !== OZZYRM_CSS) {
        style.textContent = OZZYRM_CSS;
    }
}
