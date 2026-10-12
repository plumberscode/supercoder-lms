import Link from "next/link";
import { Outfit } from "next/font/google";
import { createClient } from "@/utils/supabase/server";
import { deleteRegistration } from "./actions";
import StatusSelect from "./StatusSelect";
import {
  Inbox,
  GraduationCap,
  MessageCircle,
  Phone,
  Ticket,
  CreditCard,
  Clock,
  Trash2,
  Users,
} from "lucide-react";
import { PROMO_VOUCHER_CODE } from "@/lib/promo";
import { buildWaLink } from "@/lib/whatsapp";
import { formatRupiah } from "@/lib/pricing";
import styles from "./registrations.module.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

const STATUSES = [
  { key: "pending", label: "Menunggu", pill: styles.pillPending },
  { key: "contacted", label: "Dihubungi", pill: styles.pillContacted },
  { key: "enrolled", label: "Terdaftar", pill: styles.pillEnrolled },
  { key: "cancelled", label: "Batal", pill: styles.pillCancelled },
] as const;

type StatusKey = (typeof STATUSES)[number]["key"];

function formatDate(iso: string | null, withTime = true) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : { year: "numeric" }),
    timeZone: "Asia/Makassar",
  });
}

function initials(name: string | null) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

function avatarClass(selectedClass: string | null) {
  if (selectedClass === "Weekend Coding Class") return styles.avatarWeekend;
  if (selectedClass === "Premium Online Class") return styles.avatarPremium;
  return styles.avatarOther;
}

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className={`${styles.page} ${outfit.className}`}>
        <h1 className={styles.title}>Data Pendaftaran Siswa Baru</h1>
        <div className={styles.error}>
          Gagal memuat data pendaftaran: {error.message}
          <br />
          <small>
            Pastikan tabel <code>registrations</code> telah dibuat di Supabase
            (jalankan <code>migration_registrations.sql</code>).
          </small>
        </div>
      </div>
    );
  }

  const all = (registrations || []).map((r) => ({
    ...r,
    status: (r.status || "pending") as StatusKey,
  }));
  const total = all.length;
  const counts = Object.fromEntries(
    STATUSES.map((s) => [s.key, all.filter((r) => r.status === s.key).length]),
  ) as Record<StatusKey, number>;
  const paidCount = all.filter((r) => r.payment_status === "paid").length;

  const activeFilter = STATUSES.some((s) => s.key === params.status)
    ? (params.status as StatusKey)
    : null;
  const visible = activeFilter ? all.filter((r) => r.status === activeFilter) : all;

  // Antrean follow-up: yang paling lama menunggu di atas.
  const queue = all
    .filter((r) => r.status === "pending")
    .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));

  const byClass = Object.entries(
    all.reduce<Record<string, number>>((acc, r) => {
      const key = r.selected_class || "Lainnya";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxClass = byClass[0]?.[1] || 0;

  const waUrl = (item: (typeof all)[number]) =>
    buildWaLink(
      item.whatsapp_number,
      `Halo ${item.student_name}, perkenalkan kami dari Supercoder. Terima kasih telah mendaftar untuk program ${item.selected_class}. Kami ingin memberikan informasi jadwal dan detail kelas.`,
    );

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className={`${styles.page} ${outfit.className}`}>
      {/* Header + KPI */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Data Pendaftaran Siswa Baru</h1>
          <p className={styles.subtitle}>
            Calon siswa yang mengisi formulir pendaftaran di website.
          </p>
        </div>
        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <span className={styles.kpiIcon}>
              <Users size={14} />
            </span>
            <span className={styles.kpiValue}>{total}</span>
            <span className={styles.kpiLabel}>Total Pendaftar</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiIcon}>
              <GraduationCap size={14} />
            </span>
            <span className={styles.kpiValue}>{counts.enrolled}</span>
            <span className={styles.kpiLabel}>Resmi Terdaftar</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiIcon}>
              <CreditCard size={14} />
            </span>
            <span className={styles.kpiValue}>{paidCount}</span>
            <span className={styles.kpiLabel}>Sudah Bayar</span>
          </div>
        </div>
      </header>

      {/* Pipeline status */}
      {total > 0 && (
        <div className={styles.pipeline} aria-label="Sebaran status follow-up">
          {STATUSES.map((s) => (
            <div
              key={s.key}
              className={styles.segment}
              style={{ flexGrow: Math.max(counts[s.key], total * 0.08) }}
            >
              <span className={styles.segmentLabel}>
                {s.label} <b>{counts[s.key]}</b>
              </span>
              <div className={`${styles.pill} ${s.pill}`}>{pct(counts[s.key])}%</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.main}>
        {/* Daftar pendaftar */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Pendaftar</h2>
            <nav className={styles.tabs} aria-label="Filter status">
              <Link
                href="/admin/registrations"
                className={`${styles.tab} ${!activeFilter ? styles.tabActive : ""}`}
                aria-current={!activeFilter ? "page" : undefined}
              >
                Semua <span className={styles.tabCount}>{total}</span>
              </Link>
              {STATUSES.map((s) => (
                <Link
                  key={s.key}
                  href={`/admin/registrations?status=${s.key}`}
                  className={`${styles.tab} ${activeFilter === s.key ? styles.tabActive : ""}`}
                  aria-current={activeFilter === s.key ? "page" : undefined}
                >
                  {s.label} <span className={styles.tabCount}>{counts[s.key]}</span>
                </Link>
              ))}
            </nav>
          </div>

          {visible.length === 0 ? (
            <div className={styles.empty}>
              <Inbox size={32} strokeWidth={1.5} />
              <div className={styles.emptyTitle}>
                {total === 0 ? "Belum Ada Pendaftar" : "Tidak ada pendaftar dengan status ini"}
              </div>
              {total === 0 && (
                <p>
                  Ketika calon siswa mengisi formulir di website Supercoder (/daftar),
                  datanya akan muncul di sini secara otomatis.
                </p>
              )}
            </div>
          ) : (
            <ul className={styles.rows}>
              {visible.map((item) => {
                const usedVoucher =
                  item.voucher_code?.toString().trim().toUpperCase() === PROMO_VOUCHER_CODE;
                return (
                  <li key={item.id} className={styles.row}>
                    <div className={`${styles.avatar} ${avatarClass(item.selected_class)}`}>
                      {initials(item.student_name)}
                    </div>

                    <div className={styles.who}>
                      <div className={styles.name}>{item.student_name}</div>
                      <div className={styles.chips}>
                        <span className={styles.chip}>{item.selected_class}</span>
                        {usedVoucher && (
                          <span
                            className={`${styles.chip} ${styles.chipVoucher}`}
                            title={`Kode voucher: ${item.voucher_code}`}
                          >
                            <Ticket size={10} /> Promo 9.9
                          </span>
                        )}
                        {item.payment_status === "paid" && (
                          <span
                            className={`${styles.chip} ${styles.chipPaid}`}
                            title={item.paid_at ? `Dibayar ${formatDate(item.paid_at)}` : undefined}
                          >
                            <CreditCard size={10} /> Lunas
                            {item.payment_amount ? ` ${formatRupiah(item.payment_amount)}` : ""}
                          </span>
                        )}
                        {item.payment_status === "unpaid" && (
                          <a
                            className={`${styles.chip} ${styles.chipUnpaid}`}
                            href={item.mayar_payment_link || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={
                              item.mayar_payment_link
                                ? "Buka link pembayaran Mayar (bisa dikirim ulang ke siswa)"
                                : "Link Mayar gagal dibuat — kirim tagihan manual"
                            }
                          >
                            <Clock size={10} /> Belum bayar
                          </a>
                        )}
                      </div>
                    </div>

                    <div className={styles.contact}>
                      <a href={waUrl(item)} target="_blank" rel="noopener noreferrer">
                        {item.whatsapp_number}
                      </a>
                      <span>{item.email}</span>
                      <span className={styles.address} title={item.address}>
                        {item.address}
                      </span>
                    </div>

                    <div className={styles.when}>{formatDate(item.created_at)}</div>

                    <div className={styles.status}>
                      <StatusSelect
                        id={item.id}
                        status={item.status}
                        label={`Status follow-up ${item.student_name}`}
                      />
                    </div>

                    <div className={styles.actions}>
                      <a
                        href={waUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.iconBtn} ${styles.iconBtnDark}`}
                        aria-label={`Chat WhatsApp ${item.student_name}`}
                        title="Chat WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>
                      <form action={deleteRegistration.bind(null, item.id)}>
                        <button
                          type="submit"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          aria-label={`Hapus pendaftaran ${item.student_name}`}
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Sidebar */}
        <aside className={styles.aside}>
          <section className={styles.dark}>
            <div className={styles.darkHead}>
              <h2 className={styles.darkTitle}>Perlu Dihubungi</h2>
              <div className={styles.darkCount}>
                {counts.pending}
                <span>/{total}</span>
              </div>
            </div>
            {queue.length === 0 ? (
              <p className={styles.darkEmpty}>Semua pendaftar sudah dihubungi. 🎉</p>
            ) : (
              <ul className={styles.todo}>
                {queue.slice(0, 6).map((item) => (
                  <li key={item.id} className={styles.todoItem}>
                    <span className={styles.todoIcon}>
                      <Phone size={15} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.todoName}>{item.student_name}</div>
                      <div className={styles.todoMeta}>
                        {item.selected_class} · {formatDate(item.created_at)}
                      </div>
                    </div>
                    <a
                      href={waUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.todoAction}
                      aria-label={`Chat WhatsApp ${item.student_name}`}
                    >
                      <MessageCircle size={14} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {byClass.length > 0 && (
            <section className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Kelas Pilihan</h2>
              <div className={styles.chartSub}>Jumlah pendaftar per program</div>
              <div className={styles.bars}>
                {byClass.map(([name, count], i) => (
                  <div key={name} className={styles.barCol} title={`${name}: ${count}`}>
                    <span className={`${styles.barValue} ${i === 0 ? styles.barValueTop : ""}`}>
                      {count}
                    </span>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.bar} ${i === 0 ? styles.barTop : ""}`}
                        style={{ height: `${Math.round((count / maxClass) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.barLabel}>
                      {name.replace(/ (Coding )?Class$/, "")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
