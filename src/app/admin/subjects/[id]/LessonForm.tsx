'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { createLesson } from './actions'
import { useToast } from '@/components/ToastProvider'

export default function LessonForm({ moduleId, subjectId, orderIndex, initialType = 'text' }: { moduleId: string, subjectId: string, orderIndex: number, initialType?: string }) {
  const [type, setType] = useState(initialType)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isDynamic, setIsDynamic] = useState(false)
  const [targetCategory, setTargetCategory] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  
  const supabase = createClient()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    let contentUrl = formData.get('contentUrl') as string

    if (type === 'pdf' && file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `lessons/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file)

      if (uploadError) {
        showToast('Gagal mengunggah berkas: ' + uploadError.message, 'error')
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(filePath)
      contentUrl = publicUrl
    }

    const finalData = new FormData()
    finalData.append('title', formData.get('title') as string)
    finalData.append('description', formData.get('description') as string)
    finalData.append('type', type)
    finalData.append('contentUrl', contentUrl)
    finalData.append('orderIndex', orderIndex.toString())
    
    if (type === 'quiz') {
      finalData.append('is_dynamic', isDynamic.toString())
      finalData.append('target_category', targetCategory)
      finalData.append('question_count', questionCount.toString())
    }

    try {
      await createLesson(moduleId, subjectId, finalData)
      window.location.reload()
    } catch (err: any) {
      showToast('Gagal membuat materi: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    width: '100%'
  }

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#1E293B'
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', marginTop: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <div style={{ backgroundColor: '#F8FAFC', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
        <h4 style={{ margin: 0, color: '#0F172A' }}>
          {type === 'quiz' ? 'Konfigurasi Kuis Baru' : type === 'project' ? 'Konfigurasi Tugas Baru' : type === 'code' ? 'Konfigurasi Soal Coding Baru' : type === 'css-challenge' ? 'Konfigurasi Soal CSS Baru' : 'Konfigurasi Materi Baru'}
        </h4>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: (type === 'quiz' || type === 'project' || type === 'code' || type === 'css-challenge') ? '1fr' : '1fr 1fr', gap: '24px' }}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Judul {type === 'quiz' ? 'Kuis' : type === 'project' ? 'Tugas' : type === 'code' ? 'Soal Coding' : type === 'css-challenge' ? 'Soal CSS' : 'Materi'}</label>
            <input 
              name="title" 
              type="text" 
              placeholder={type === 'quiz' ? 'Contoh: Kuis Dasar JS' : type === 'project' ? 'Contoh: Tugas Akhir Modul' : type === 'code' ? 'Contoh: Fungsi Python' : type === 'css-challenge' ? 'Contoh: Layout Grid' : 'Contoh: Pengenalan JavaScript'} 
              required 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
            />
          </div>
          {type !== 'quiz' && type !== 'project' && type !== 'code' && type !== 'css-challenge' && (
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Tipe Materi</label>
              <select 
                name="type" 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white' }}
              >
                <option value="text">📖 Teks / Markdown</option>
                <option value="video">📹 Link Video</option>
                <option value="pdf">📄 Unggah PDF</option>
                <option value="link">🔗 Link Eksternal</option>
                <option value="code">💻 Soal Coding</option>
              </select>
            </div>
          )}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Deskripsi Singkat (Muncul di daftar kursus)</label>
          <textarea 
            name="description" 
            placeholder="Jelaskan secara singkat apa yang akan dipelajari..." 
            rows={2}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
          ></textarea>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#F1F5F9', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ marginBottom: '12px', fontWeight: 700, fontSize: '0.875rem', color: '#475569' }}>SUMBER KONTEN</div>
          
          {type === 'video' && (
            <div style={inputGroupStyle}>
              <input name="contentUrl" type="url" placeholder="Link YouTube atau Loom" required style={{ width: '100%' }} />
            </div>
          )}

          {type === 'pdf' && (
            <div style={inputGroupStyle}>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                required 
                style={{ width: '100%', padding: '8px', backgroundColor: 'white', border: '1px dashed #CBD5E1' }}
              />
            </div>
          )}

          {type === 'link' && (
            <div style={inputGroupStyle}>
              <input name="contentUrl" type="url" placeholder="https://link-eksternal.com" required style={{ width: '100%' }} />
            </div>
          )}

          {type === 'text' && (
            <div style={inputGroupStyle}>
              <textarea name="contentUrl" placeholder="Tulis teks materi Anda di sini..." rows={4} style={{ width: '100%' }}></textarea>
            </div>
          )}

          {type === 'quiz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <input 
                  type="checkbox" 
                  id="is_dynamic" 
                  checked={isDynamic} 
                  onChange={(e) => setIsDynamic(e.target.checked)} 
                  style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="is_dynamic" style={{ fontWeight: 600, cursor: 'pointer' }}>Gunakan Bank Soal (Kuis Dinamis)</label>
              </div>

              {isDynamic ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Pilih Kategori</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: JavaScript Basic" 
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      required
                      className="input"
                    />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Jumlah Soal</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      required
                      className="input"
                    />
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
                  Mode Statik: Buat kuis terlebih dahulu, lalu tambahkan pertanyaan secara manual dari daftar materi.
                </p>
              )}
            </div>
          )}

          {type === 'project' && (
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
              Siswa akan diminta untuk mengunggah atau mengirimkan link hasil pekerjaan mereka.
            </p>
          )}

          {type === 'code' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '2rem' }}>💻</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#1E293B' }}>Soal Coding Interaktif</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#64748B' }}>
                    Siswa akan mengerjakan soal coding langsung di built-in IDE. Setelah membuat lesson ini, Anda bisa mengatur soal, starter code, dan test cases dari halaman detail materi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {type === 'css-challenge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '2rem' }}>🎨</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#1E293B' }}>Soal CSS Interaktif</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#64748B' }}>
                    Siswa akan menulis CSS dengan live preview. Setelah membuat lesson ini, Anda bisa mengatur soal, boilerplate HTML, dan referensi jawaban dari halaman detail materi.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '160px' }}>
            {loading ? 'Menyimpan...' : `Simpan ${type === 'quiz' ? 'Kuis' : type === 'project' ? 'Tugas' : type === 'code' ? 'Soal Coding' : type === 'css-challenge' ? 'Soal CSS' : 'Materi'}`}
          </button>
        </div>
      </form>
    </div>
  )
}
