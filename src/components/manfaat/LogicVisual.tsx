import { ArrowRight, Bug, CheckCircle2, Puzzle, Wrench } from "lucide-react";
import VisualFrame from "./VisualFrame";
import styles from "./visual.module.css";
import { order } from "./visual-utils";

const steps = ["Ambil data barang", "Jumlahkan harga", "Tampilkan total"];

export default function LogicVisual() {
  return (
    <VisualFrame
      tone="orange"
      label="Ilustrasi: masalah menghitung total belanja dipecah menjadi tiga langkah, lalu error TypeError dicek dan diperbaiki sampai berhasil"
    >
      <div
        style={order(0)}
        className={`${styles.item} mx-auto flex w-fit items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 shadow-sm`}
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-100 text-orange-600">
          <Puzzle className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold text-slate-800 sm:text-sm">
          Masalah: Hitung total belanja
        </span>
      </div>

      {/* Garis penghubung bercabang ke 3 langkah */}
      <div style={order(1)} className={`${styles.item} mx-auto h-4 w-px bg-orange-300`} />
      <div style={order(1)} className={`${styles.item} mx-[16.6%] h-px bg-orange-300`} />

      <div className="mt-3 grid grid-cols-3 gap-2">
        {steps.map((step, i) => (
          <div
            key={step}
            style={order(2 + i)}
            className={`${styles.item} relative flex items-start gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:p-2.5`}
          >
            <span className="absolute -top-3 left-1/2 h-3 w-px bg-orange-300" />
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">
              {i + 1}
            </span>
            <span className="text-[11px] font-medium leading-snug text-slate-700 sm:text-xs">
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* Strip debug */}
      <div className="mt-5 flex items-stretch gap-1.5 sm:gap-2">
        <DebugNode
          index={5}
          tone="border-red-200 bg-red-50 text-red-700"
          icon={<Bug className="h-4 w-4 shrink-0" />}
          mono
        >
          TypeError: price is undefined
        </DebugNode>
        <ArrowRight
          style={order(6)}
          className={`${styles.item} h-3.5 w-3.5 shrink-0 self-center text-slate-400`}
        />
        <DebugNode
          index={6}
          tone="border-orange-200 bg-orange-50 text-orange-800"
          icon={<Wrench className="h-4 w-4 shrink-0" />}
        >
          Cek nama properti
        </DebugNode>
        <ArrowRight
          style={order(7)}
          className={`${styles.item} h-3.5 w-3.5 shrink-0 self-center text-slate-400`}
        />
        <DebugNode
          index={7}
          tone="border-emerald-200 bg-emerald-50 text-emerald-700"
          icon={<CheckCircle2 className="h-4 w-4 shrink-0" />}
        >
          Berhasil: Rp 125.000
        </DebugNode>
      </div>
    </VisualFrame>
  );
}

function DebugNode({
  index,
  tone,
  icon,
  mono,
  children,
}: {
  index: number;
  tone: string;
  icon: React.ReactNode;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={order(index)}
      className={`${styles.item} ${tone} flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-center sm:flex-row sm:items-start sm:text-left`}
    >
      {icon}
      <span
        className={`min-w-0 break-words text-[10px] font-semibold leading-snug sm:text-[11px] ${
          mono ? "font-mono" : ""
        }`}
      >
        {children}
      </span>
    </div>
  );
}
