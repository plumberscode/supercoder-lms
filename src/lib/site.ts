export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://supercoder.id"
).replace(/\/+$/, "");

export const SITE_NAME = "Supercoder";

export const ORG_ID = `${SITE_URL}/#organization`;

export const SITE_LOGO = `${SITE_URL}/images/Logo%20transparent%20orange.webp`;

export const DEFAULT_OG_IMAGE = "/images/hero-image-supercoder.webp";

export const HOME_TITLE =
  "Kursus Coding & AI di Balikpapan untuk SMP, SMA & Umum | Supercoder";

export const HOME_DESCRIPTION =
  "Kursus coding Balikpapan untuk SMP, SMA & umum. Kuasai coding fundamentals dan gunakan AI untuk mengubah ide menjadi website dan aplikasi nyata. Kelas tatap muka & online.";

// Satu sumber data NAP (Name, Address, Phone) — harus identik dengan Google Business Profile.
export const BUSINESS = {
  name: "Supercoder",
  streetAddress: "Kompleks Masjid An-Nasa'i, Jln. Syarifuddin Yoes",
  shortAddress: "Jl. Syarifuddin Yoes (Kompleks Masjid An-Nasa'i)",
  city: "Balikpapan",
  region: "Kalimantan Timur",
  country: "ID",
  phone: "+62816331126",
  phoneDisplay: "0816-331-126",
  whatsappUrl: "https://wa.me/62816331126",
  instagramUrl: "https://www.instagram.com/supercoder_id/",
  mapsUrl: "https://maps.app.goo.gl/8oPmkj8JoWeqFB5V7",
  geo: { lat: -1.2286878, lng: 116.8824992 },
  schedule: [
    { label: "Weekend Class (tatap muka)", value: "Minggu, 09.00 - 10.30 WITA" },
    { label: "Online Class", value: "Jadwal fleksibel" },
  ],
} as const;

export const BUSINESS_MAPS_EMBED_URL = `https://www.google.com/maps?q=${BUSINESS.geo.lat},${BUSINESS.geo.lng}&z=17&output=embed`;
