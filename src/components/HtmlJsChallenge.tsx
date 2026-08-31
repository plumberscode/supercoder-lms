"use client";

import { useState, useRef, useCallback } from "react";
import CodeEditor from "./CodeEditor";
import styles from "./code-challenge.module.css";
import {
  submitHtmlJsSolution,
  getHtmlJsHint,
} from "@/app/lessons/html-js-actions";
import {
  createSandboxedIframe,
  executeJsInIframe,
  destroyIframe,
} from "@/lib/iframe-runner";

interface CodingChallenge {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  language: "html-js";
  starter_code: string;
  starter_html?: string;
  hints: string[];
  max_score: number;
  max_attempts?: number;
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

export default function HtmlJsChallenge({
  challenge,
  testCases,
  existingSubmission,
}: Props) {
  const initialHtml =
    existingSubmission?.data?.html || challenge.starter_html || "";
  const initialJs =
    existingSubmission?.data?.code || challenge.starter_code || "";

  const [htmlCode, setHtmlCode] = useState(initialHtml);
  const [jsCode, setJsCode] = useState(initialJs);
  const [activeTab, setActiveTab] = useState<"html" | "js">("html");
  const [output, setOutput] = useState("");
  const [outputError, setOutputError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Grading states
  const [gradeResult, setGradeResult] = useState<{
    score: number;
    feedback: string;
  } | null>(null);
  const [bestScore, setBestScore] = useState<number>(
    existingSubmission?.score || 0,
  );
  const [attemptsUsed, setAttemptsUsed] = useState<number>(
    existingSubmission?.data?.attempts?.length || 0,
  );
  const [lastSubmittedHtml, setLastSubmittedHtml] =
    useState<string>(initialHtml);
  const [lastSubmittedJs, setLastSubmittedJs] = useState<string>(initialJs);

  const [hint, setHint] = useState("");
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const currentIframeRef = useRef<HTMLIFrameElement | null>(null);

  const visibleTests = testCases.filter((tc) => !tc.is_hidden);

  const clearPreview = useCallback(() => {
    if (currentIframeRef.current) {
      destroyIframe(currentIframeRef.current);
      currentIframeRef.current = null;
    }
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");
    setOutputError(null);
    clearPreview();

    try {
      if (!previewContainerRef.current)
        throw new Error("Preview container not found");

      const iframe = await createSandboxedIframe(
        previewContainerRef.current,
        htmlCode,
        true,
      );
      currentIframeRef.current = iframe;
      setPreviewActive(true);

      // Execute JS
      const result = await executeJsInIframe(iframe, jsCode);
      setOutput(result.output);
      setOutputError(result.error);
    } catch (err: any) {
      setOutputError(err.message || "Terjadi kesalahan");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (htmlCode === lastSubmittedHtml && jsCode === lastSubmittedJs) {
      setOutputError(
        "Kode belum diubah. Silakan perbaiki kode Anda sebelum submit ulang.",
      );
      return;
    }

    setIsSubmitting(true);
    setGradeResult(null);
    setHint("");
    clearPreview();

    try {
      const result = await submitHtmlJsSolution({
        challengeId: challenge.id,
        lessonId: challenge.lesson_id,
        html: htmlCode,
        js: jsCode,
        description: challenge.description,
        maxScore: challenge.max_score,
      });

      if ("error" in result && result.error) {
        setOutputError(result.error);
        return;
      }

      setGradeResult({ score: result.score!, feedback: result.feedback! });
      setBestScore(result.bestScore!);
      setAttemptsUsed(
        typeof result.attemptsUsed === "number" && !isNaN(result.attemptsUsed)
          ? result.attemptsUsed
          : attemptsUsed + 1,
      );
      setLastSubmittedHtml(htmlCode);
      setLastSubmittedJs(jsCode);
    } catch (err: any) {
      setOutputError(err.message || "Terjadi kesalahan saat submit ke AI");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    setIsLoadingHint(true);
    try {
      const hintText = await getHtmlJsHint({
        description: challenge.description,
        studentHtml: htmlCode,
        studentJs: jsCode,
        attemptNumber: attemptsUsed,
      });
      setHint(hintText);
    } catch {
      setHint("Maaf, tidak dapat memuat hint saat ini.");
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleReset = () => {
    setHtmlCode(challenge.starter_html || "");
    setJsCode(challenge.starter_code || "");
    setOutput("");
    setOutputError(null);
    setGradeResult(null);
    setHint("");
    clearPreview();
    setPreviewActive(false);
  };

  const maxAttempts = challenge.max_attempts || 3;
  const remainingAttempts = maxAttempts - attemptsUsed;
  const isMaxedOut = attemptsUsed >= maxAttempts;

  const getScoreClass = (score: number) => {
    if (score >= 70) return "";
    if (score >= 50) return styles.scoreMid;
    return styles.scoreLow;
  };

  return (
    <div className={styles.container}>
      {existingSubmission && existingSubmission.score > 0 && (
        <div className={styles.existingScore}>
          🏆 Skor terbaik sebelumnya: {existingSubmission.score}/100
        </div>
      )}

      <div className={styles.splitLayout}>
        {/* Left Panel: Description */}
        <div className={styles.descriptionPanel}>
          <h2 className={styles.challengeTitle}>{challenge.title}</h2>
          <span
            className={`${styles.languageBadge} ${styles.languageBadgeHtmlJs}`}
          >
            🌐 HTML + JavaScript
          </span>
          <div className={styles.description}>{challenge.description}</div>
        </div>

        {/* Right Panel: Editor + Preview */}
        <div className={styles.editorPanel}>
          {/* Header with buttons */}
          <div className={styles.editorHeader}>
            <span className={styles.editorLabel}>🌐 HTML + JS Editor</span>
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
                disabled={isRunning || isSubmitting || isMaxedOut}
                className={styles.submitButton}
              >
                {isSubmitting
                  ? "⏳ Memeriksa..."
                  : isMaxedOut
                    ? "📤 Batas tercapai"
                    : `📤 Submit ke AI (sisa: ${remainingAttempts})`}
              </button>
              <button onClick={handleReset} className={styles.resetButton}>
                ↺ Reset
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${activeTab === "html" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("html")}
            >
              📄 HTML
            </button>
            <button
              className={`${styles.tab} ${activeTab === "js" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("js")}
            >
              ⚡ JavaScript
            </button>
          </div>

          {/* Editors (show/hide based on tab) */}
          <div className={styles.editorBody} style={{ display: activeTab === "html" ? "block" : "none", height: "100%" }}>
            <CodeEditor
              language="html"
              value={htmlCode}
              onChange={setHtmlCode}
              height="100%"
            />
          </div>
          <div className={styles.editorBody} style={{ display: activeTab === "js" ? "block" : "none", height: "100%" }}>
            <CodeEditor
              language="javascript"
              value={jsCode}
              onChange={setJsCode}
              height="100%"
            />
          </div>

          {/* Live Preview */}
          <div className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <span>🖥️ Preview</span>
              {previewActive && (
                <span style={{ color: "#10B981", fontSize: "0.6875rem" }}>
                  ● Live
                </span>
              )}
            </div>
            <div
              ref={previewContainerRef}
              style={{ position: "relative", minHeight: "200px" }}
            >
              {!previewActive && (
                <div className={styles.previewPlaceholder}>
                  Klik &quot;Jalankan&quot; untuk melihat preview HTML...
                </div>
              )}
            </div>
          </div>

          {/* Console Output */}
          {(output || outputError) && (
            <div
              className={styles.consolePanel}
              style={{ borderRadius: "12px", marginTop: "12px" }}
            >
              <span className={styles.consoleLabel}>📟 Console Output</span>
              {outputError && (
                <div className={styles.errorText}>{outputError}</div>
              )}
              {output && <div>{output}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Grade Result */}
      {gradeResult && (
        <div className={styles.resultPanel} style={{ marginTop: "24px" }}>
          <div
            className={`${styles.scoreDisplay} ${getScoreClass(gradeResult.score)}`}
          >
            <div className={styles.scoreValue}>{gradeResult.score}</div>
            <div className={styles.scoreLabel}>
              {gradeResult.score >= 90
                ? "🎉 Luar biasa!"
                : gradeResult.score >= 70
                  ? "👏 Bagus sekali!"
                  : gradeResult.score >= 50
                    ? "💪 Hampir benar, coba lagi!"
                    : "📚 Pelajari lagi materinya"}
            </div>
          </div>
          <div
            className={styles.feedbackPanel}
            style={{
              marginTop: "16px",
              padding: "16px",
              backgroundColor: "#F8FAFC",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#1E293B",
              }}
            >
              💬 Feedback dari AI:
            </strong>
            <div style={{ whiteSpace: "pre-wrap", color: "#334155" }}>
              {gradeResult.feedback}
            </div>
          </div>
          <div
            className={styles.attemptsInfo}
            style={{
              marginTop: "12px",
              fontSize: "0.875rem",
              color: "#64748B",
            }}
          >
            Percobaan terpakai: {attemptsUsed}/{maxAttempts}
          </div>
        </div>
      )}

      {/* Hint Section */}
      {gradeResult && gradeResult.score < 100 && !isMaxedOut && (
        <>
          {!hint && (
            <button
              onClick={handleGetHint}
              disabled={isLoadingHint}
              className={styles.hintButton}
              style={{ marginTop: "16px" }}
            >
              {isLoadingHint
                ? "⏳ Meminta bantuan AI..."
                : "💡 Minta Petunjuk (AI Hint)"}
            </button>
          )}
          {hint && (
            <div className={styles.hintPanel} style={{ marginTop: "16px" }}>
              <div className={styles.hintTitle}>💡 Petunjuk dari AI Tutor</div>
              <div className={styles.hintText}>{hint}</div>
              <button
                onClick={handleGetHint}
                disabled={isLoadingHint}
                style={{
                  marginTop: "12px",
                  background: "transparent",
                  border: "1px solid #D97706",
                  color: "#92400E",
                  padding: "6px 16px",
                  borderRadius: "6px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isLoadingHint ? "⏳ Memuat..." : "🔄 Minta Petunjuk Lagi"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Success panel */}
      {bestScore >= 70 && (
        <div
          className={styles.successPanel}
          style={{
            marginTop: "24px",
            padding: "24px",
            backgroundColor: "#F0FDF4",
            borderRadius: "8px",
            border: "1px solid #BBF7D0",
            textAlign: "center",
          }}
        >
          <span
            style={{ fontSize: "3rem", display: "block", marginBottom: "12px" }}
          >
            🎉
          </span>
          <h3 style={{ color: "#166534", marginBottom: "8px" }}>Selamat!</h3>
          <p style={{ color: "#15803D", margin: 0 }}>
            Kamu telah menyelesaikan tantangan ini dengan skor terbaik{" "}
            {bestScore}/100.
            {bestScore < 100 &&
              !isMaxedOut &&
              " Kamu masih bisa mencoba untuk skor lebih tinggi!"}
          </p>
        </div>
      )}
    </div>
  );
}
