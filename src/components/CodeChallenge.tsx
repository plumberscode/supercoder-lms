"use client";

import { useState } from "react";
import CodeEditor from "./CodeEditor";
import styles from "./code-challenge.module.css";
import { submitCodeSolution, getCodeHint } from "@/app/lessons/code-actions";
import { runCode } from "@/lib/code-runner";
import { runTestCases, type GradingResult } from "@/lib/test-runner";
import HtmlJsChallenge from "./HtmlJsChallenge";

interface CodingChallenge {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  language: "python" | "javascript" | "html-js";
  starter_code: string;
  starter_html?: string;
  hints: string[];
  max_score: number;
}

interface TestCase {
  id: string;
  title: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  order_index: number;
}

interface Props {
  challenge: CodingChallenge;
  testCases: TestCase[];
  existingSubmission?: { score: number; data: any } | null;
}

export default function CodeChallenge({
  challenge,
  testCases,
  existingSubmission,
}: Props) {
  if (challenge.language === "html-js") {
    return (
      <HtmlJsChallenge
        challenge={{ ...challenge, language: "html-js" }}
        testCases={testCases}
        existingSubmission={existingSubmission}
      />
    );
  }

  return (
    <StandardCodeChallenge
      challenge={challenge}
      testCases={testCases}
      existingSubmission={existingSubmission}
    />
  );
}

