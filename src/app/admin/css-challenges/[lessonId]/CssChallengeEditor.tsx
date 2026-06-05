'use client'

import { useState } from 'react'
import { saveCssChallenge } from './actions'
import { useToast } from '@/components/ToastProvider'

interface Props {
  lessonId: string
  existingChallenge: any | null
}

export default function CssChallengeEditor({ lessonId, existingChallenge }: Props) {
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      await saveCssChallenge(lessonId, formData)
      showToast('Soal CSS berhasil disimpan!', 'success')
      window.location.reload()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const cardStyle = {
    background: 'white',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '24px'
  }

  const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    width: '100%'
  }

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: 700 as const,
    color: '#1E293B'
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontFamily: 'inherit',
    fontSize: '0.875rem'
  }

  const monoInputStyle = {
    ...inputStyle,
    fontFamily: 'monospace',
    fontSize: '0.8125rem',
    backgroundColor: '#1E1E1E',
    color: '#D4D4D4',
    border: '1px solid #333'
  }

  return (
    <div>
      <div style={cardStyle}>
        <h2 style={{ marginBottom: '24px' }}>🎨 Definisi Soal CSS</h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Judul Soal</label>
              <input
                name="title"
                type="text"
                placeholder="Contoh: Flexbox Layout"
                defaultValue={existingChallenge?.title || ''}
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
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>XP yang didapat siswa jika berhasil menyelesaikan soal.</span>
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Deskripsi / Instruksi (untuk siswa)</label>
            <textarea
              name="description"
              placeholder="Buatlah 3 kotak sejajar menggunakan display flex"
              defaultValue={existingChallenge?.description || ''}
              required
              rows={6}
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Boilerplate HTML (Struktur HTML yang diberikan ke siswa)</label>
            <textarea
              name="starterHtml"
              placeholder={'<div class="container">\n  <div class="box">1</div>\n  <div class="box">2</div>\n  <div class="box">3</div>\n</div>'}
              defaultValue={existingChallenge?.starter_html || ''}
              rows={8}
              style={monoInputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Starter CSS (CSS awal — opsional)</label>
            <textarea
              name="starterCss"
              placeholder={'.container {\n  /* Tulis CSS di sini */\n}\n\n.box {\n  width: 100px;\n  height: 100px;\n}'}
              defaultValue={existingChallenge?.starter_css || ''}
              rows={8}
              style={monoInputStyle}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>CSS awal yang sudah terisi saat siswa membuka soal. Biarkan kosong jika siswa harus menulis dari awal.</span>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Reference CSS (Jawaban referensi guru)</label>
            <textarea
              name="referenceCss"
              placeholder={'.container {\n  display: flex;\n  gap: 16px;\n}\n\n.box {\n  width: 100px;\n  height: 100px;\n  background: coral;\n}'}
              defaultValue={existingChallenge?.reference_css || ''}
              rows={8}
              style={monoInputStyle}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>CSS referensi yang digunakan sebagai acuan perbandingan visual. Hanya terlihat oleh guru.</span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', padding: '12px 32px' }}>
            {saving ? 'Menyimpan...' : existingChallenge ? '💾 Perbarui Soal' : '✨ Buat Soal CSS'}
          </button>
        </form>
      </div>
    </div>
  )
}
