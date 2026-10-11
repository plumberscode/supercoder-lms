import { Bot, CheckCircle2, ChevronRight, ScanSearch } from "lucide-react";
import VisualFrame from "./VisualFrame";
import styles from "./visual.module.css";
import { order } from "./visual-utils";

const chips = ["Dibaca", "Dipahami", "Dievaluasi"];

export default function UnderstandTechVisual() {
  return (
    <VisualFrame
      tone="blue"
      label="Ilustrasi: kode hasil AI dibaca, dipahami, lalu dievaluasi oleh siswa, bukan diterima mentah-mentah"
    >
      <div
        style={order(0)}
        className={`${styles.item} rounded-xl border border-slate-200 bg-white p-3 shadow-sm`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100 text-blue-600">
              <Bot className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold text-slate-800 sm:text-sm">AI Assistant</span>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            kode dihasilkan
          </span>
        </div>

        <div
          style={order(1)}
          className={`${styles.item} relative rounded-lg bg-slate-50 py-2 font-mono text-[10px] leading-6 sm:text-xs sm:leading-6`}
        >
          {/* Callout (desktop): di kanan baris 1 yang pendek, menunjuk badge di baris 2 */}
          <div
            style={order(3)}
            className={`${styles.item} absolute right-2 top-0 z-10 hidden -translate-y-1 items-center rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white shadow sm:flex`}
          >
            Kenapa baris ini bekerja?
            <span className="absolute -bottom-1 right-3 h-2 w-2 rotate-45 bg-slate-800" />
          </div>

          <Line n={1}>
            <span className="text-violet-600">const</span> total = items.
            <span className="text-blue-600">reduce</span>(
          </Line>
          <Line n={2} highlight>
            {"  "}(sum, item) <span className="text-rose-500">=&gt;</span> sum + item.price,
            <span
              style={order(3)}
              className={`${styles.item} absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-blue-600 text-white shadow`}
            >
              <ScanSearch className="h-3 w-3" />
            </span>
          </Line>
          <Line n={3}>
            {"  "}
            <span className="text-amber-600">0</span>
          </Line>
          <Line n={4}>
            );<span className={styles.cursor} />
          </Line>
        </div>

        {/* Callout (mobile): tampil di bawah blok kode */}
        <div
          style={order(3)}
          className={`${styles.item} mt-2 flex items-center gap-1.5 text-[11px] font-medium text-blue-700 sm:hidden`}
        >
          <ScanSearch className="h-3.5 w-3.5" />
          Kenapa baris ini bekerja?
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1 sm:gap-2">
        {chips.map((chip, i) => (
          <div key={chip} className="flex items-center gap-1 sm:gap-2">
            <span
              style={order(4 + i)}
              className={`${styles.item} inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-700 shadow-sm sm:px-2.5 sm:text-xs`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {chip}
            </span>
            {i < chips.length - 1 && (
              <ChevronRight style={order(4 + i)} className={`${styles.item} hidden h-3.5 w-3.5 text-slate-400 sm:block`} />
            )}
          </div>
        ))}
      </div>
    </VisualFrame>
  );
}

function Line({
  n,
  highlight,
  children,
}: {
  n: number;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex whitespace-pre-wrap break-words pl-2 pr-9 ${
        highlight ? "border-l-2 border-blue-500 bg-blue-100/80" : "border-l-2 border-transparent"
      }`}
    >
      <span className="w-5 shrink-0 select-none text-slate-300">{n}</span>
      <span className="text-slate-700">{children}</span>
    </div>
  );
}
