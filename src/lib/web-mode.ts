// Mode "Soal Coding Web": menentukan editor yang tampil ke siswa dan bagian yang
// dinilai AI. Daftar ini harus sama dengan CHECK constraint di
// migration_web_js_mode.sql.
export const WEB_MODES = ["html", "html-css", "html-css-js", "js"] as const;

export type WebMode = (typeof WEB_MODES)[number];

export const WEB_MODE_LABEL: Record<WebMode, string> = {
  html: "HTML saja",
  "html-css": "HTML + CSS",
  "html-css-js": "HTML + CSS + JavaScript",
  js: "JavaScript saja",
};

export function isWebMode(value: unknown): value is WebMode {
  return WEB_MODES.includes(value as WebMode);
}

export function webModeParts(mode: WebMode) {
  return {
    html: mode !== "js",
    css: mode === "html-css" || mode === "html-css-js",
    js: mode === "html-css-js" || mode === "js",
  };
}
