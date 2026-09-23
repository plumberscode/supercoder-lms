export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://supercoder.id"
).replace(/\/+$/, "");

export const SITE_NAME = "Supercoder";

export const ORG_ID = `${SITE_URL}/#organization`;

export const SITE_LOGO = `${SITE_URL}/images/Logo%20transparent%20orange.webp`;

export const DEFAULT_OG_IMAGE = "/images/hero-image-supercoder.webp";
