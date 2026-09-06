export interface BadgeConfig {
  id: string;
  milestoneIndex: number;
  title: string;
  subtitle: string;
  xpRequired: number;
  image: string;
  description: string;
  themeColor: string;
  glowColor: string;
  badgeTag: string;
}

export const XP_BADGES: BadgeConfig[] = [
  {
    id: "badge-100xp",
    milestoneIndex: 1,
    title: "Junior Explorer",
    subtitle: "Lencana 100 XP",
    xpRequired: 100,
    image: "/images/badges/badge-100xp.jpg",
    description: "Lencana kehormatan perdana atas keberhasilan memulai petualangan coding dan menguasai dasar awal!",
    themeColor: "#f97316",
    glowColor: "rgba(249, 115, 22, 0.45)",
    badgeTag: "1 Bintang",
  },
  {
    id: "badge-200xp",
    milestoneIndex: 2,
    title: "Code Builder",
    subtitle: "Lencana 200 XP",
    xpRequired: 200,
    image: "/images/badges/badge-200xp.jpg",
    description: "Membuktikan ketangkasan logika, merakit komponen web, dan menyelesaikan rangkaian tantangan kode!",
    themeColor: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.45)",
    badgeTag: "2 Bintang",
  },
  {
    id: "badge-300xp",
    milestoneIndex: 3,
    title: "Logic Wizard",
    subtitle: "Lencana 300 XP",
    xpRequired: 300,
    image: "/images/badges/badge-300xp.jpg",
    description: "Menguasai kecepatan algoritma dan pemecahan masalah komputasional dengan efisiensi tinggi!",
    themeColor: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.45)",
    badgeTag: "3 Bintang",
  },
  {
    id: "badge-400xp",
    milestoneIndex: 4,
    title: "Grandmaster Coder",
    subtitle: "Lencana 400 XP",
    xpRequired: 400,
    image: "/images/badges/badge-400xp.jpg",
    description: "Puncak prestasi tertinggi Supercoder! Menguasai integrasi coding tingkat lanjut dengan dedikasi luar biasa!",
    themeColor: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.5)",
    badgeTag: "Grandmaster",
  },
];

export interface StudentBadgeStatus extends BadgeConfig {
  unlocked: boolean;
  progressPercent: number;
  xpNeeded: number;
}

/**
 * Menghitung status setiap lencana untuk murid berdasarkan total XP yang dimiliki
 */
export function getStudentBadges(studentXp: number): {
  badges: StudentBadgeStatus[];
  unlockedCount: number;
  totalCount: number;
  nextBadge: StudentBadgeStatus | null;
} {
  const currentXp = Math.max(0, studentXp || 0);

  const badges = XP_BADGES.map((badge) => {
    const unlocked = currentXp >= badge.xpRequired;
    const progressPercent = unlocked
      ? 100
      : Math.min(100, Math.round((currentXp / badge.xpRequired) * 100));
    const xpNeeded = Math.max(0, badge.xpRequired - currentXp);

    return {
      ...badge,
      unlocked,
      progressPercent,
      xpNeeded,
    };
  });

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const nextBadge = badges.find((b) => !b.unlocked) || null;

  return {
    badges,
    unlockedCount,
    totalCount: XP_BADGES.length,
    nextBadge,
  };
}