function StandardCodeChallenge({
  challenge,
  testCases,
  existingSubmission,
}: Props) {
  const initialCode =
    existingSubmission?.data?.code || challenge.starter_code || "";

  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [outputError, setOutputError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<GradingResult | null>(null);
  const [hint, setHint] = useState("");
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(
    existingSubmission?.score ?? null,
  );
  const [pyodideLoading, setPyodideLoading] = useState(false);

  const [activeBottomTab, setActiveBottomTab] = useState<"console" | "tests" | "hint">("console");

  const visibleTests = testCases.filter((tc) => !tc.is_hidden);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");
    setOutputError(null);
    setActiveBottomTab("console");

    if (challenge.language === "python") setPyodideLoading(true);

    try {
      const result = await runCode(challenge.language, code);
      setOutput(result.output);
      setOutputError(result.error);
    } catch (err: any) {
      setOutputError(err.message || "Terjadi kesalahan");
    } finally {
      setIsRunning(false);
      setPyodideLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (testCases.length === 0) {
      setOutputError("Tidak ada test case untuk soal ini. Hubungi guru Anda.");
      setActiveBottomTab("console");
      return;
    }
    setIsSubmitting(true);
    setTestResults(null);
    setOutputError(null);
    setActiveBottomTab("tests");

    try {
      const result = await runTestCases(challenge.language, code, testCases);
      setTestResults(result);
      setAttemptCount((prev) => prev + 1);

      if (result.score >= 70) {
        setFinalScore(result.score);
        await submitCodeSolution({
          challengeId: challenge.id,
          lessonId: challenge.lesson_id,
          code,
          score: result.score,
        });
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setOutputError(err.message || "Terjadi kesalahan saat submit");
      setActiveBottomTab("console");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    if (!testResults) return;
    setIsLoadingHint(true);
    setActiveBottomTab("hint");

    try {
      const hintText = await getCodeHint({
        challengeDescription: challenge.description,
        language: challenge.language,
        studentCode: code,
        testResults: testResults.results.map((r) => ({
          title: r.testCase.title,
          passed: r.passed,
          expected: r.testCase.expected_output,
          actual: r.actual_output,
        })),
        attemptNumber: attemptCount,
      });
      setHint(hintText);
    } catch (err: any) {
      setHint("Maaf, tidak dapat memuat hint saat ini.");
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleReset = () => {
    setCode(challenge.starter_code || "");
    setOutput("");
    setOutputError(null);
    setTestResults(null);
    setHint("");
    setActiveBottomTab("console");
  };

  const langIcon = challenge.language === "python" ? "🐍" : "⚡";
  const langLabel = challenge.language === "python" ? "Python" : "JavaScript";

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
          <span
            className={`${styles.languageBadge} ${challenge.language === "python" ? styles.languageBadgePython : styles.languageBadgeJavascript}`}
          >
            {langIcon} {langLabel}
          </span>
          <div className={styles.description}>{challenge.description}</div>

          {visibleTests.length > 0 && (
            <>
              <h4
                style={{
                  fontSize: "0.8rem",
                  color: "#64748B",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 700,
                }}
              >
                Contoh Test Cases
              </h4>
              {visibleTests.map((tc, i) => (
                <div key={tc.id} className={styles.sampleSection}>
                  <h4>
                    Test {i + 1}: {tc.title}
                  </h4>
                  {tc.input && (
                    <>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "#94A3B8",
                          marginBottom: "4px",
                        }}
                      >
                        Input:
                      </div>
                      <code>{tc.input}</code>
                    </>
                  )}
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "#94A3B8",
                      marginBottom: "4px",
                      marginTop: tc.input ? "8px" : 0,
                    }}
                  >
                    Expected Output:
                  </div>
                  <code>{tc.expected_output}</code>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right Panel: Editor + Bottom Tabs */}
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span className={styles.editorLabel}>
              {langIcon} {langLabel} Editor
            </span>
            <div className={styles.buttonGroup}>
              <button
                onClick={handleRun}
                disabled={isRunning || isSubmitting}
                className={styles.runButton}
              >
                {isRunning ? "⏳ Menjalankan..." : "▶ Jalankan"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? "⏳ Memeriksa..." : "📤 Submit"}
              </button>
              <button onClick={handleReset} className={styles.resetButton}>
                ↺ Reset
              </button>
            </div>
          </div>

          <div className={styles.editorBody}>
            <CodeEditor
              language={challenge.language === "python" ? "python" : "javascript"}
              value={code}
              onChange={setCode}
              height="100%"
            />
          </div>

          {/* Bottom Tab Bar */}
          <div className={styles.bottomTabBar}>
            <button
              className={`${styles.bottomTab} ${activeBottomTab === "console" ? styles.bottomTabActive : ""}`}
              onClick={() => setActiveBottomTab("console")}
            >
              📟 Console Output {outputError && <span style={{ color: "#f87171" }}>●</span>}
            </button>
            <button
              className={`${styles.bottomTab} ${activeBottomTab === "tests" ? styles.bottomTabActive : ""}`}
              onClick={() => setActiveBottomTab("tests")}
            >
              🧪 Test Results {testResults && <span>({testResults.totalPassed}/{testResults.totalTests})</span>}
            </button>
            <button
              className={`${styles.bottomTab} ${activeBottomTab === "hint" ? styles.bottomTabActive : ""}`}
              onClick={() => setActiveBottomTab("hint")}
            >
              💡 Petunjuk AI {hint && <span style={{ color: "#fbbf24" }}>●</span>}
            </button>
          </div>

          {/* Bottom Panel Content */}
          <div className={styles.bottomPanel}>
            {activeBottomTab === "console" && (
              <div className={styles.consolePanel}>
                <span className={styles.consoleLabel}>
                  {isRunning
                    ? "⏳ Menjalankan kode..."
                    : pyodideLoading
                      ? "📦 Memuat Python runtime..."
                      : "📟 Console Output"}
                </span>
                {outputError && (
                  <div className={styles.errorText}>{outputError}</div>
                )}
                {output && <div>{output}</div>}
                {!output && !outputError && !isRunning && (
                  <span style={{ color: "#6b7280" }}>
                    Klik &quot;Jalankan&quot; untuk melihat output kode kamu di sini...
                  </span>
                )}
              </div>
            )}

            {activeBottomTab === "tests" && (
              <div className={styles.testResultsPanel}>
                {!testResults ? (
                  <span style={{ color: "#6b7280" }}>
                    Klik &quot;Submit&quot; untuk menguji kode dengan semua test case...
                  </span>
                ) : (
                  <>
                    <div className={styles.testResultsTitle}>
                      🧪 Hasil Test Cases ({testResults.totalPassed}/{testResults.totalTests} lulus) — Skor: {testResults.score}/100
                    </div>
                    {testResults.results.map((r, i) => (
                      <div
                        key={i}
                        className={`${styles.testItem} ${r.passed ? styles.testPassed : styles.testFailed}`}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{ display: "flex", alignItems: "center", gap: "8px" }}
                          >
                            <span>{r.passed ? "✅" : "❌"}</span>
                            <strong>
                              {r.testCase.is_hidden
                                ? "Test Tersembunyi"
                                : r.testCase.title}
                            </strong>
                          </div>
                          {!r.testCase.is_hidden && !r.passed && (
                            <div className={styles.testDetails}>
                              <div>
                                <span style={{ color: "#94a3b8" }}>Diharapkan:</span>
                                <code>{r.testCase.expected_output}</code>
                              </div>
                              <div>
                                <span style={{ color: "#94a3b8" }}>Hasil kamu:</span>
                                <code>
                                  {r.error
                                    ? `Error: ${r.error}`
                                    : r.actual_output || "(kosong)"}
                                </code>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {attemptCount > 0 && testResults.score < 100 && !hint && (
                      <button
                        onClick={handleGetHint}
                        disabled={isLoadingHint}
                        className={styles.hintButton}
                      >
                        {isLoadingHint
                          ? "⏳ Meminta bantuan AI..."
                          : "💡 Minta Petunjuk (AI Hint)"}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {activeBottomTab === "hint" && (
              <div>
                {!hint ? (
                  <div>
                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "10px" }}>
                      Butuh bantuan? AI Tutor dapat menganalisis kodemu dan memberikan petunjuk tanpa memberi jawaban langsung.
                    </p>
                    <button
                      onClick={handleGetHint}
                      disabled={isLoadingHint || !testResults}
                      className={styles.hintButton}
                    >
                      {isLoadingHint
                        ? "⏳ Meminta bantuan AI..."
                        : !testResults
                          ? "Submit kode terlebih dahulu untuk mendapat hint"
                          : "💡 Minta Petunjuk (AI Hint)"}
                    </button>
                  </div>
                ) : (
                  <div className={styles.hintPanel}>
                    <div className={styles.hintTitle}>💡 Petunjuk dari AI Tutor</div>
                    <div className={styles.hintText}>{hint}</div>
                    <button
                      onClick={handleGetHint}
                      disabled={isLoadingHint}
                      style={{
                        marginTop: "10px",
                        background: "transparent",
                        border: "1px solid #D97706",
                        color: "#fcd34d",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isLoadingHint ? "⏳ Memuat..." : "🔄 Minta Petunjuk Baru"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
