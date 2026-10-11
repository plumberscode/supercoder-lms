import type { CSSProperties } from "react";

// Urutan kemunculan elemen; dipakai bersama kelas `item` di visual.module.css.
export const order = (i: number) => ({ "--i": i }) as CSSProperties;
