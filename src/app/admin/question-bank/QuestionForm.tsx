"use client";

import { useState } from "react";
import { addQuestion } from "./actions";
import { useToast } from "@/components/ToastProvider";

interface QuestionFormProps {
  subjects: any[];
}

export default function QuestionForm({ subjects }: QuestionFormProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("options", JSON.stringify(options));
    formData.append("correct_option_index", correctIndex.toString());

    try {
      await addQuestion(formData);
      e.currentTarget.reset();
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
      showToast("Berhasil menambah soal ke bank!", "success");
    } catch (err: any) {
      showToast("Gagal: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="card" style={{ marginBottom: "32px" }}>
      <h3 style={{ marginBottom: "24px" }}>Tambah Soal Baru</h3>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: 600 }}>Mata Pelajaran</label>
            <select
              name="subject_id"
              required
              className="input"
              style={{ width: "100%" }}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: 600 }}>Kategori / Tag</label>
            <input
              name="category"
              type="text"
              placeholder="Contoh: JavaScript Basic"
              required
              className="input"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontWeight: 600 }}>Teks Pertanyaan</label>
          <textarea
            name="question_text"
            required
            className="input"
            rows={3}
            style={{ width: "100%" }}
            placeholder="Tulis soal di sini..."
          ></textarea>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ fontWeight: 600 }}>
            Pilihan Jawaban (Pilih satu yang benar)
          </label>
          {options.map((opt, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <input
                type="radio"
                name="correct"
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
                style={{ width: "20px", height: "20px" }}
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Opsi ${i + 1}`}
                required
                className="input"
                style={{ flex: 1 }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan ke Bank Soal"}
          </button>
        </div>
      </form>
    </div>
  );
}
