import { OZZYRM_CSS } from "./styles-css";

const STYLE_ID = "ozzyrm-styles";

/** Inject bundled OzzyRM styles once (Swagger-style; no consumer CSS setup). */
export function ensureOzzyrmStyles(): void {
    if (typeof document === "undefined") {
        return;
    }

    if (document.getElementById(STYLE_ID)) {
        return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = OZZYRM_CSS;
    document.head.appendChild(style);
}
