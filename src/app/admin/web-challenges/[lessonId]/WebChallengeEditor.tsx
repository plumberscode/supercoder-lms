"use client";

import { useState } from "react";
import { saveWebChallenge } from "./actions";
import { useToast } from "@/components/ToastProvider";
import ChallengeRichEditor from "@/components/admin/ChallengeRichEditor";

interface Props {
  lessonId: string;
  existingChallenge: any | null;
}

export default function WebChallengeEditor({
  lessonId,
  existingChallenge,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<string>(
    existingChallenge?.mode || "html-css-js",
  );
  const { showToast } = useToast();

  const includeCss = mode === "html-css" || mode === "html-css-js";
  const includeJs = mode === "html-css-js";

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("description") || "").trim()) {
      showToast("Deskripsi soal wajib diisi", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await saveWebChallenge(lessonId, formData);
      if (res.error) {
        showToast(res.error, "error");
        return;
      }
      showToast("Soal Coding Web berhasil disimpan!", "success");
      window.location.reload();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    background: "white",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "32px",
    marginBottom: "24px",
  };

  const inputGroupStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    width: "100%",
  };

  const labelStyle = {
    fontSize: "0.875rem",
    fontWeight: 700 as const,
    color: "#1E293B",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #CBD5E1",
    fontFamily: "inherit",
    fontSize: "0.875rem",
  };

  const monoInputStyle = {
    ...inputStyle,
    fontFamily: "monospace",
    fontSize: "0.8125rem",
    backgroundColor: "#1E1E1E",
    color: "#D4D4D4",
    border: "1px solid #333",
  };

  return (
    <div>
      <div style={cardStyle}>
        <h2 style={{ marginBottom: "24px" }}>🕸️ Definisi Soal Coding Web</h2>
        <form
          onSubmit={handleSave}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Judul Soal</label>
              <input
                name="title"
                type="text"
                placeholder="Contoh: To-Do List Interaktif"
                defaultValue={existingChallenge?.title || ""}
                required
                style={inputStyle}
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Bobot Nilai (XP)</label>
              <input
                name="maxScore"
                type="number"
                min="0"
                placeholder="100"
                defaultValue={existingChallenge?.max_score ?? 100}
                required
                style={inputStyle}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                XP yang didapat siswa jika berhasil menyelesaikan soal.
              </span>
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Mode Soal</label>
            <select
              name="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={inputStyle}
            >
              <option value="html">HTML saja</option>
              <option value="html-css">HTML + CSS</option>
              <option value="html-css-js">HTML + CSS + JavaScript</option>
            </select>
            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
              Menentukan kolom editor mana yang ditampilkan ke siswa.
            </span>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>
              Deskripsi / Instruksi (untuk siswa)
            </label>
            <ChallengeRichEditor
              name="description"
              placeholder="Buatlah to-do list interaktif dengan tombol tambah dan hapus item"
              initialValue={existingChallenge?.description || ""}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Starter HTML (boilerplate awal)</label>
            <textarea
              name="starterHtml"
              placeholder={
                '<div class="app">\n  <h1>To-Do List</h1>\n</div>'
              }
              defaultValue={existingChallenge?.starter_html || ""}
              rows={8}
              style={monoInputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Reference HTML (jawaban referensi guru)</label>
            <textarea
              name="referenceHtml"
              placeholder={
                '<div class="app">\n  <h1>To-Do List</h1>\n  <input id="new-item" />\n  <button onclick="addItem()">Tambah</button>\n  <ul id="list"></ul>\n</div>'
              }
              defaultValue={existingChallenge?.reference_html || ""}
              required
              rows={8}
              style={monoInputStyle}
            />
            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
              HTML referensi yang digunakan AI sebagai acuan penilaian. Hanya
              terlihat oleh guru.
            </span>
          </div>

          {includeCss && (
            <>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Starter CSS (CSS awal — opsional)</label>
                <textarea
                  name="starterCss"
                  placeholder={".app {\n  /* Tulis CSS di sini */\n}"}
                  defaultValue={existingChallenge?.starter_css || ""}
                  rows={8}
                  style={monoInputStyle}
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Reference CSS (jawaban referensi guru)</label>
                <textarea
                  name="referenceCss"
                  placeholder={".app {\n  max-width: 400px;\n  margin: 40px auto;\n}"}
                  defaultValue={existingChallenge?.reference_css || ""}
                  rows={8}
                  style={monoInputStyle}
                />
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                  CSS referensi yang digunakan AI sebagai acuan perbandingan
                  visual. Hanya terlihat oleh guru.
                </span>
              </div>
            </>
          )}

          {includeJs && (
            <>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Starter JS (JavaScript awal — opsional)</label>
                <textarea
                  name="starterJs"
                  placeholder={"function addItem() {\n  // Tulis JS di sini\n}"}
                  defaultValue={existingChallenge?.starter_js || ""}
                  rows={8}
                  style={monoInputStyle}
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Reference JS (jawaban referensi guru)</label>
                <textarea
                  name="referenceJs"
                  placeholder={
                    "function addItem() {\n  const input = document.getElementById('new-item');\n  const li = document.createElement('li');\n  li.textContent = input.value;\n  document.getElementById('list').appendChild(li);\n  input.value = '';\n}"
                  }
                  defaultValue={existingChallenge?.reference_js || ""}
                  rows={8}
                  style={monoInputStyle}
                />
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                  JavaScript referensi yang digunakan AI sebagai acuan
                  penilaian logika/interaksi. Hanya terlihat oleh guru.
                </span>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ alignSelf: "flex-start", padding: "12px 32px" }}
          >
            {saving
              ? "Menyimpan..."
              : existingChallenge
                ? "💾 Perbarui Soal"
                : "✨ Buat Soal Coding Web"}
          </button>
        </form>
      </div>
    </div>
  );
}
