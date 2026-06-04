import { GoogleGenerativeAI } from '@google/generative-ai'

interface HintParams {
  challengeDescription: string
  language: string
  studentCode: string
  testResults: { title: string; passed: boolean; expected: string; actual: string }[]
  attemptNumber: number
}

export async function getAIHint(params: HintParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return 'Fitur AI Hint belum dikonfigurasi. Hubungi admin untuk mengaktifkan.'
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const failedTests = params.testResults
      .filter(t => !t.passed)
      .map(t => `- ${t.title}: diharapkan "${t.expected}", tapi hasilnya "${t.actual}"`)
      .join('\n')

    const hintLevel = params.attemptNumber <= 1
      ? 'Berikan petunjuk yang SANGAT umum, hanya arahkan siswa ke konsep yang benar.'
      : params.attemptNumber <= 3
        ? 'Berikan petunjuk yang lebih spesifik, tunjukkan bagian kode mana yang mungkin salah.'
        : 'Berikan petunjuk yang cukup detail, hampir menunjukkan solusi tapi jangan berikan jawaban langsung.'

    const prompt = `Kamu adalah tutor coding yang ramah dan sabar untuk siswa pemula.

Soal: ${params.challengeDescription}

Bahasa: ${params.language}

Kode siswa:
\`\`\`${params.language}
${params.studentCode}
\`\`\`

Test case yang gagal:
${failedTests}

Ini adalah percobaan ke-${params.attemptNumber} siswa.

${hintLevel}

Berikan hint SINGKAT (maksimal 2-3 kalimat) dalam Bahasa Indonesia. JANGAN berikan jawaban langsung. Bantu siswa menemukan solusinya sendiri.`

    const result = await model.generateContent(prompt)
    const response = result.response
    return response.text() || 'Tidak dapat menghasilkan hint saat ini.'
  } catch (err: any) {
    console.error('AI Hint error:', err)
    return 'Maaf, terjadi kesalahan saat meminta bantuan AI. Silakan coba lagi.'
  }
}
