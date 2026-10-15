"use client";

export interface ModuleOption {
  id: string;
  title: string;
  subjectTitle: string;
}

interface ModuleSelectProps {
  modules: ModuleOption[];
  value?: string;
  onChange?: (id: string) => void;
  name?: string;
}

// Modul dikelompokkan per mata pelajaran (urutan dari server).
export default function ModuleSelect({
  modules,
  value,
  onChange,
  name,
}: ModuleSelectProps) {
  const groups = new Map<string, ModuleOption[]>();
  for (const m of modules) {
    groups.set(m.subjectTitle, [...(groups.get(m.subjectTitle) ?? []), m]);
  }

  return (
    <select
      name={name}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      required
      className="input"
      style={{ width: "100%" }}
    >
      {[...groups].map(([subject, items]) => (
        <optgroup key={subject} label={subject}>
          {items.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
