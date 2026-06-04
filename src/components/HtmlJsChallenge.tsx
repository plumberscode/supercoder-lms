'use client'

import { useState, useRef, useCallback } from 'react'
import CodeEditor from './CodeEditor'
import styles from './code-challenge.module.css'
import { submitCodeSolution, getCodeHint } from '@/app/lessons/code-actions'
import {
  createSandboxedIframe,
  executeJsInIframe,
  runDomTest,
  destroyIframe
} from '@/lib/iframe-runner'

interface CodingChallenge {
  id: string
  lesson_id: string
  title: string
  description: string
  language: 'html-js'
  starter_code: string
  starter_html?: string
  hints: string[]
  max_score: number
}

interface TestCase {
  id: string
  title: string
  input: string
  expected_output: string
  is_hidden: boolean
  order_index: number
}

interface TestResult {
  testCase: TestCase
  passed: boolean
  actual_output: string
  error: string | null
}

interface GradingResult {
  results: TestResult[]
  totalPassed: number
  totalTests: number
  score: number
}

interface Props {
  challenge: CodingChallenge
  testCases: TestCase[]
  existingSubmission?: { score: number; data: any } | null
}

export default function HtmlJsChallenge({ challenge, testCases, existingSubmission }: Props) {
  const initialHtml = existingSubmission?.data?.html || challenge.starter_html || ''
  const initialJs = existingSubmission?.data?.code || challenge.starter_code || ''

  const [htmlCode, setHtmlCode] = useState(initialHtml)
  const [jsCode, setJsCode] = useState(initialJs)
  const [activeTab, setActiveTab] = useState<'html' | 'js'>('html')
  const [output, setOutput] = useState('')
  const [outputError, setOutputError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState<GradingResult | null>(null)
  const [hint, setHint] = useState('')
  const [isLoadingHint, setIsLoadingHint] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [finalScore, setFinalScore] = useState<number | null>(existingSubmission?.score ?? null)
  const [previewActive, setPreviewActive] = useState(false)

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const currentIframeRef = useRef<HTMLIFrameElement | null>(null)

  const visibleTests = testCases.filter(tc => !tc.is_hidden)

  const clearPreview = useCallback(() => {
    if (currentIframeRef.current) {
      destroyIframe(currentIframeRef.current)
      currentIframeRef.current = null
    }
  }, [])

  const handleRun = async () => {
    setIsRunning(true)
    setOutput('')
    setOutputError(null)
    clearPreview()

    try {
      if (!previewContainerRef.current) throw new Error('Preview container not found')

      const iframe = await createSandboxedIframe(
        previewContainerRef.current,
        htmlCode,
        true
      )
      currentIframeRef.current = iframe
      setPreviewActive(true)

      // Execute JS
      const result = await executeJsInIframe(iframe, jsCode)
      setOutput(result.output)
      setOutputError(result.error)
    } catch (err: any) {
      setOutputError(err.message || 'Terjadi kesalahan')
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setTestResults(null)
    clearPreview()

    try {
      if (!previewContainerRef.current) throw new Error('Preview container not found')

      // Create a fresh iframe for testing
      const iframe = await createSandboxedIframe(
        previewContainerRef.current,
        htmlCode,
        true
      )
      currentIframeRef.current = iframe
      setPreviewActive(true)

      // Execute student JS first
      await executeJsInIframe(iframe, jsCode)

      // Run DOM assertion tests
      const results: TestResult[] = []
      for (const tc of testCases) {
        const testResult = await runDomTest(iframe, tc.id, tc.input)
        const actualTrimmed = (testResult.result || '').trim()
        const expectedTrimmed = (tc.expected_output || '').trim()
        const passed = !testResult.error && actualTrimmed === expectedTrimmed

        results.push({
          testCase: tc,
          passed,
          actual_output: testResult.result || '',
          error: testResult.error
        })
      }

      const totalPassed = results.filter(r => r.passed).length
      const totalTests = results.length
      const score = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0
      const gradingResult: GradingResult = { results, totalPassed, totalTests, score }

      setTestResults(gradingResult)
      setAttemptCount(prev => prev + 1)

      if (score >= 70) {
        setFinalScore(score)
        await submitCodeSolution({
          challengeId: challenge.id,
          lessonId: challenge.lesson_id,
          code: jsCode,
          score,
          html: htmlCode
        })
      }
    } catch (err: any) {
      setOutputError(err.message || 'Terjadi kesalahan saat submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGetHint = async () => {
    if (!testResults) return
    setIsLoadingHint(true)

    try {
      const hintText = await getCodeHint({
        challengeDescription: challenge.description,
        language: 'html-js',
        studentCode: `<!-- HTML -->\n${htmlCode}\n\n/* JavaScript */\n${jsCode}`,
        testResults: testResults.results.map(r => ({
          title: r.testCase.title,
          passed: r.passed,
          expected: r.testCase.expected_output,
          actual: r.actual_output
        })),
        attemptNumber: attemptCount
      })
      setHint(hintText)
    } catch {
      setHint('Maaf, tidak dapat memuat hint saat ini.')
    } finally {
      setIsLoadingHint(false)
    }
  }

  const handleReset = () => {
    setHtmlCode(challenge.starter_html || '')
    setJsCode(challenge.starter_code || '')
    setOutput('')
    setOutputError(null)
    setTestResults(null)
    setHint('')
    clearPreview()
    setPreviewActive(false)
  }

  return (
    <div className={styles.container}>
      {existingSubmission && (
        <div className={styles.existingScore}>
          🏆 Skor terbaik sebelumnya: {existingSubmission.score}/100
        </div>
      )}

      <div className={styles.splitLayout}>
        {/* Left Panel: Description */}
        <div className={styles.descriptionPanel}>
          <h2 className={styles.challengeTitle}>{challenge.title}</h2>
          <span className={`${styles.languageBadge} ${styles.languageBadgeHtmlJs}`}>
            🌐 HTML + JavaScript
          </span>
          <div className={styles.description}>{challenge.description}</div>

          {visibleTests.length > 0 && (
            <>
              <h4 style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Contoh Test Cases
              </h4>
              {visibleTests.map((tc, i) => (
                <div key={tc.id} className={styles.sampleSection}>
                  <h4>Test {i + 1}: {tc.title}</h4>
                  {tc.input && (
                    <>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>DOM Assertion:</div>
                      <code>{tc.input}</code>
                    </>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px', marginTop: tc.input ? '8px' : 0 }}>Expected:</div>
                  <code>{tc.expected_output}</code>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right Panel: Editor + Preview */}
        <div className={styles.editorPanel}>
          {/* Header with buttons */}
          <div className={styles.editorHeader}>
            <span className={styles.editorLabel}>🌐 HTML + JS Editor</span>
            <div className={styles.buttonGroup}>
              <button onClick={handleRun} disabled={isRunning || isSubmitting} className={styles.runButton}>
                {isRunning ? '⏳ Menjalankan...' : '▶ Jalankan'}
              </button>
              <button onClick={handleSubmit} disabled={isRunning || isSubmitting} className={styles.submitButton}>
                {isSubmitting ? '⏳ Memeriksa...' : '📤 Submit'}
              </button>
              <button onClick={handleReset} className={styles.resetButton}>
                ↺ Reset
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${activeTab === 'html' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('html')}
            >
              📄 HTML
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'js' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('js')}
            >
              ⚡ JavaScript
            </button>
          </div>

          {/* Editors (show/hide based on tab) */}
          <div style={{ display: activeTab === 'html' ? 'block' : 'none' }}>
            <CodeEditor
              language="html"
              value={htmlCode}
              onChange={setHtmlCode}
              height="280px"
            />
          </div>
          <div style={{ display: activeTab === 'js' ? 'block' : 'none' }}>
            <CodeEditor
              language="javascript"
              value={jsCode}
              onChange={setJsCode}
              height="280px"
            />
          </div>

          {/* Live Preview */}
          <div className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <span>🖥️ Preview</span>
              {previewActive && (
                <span style={{ color: '#10B981', fontSize: '0.6875rem' }}>● Live</span>
              )}
            </div>
            <div ref={previewContainerRef} style={{ position: 'relative', minHeight: '200px' }}>
              {!previewActive && (
                <div className={styles.previewPlaceholder}>
                  Klik &quot;Jalankan&quot; untuk melihat preview HTML...
                </div>
              )}
            </div>
          </div>

          {/* Console Output */}
          {(output || outputError) && (
            <div className={styles.consolePanel} style={{ borderRadius: '12px', marginTop: '12px' }}>
              <span className={styles.consoleLabel}>📟 Console Output</span>
              {outputError && <div className={styles.errorText}>{outputError}</div>}
              {output && <div>{output}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className={styles.testResultsPanel}>
          <div className={styles.testResultsTitle}>
            🧪 Hasil Test Cases ({testResults.totalPassed}/{testResults.totalTests} lulus)
          </div>
          {testResults.results.map((r, i) => (
            <div key={i} className={`${styles.testItem} ${r.passed ? styles.testPassed : styles.testFailed}`}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{r.passed ? '✅' : '❌'}</span>
                  <strong>{r.testCase.is_hidden ? 'Test Tersembunyi' : r.testCase.title}</strong>
                </div>
                {!r.testCase.is_hidden && !r.passed && (
                  <div className={styles.testDetails}>
                    <div>
                      <span style={{ color: '#64748B' }}>Diharapkan:</span>
                      <code>{r.testCase.expected_output}</code>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Hasil kamu:</span>
                      <code>{r.error ? `Error: ${r.error}` : r.actual_output || '(kosong)'}</code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hint Section */}
      {attemptCount > 0 && testResults && testResults.score < 100 && (
        <>
          {!hint && (
            <button onClick={handleGetHint} disabled={isLoadingHint} className={styles.hintButton}>
              {isLoadingHint ? '⏳ Meminta bantuan AI...' : '💡 Minta Petunjuk (AI Hint)'}
            </button>
          )}
          {hint && (
            <div className={styles.hintPanel}>
              <div className={styles.hintTitle}>💡 Petunjuk dari AI Tutor</div>
              <div className={styles.hintText}>{hint}</div>
              <button
                onClick={handleGetHint}
                disabled={isLoadingHint}
                style={{ marginTop: '12px', background: 'transparent', border: '1px solid #D97706', color: '#92400E', padding: '6px 16px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {isLoadingHint ? '⏳ Memuat...' : '🔄 Minta Petunjuk Lagi'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Score Display */}
      {testResults && testResults.score >= 70 && (
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreValue}>{testResults.score}</div>
          <div className={styles.scoreLabel}>
            🎉 Selamat! Kode kamu berhasil lulus {testResults.totalPassed} dari {testResults.totalTests} test cases!
          </div>
        </div>
      )}
    </div>
  )
}
