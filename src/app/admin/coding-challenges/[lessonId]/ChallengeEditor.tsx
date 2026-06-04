'use client'

import { useState } from 'react'
import { saveChallenge, addTestCase, deleteTestCase } from './actions'
import { useToast } from '@/components/ToastProvider'

interface Props {
  lessonId: string
  existingChallenge: any | null
  existingTestCases: any[]
}

export default function ChallengeEditor({ lessonId, existingChallenge, existingTestCases }: Props) {
  const [saving, setSaving] = useState(false)
  const [addingTest, setAddingTest] = useState(false)
  const { showToast } = useToast()

  const handleSaveChallenge = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      await saveChallenge(lessonId, formData)
      showToast('Soal coding berhasil disimpan!', 'success')
      window.location.reload()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTestCase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!existingChallenge) {
      showToast('Simpan soal terlebih dahulu sebelum menambah test case', 'error')
      return
    }
    setAddingTest(true)
    try {
      const formData = new FormData(e.currentTarget)
      await addTestCase(existingChallenge.id, formData)
      showToast('Test case berhasil ditambahkan!', 'success')
      window.location.reload()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setAddingTest(false)
    }
  }

  const handleDeleteTestCase = async (id: string) => {
    if (!confirm('Hapus test case ini?')) return
    try {
      await deleteTestCase(id)
      showToast('Test case berhasil dihapus', 'success')
      window.location.reload()
    } catch (err: any) {
      showToast(err.message, 'error')
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
      {/* Challenge Form */}
      <div style={cardStyle}>
        <h2 style={{ marginBottom: '24px' }}>📝 Definisi Soal</h2>
        <form onSubmit={handleSaveChallenge} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Judul Soal</label>
              <input
                name="title"
                type="text"
                placeholder="Contoh: Fungsi Penjumlahan"
                defaultValue={existingChallenge?.title || ''}
                required
                style={inputStyle}
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Bahasa Pemrograman</label>
              <select
                name="language"
                defaultValue={existingChallenge?.language || 'python'}
                style={{ ...inputStyle, backgroundColor: 'white' }}
              >
                <option value="python">🐍 Python</option>
                <option value="javascript">⚡ JavaScript</option>
              </select>
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Deskripsi Soal (Instruksi untuk siswa)</label>
            <textarea
              name="description"
              placeholder={"Buatlah sebuah fungsi bernama `tambah` yang menerima dua parameter angka dan mengembalikan hasil penjumlahan keduanya.\n\nContoh:\n- tambah(2, 3) → 5\n- tambah(-1, 1) → 0"}
              defaultValue={existingChallenge?.description || ''}
              required
              rows={6}
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Starter Code (Kode awal yang diberikan ke siswa)</label>
            <textarea
              name="starterCode"
              placeholder={"# Tulis fungsi di sini\ndef tambah(a, b):\n    # kode kamu di sini\n    pass"}
              defaultValue={existingChallenge?.starter_code || ''}
              rows={8}
              style={monoInputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Solution Code (Jawaban benar — hanya untuk referensi guru)</label>
            <textarea
              name="solutionCode"
              placeholder={"def tambah(a, b):\n    return a + b"}
              defaultValue={existingChallenge?.solution_code || ''}
              rows={6}
              style={monoInputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Hints / Petunjuk (satu per baris — ditampilkan secara progresif saat siswa gagal)</label>
            <textarea
              name="hints"
              placeholder={"Coba pikirkan operator apa yang digunakan untuk menjumlahkan dua angka\nPerhatikan bahwa fungsi harus mengembalikan (return) hasilnya, bukan hanya menghitungnya\nGunakan keyword 'return' untuk mengembalikan nilai dari fungsi"}
              defaultValue={existingChallenge?.hints ? (Array.isArray(existingChallenge.hints) ? existingChallenge.hints.join('\n') : '') : ''}
              rows={4}
              style={inputStyle}
            />
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>
              Hint pertama ditampilkan setelah percobaan pertama yang gagal, hint kedua setelah percobaan kedua, dst. Jika AI Hint diaktifkan, AI akan memberikan saran tambahan.
            </p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', padding: '12px 32px' }}>
            {saving ? 'Menyimpan...' : existingChallenge ? '💾 Perbarui Soal' : '✨ Buat Soal Coding'}
          </button>
        </form>
      </div>

      {/* Test Cases Section */}
      <div style={cardStyle}>
        <h2 style={{ marginBottom: '8px' }}>🧪 Test Cases</h2>
        <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '0.875rem' }}>
          Test case digunakan untuk mengecek apakah jawaban siswa benar. Siswa hanya bisa melihat test case yang tidak tersembunyi.
        </p>

        {!existingChallenge && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
            Simpan soal terlebih dahulu sebelum menambahkan test cases.
          </div>
        )}

        {existingChallenge && (
          <>
            {/* Existing Test Cases */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {existingTestCases.map((tc, index) => (
                <div key={tc.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  gap: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <strong>#{index + 1} {tc.title}</strong>
                      {tc.is_hidden && (
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px' }}>
                          Tersembunyi
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Input:</span>
                        <code style={{ backgroundColor: '#1E1E1E', color: '#D4D4D4', padding: '8px', borderRadius: '6px', display: 'block', whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                          {tc.input || '(kosong)'}
                        </code>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Expected Output:</span>
                        <code style={{ backgroundColor: '#1E1E1E', color: '#D4D4D4', padding: '8px', borderRadius: '6px', display: 'block', whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                          {tc.expected_output}
                        </code>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTestCase(tc.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#EF4444', padding: '8px' }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
              {existingTestCases.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                  Belum ada test case. Tambahkan di bawah ini.
                </div>
              )}
            </div>

            {/* Add Test Case Form */}
            <div style={{ padding: '24px', backgroundColor: '#F1F5F9', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              <h3 style={{ marginBottom: '16px' }}>+ Tambah Test Case</h3>
              <form onSubmit={handleAddTestCase} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Nama Test Case</label>
                    <input name="title" placeholder="Contoh: Test penjumlahan positif" required style={inputStyle} />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Tersembunyi?</label>
                    <select name="isHidden" style={{ ...inputStyle, backgroundColor: 'white' }}>
                      <option value="false">🔓 Terlihat</option>
                      <option value="true">🔒 Tersembunyi</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Input (kode yang dijalankan setelah kode siswa)</label>
                    <textarea
                      name="input"
                      placeholder={"print(tambah(2, 3))"}
                      rows={3}
                      style={monoInputStyle}
                    />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Expected Output</label>
                    <textarea
                      name="expectedOutput"
                      placeholder="5"
                      required
                      rows={3}
                      style={monoInputStyle}
                    />
                  </div>
                </div>
                <input type="hidden" name="orderIndex" value={existingTestCases.length} />
                <button type="submit" className="btn btn-primary" disabled={addingTest} style={{ alignSelf: 'flex-start' }}>
                  {addingTest ? 'Menambahkan...' : '+ Tambah Test Case'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
