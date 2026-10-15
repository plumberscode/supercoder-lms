import Link from "next/link";
import { PROGRAMS, type Program } from "@/lib/student-access";

// Program yang dipilih di ?program=, atau "" (semua) bila kosong/tidak dikenal.
export function parseProgramFilter(
  value: string | undefined,
  allowed: Program[],
): Program | "" {
  return allowed.includes(value as Program) ? (value as Program) : "";
}

// Untuk ditempel di link lain di halaman yang sama agar filter program tidak hilang.
export function programQuery(program: Program | "") {
  return program ? `&program=${program}` : "";
}

// Baris tombol "Semua / Supercoder / MINAS / ..." yang mempertahankan query lain.
export default function ProgramFilter({
  basePath,
  params,
  current,
  allowed,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  current: Program | "";
  allowed: Program[];
}) {
  const options = [{ value: "" as Program | "", label: "Semua Program" }].concat(
    PROGRAMS.filter((p) => allowed.includes(p.value)),
  );

  const hrefFor = (program: Program | "") => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== "program") query.set(key, value);
    });
    if (program) query.set("program", program);
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
      {options.map((o) => (
        <Link
          key={o.value || "all"}
          href={hrefFor(o.value)}
          className={o.value === current ? "btn btn-primary" : "btn"}
          style={{ padding: "6px 14px", fontSize: "0.8rem" }}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
