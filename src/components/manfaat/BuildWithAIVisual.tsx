import { Lightbulb, PenTool, Sparkles, type LucideIcon } from "lucide-react";
import VisualFrame from "./VisualFrame";
import styles from "./visual.module.css";
import { order } from "./visual-utils";

const nodes: { icon: LucideIcon; label: string; accent?: boolean }[] = [
  { icon: Lightbulb, label: "Ide" },
  { icon: PenTool, label: "Sketsa" },
  { icon: Sparkles, label: "Build + AI", accent: true },
];

export default function BuildWithAIVisual() {
  return (
    <VisualFrame
      tone="rose"
      label="Ilustrasi: alur dari ide, sketsa, dan build dengan AI sampai menjadi website portofolio yang live di internet"
    >
      <div className="flex flex-col items-center sm:flex-row">
        <div className="flex w-full items-start sm:w-auto sm:flex-1">
          {nodes.map(({ icon: Icon, label, accent }, i) => (
            <div key={label} className="contents">
              <div
                style={order(i)}
                className={`${styles.item} flex shrink-0 flex-col items-center gap-1.5`}
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-full border shadow-sm ${
                    accent
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-rose-200 bg-white text-rose-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="whitespace-nowrap text-[11px] font-semibold text-slate-700 sm:text-xs">
                  {label}
                </span>
              </div>
              {i < nodes.length - 1 && (
                <span
                  style={order(i)}
                  className={`${styles.item} mt-[21px] min-w-3 flex-1 self-start border-t-2 border-dashed border-rose-300`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Penghubung ke jendela browser: vertikal di mobile, horizontal di desktop */}
        <span
          style={order(2)}
          className={`${styles.item} h-4 border-l-2 border-dashed border-rose-300 sm:hidden`}
        />
        <span
          style={order(2)}
          className={`${styles.item} hidden w-5 shrink-0 border-t-2 border-dashed border-rose-300 sm:block`}
        />

        <div
          style={order(3)}
          className={`${styles.item} relative w-full rounded-xl border border-slate-200 bg-white shadow-md sm:w-[250px] sm:shrink-0`}
        >
          <div className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="ml-1 min-w-0 flex-1 truncate rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[9px] text-slate-500 sm:text-[10px]">
              portofolio-kamu.vercel.app
            </span>
          </div>

          <div className="space-y-2 p-3">
            <div className="h-3 w-3/4 rounded bg-slate-800" />
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded bg-slate-200" />
              <div className="h-1.5 w-5/6 rounded bg-slate-200" />
              <div className="h-1.5 w-2/3 rounded bg-slate-200" />
            </div>
            <div className="h-5 w-16 rounded-md bg-rose-500" />
          </div>

          <span
            style={order(4)}
            className={`${styles.item} absolute -top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm`}
          >
            <span className={`${styles.liveDot} h-1.5 w-1.5 rounded-full bg-emerald-500`} />
            Live
          </span>
        </div>
      </div>
    </VisualFrame>
  );
}
