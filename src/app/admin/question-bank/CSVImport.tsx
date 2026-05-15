'use client'

import { useState } from 'react'
import { bulkAddQuestions } from './actions'
import { useToast } from '@/components/ToastProvider'

interface CSVImportProps {
  subjects: any[]
}

export default function CSVImport({ subjects }: CSVImportProps) {
  const [loading, setLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '')
  const { showToast } = useToast()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim() !== '')
        
        // Skip header if it exists (check if first line contains 'category')
        const startIdx = lines[0].toLowerCase().includes('category') ? 1 : 0
        
        const questions = lines.slice(startIdx).map(line => {
          // Simple CSV split (note: doesn't handle commas inside quotes, but good for start)
          const parts = line.split(',').map(p => p.trim())
          
          if (parts.length < 7) return null
          
          return {
            subject_id: selectedSubject,
            category: parts[0],
            question_text: parts[1],
            options: [parts[2], parts[3], parts[4], parts[5]],
            correct_option_index: parseInt(parts[6]),
            points: parseInt(parts[7] || '10')
          }
        }).filter(q => q !== null)

        if (questions.length === 0) {
          showToast('Tidak ada data valid ditemukan dalam CSV.', 'error')
          return
        }

        await bulkAddQuestions(questions)
        showToast(`Berhasil mengimpor ${questions.length} soal!`, 'success')
        window.location.reload()
      } catch (err: any) {
        showToast('Gagal mengimpor: ' + err.message, 'error')
      } finally {
        setLoading(false)
        e.target.value = ''
      }
    }

    reader.readAsText(file)
  }

  return (
    <div className="card" style={{ padding: '24px', backgroundColor: '#F8FAFC' }}>
      <h3 style={{ marginBottom: '16px' }}>Impor via CSV</h3>
      <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '20px' }}>
        Gunakan format: <code>kategori, soal, opsi1, opsi2, opsi3, opsi4, index_benar, poin</code>
      </p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
          <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Pilih Mata Pelajaran</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input"
            style={{ width: '100%' }}
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Upload File .csv</label>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
            disabled={loading}
            style={{ 
              padding: '8px', 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              border: '1px dashed #CBD5E1',
              cursor: 'pointer'
            }}
          />
        </div>
        
        {loading && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Mengimpor...</span>}
      </div>
      
      <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#94A3B8' }}>
        * <code>index_benar</code> adalah angka 0-3 (0 untuk opsi1, 1 untuk opsi2, dst.)
      </div>
    </div>
  )
}
