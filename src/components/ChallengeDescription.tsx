/**
 * Deskripsi soal coding. Soal baru disimpan sebagai HTML (TipTap), soal lama berupa
 * teks polos. HTML di sini diasumsikan SUDAH disanitasi di server
 * (lihat `prepareChallengeDescription` di src/lib/challenge-description.ts).
 */

/** HTML TipTap selalu diawali tag blok; teks polos lama (mis. "<div> adalah…") tidak. */
export function isRichDescription(description: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|pre|blockquote|hr)[\s>/]/i.test(description);
}

export default function ChallengeDescription({
  description,
  className = "",
}: {
  description: string;
  className?: string;
}) {
  if (isRichDescription(description)) {
    return (
      <div
        className={`${className} challenge-rich`}
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  }
  return <div className={className}>{description}</div>;
}
