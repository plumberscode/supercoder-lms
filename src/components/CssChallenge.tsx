"use client";

import { useState, useEffect, useRef } from "react";
import CodeEditor from "./CodeEditor";
import styles from "./CssChallenge.module.css";
import { submitCssSolution, getCssHint } from "@/app/lessons/css-actions";
import { buildCssPreview } from "@/lib/css-preview";

interface CssChallenge {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  starter_html: string;
  starter_css: string;
  reference_css: string;
  max_score: number;
  max_attempts: number;
}

interface Props {
  challenge: CssChallenge;
  existingSubmission?: { score: number; data: any } | null;
}

export default function CssChallengeComponent({
  challenge,
  existingSubmission,
}: Props) {
  const [cssCode, setCssCode] = useState(
    existingSubmission?.data?.css || challenge.starter_css || "",
  );
  const [htmlCode, setHtmlCode] = useState(challenge.starter_html || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const [lastSubmittedCss, setLastSubmittedCss] = useState<string>(
    existingSubmission?.data?.css || challenge.starter_css || "",
  );
  const [outputError, setOutputError] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live preview with 300ms debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = buildCssPreview(htmlCode, cssCode);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cssCode, htmlCode, previewKey]);

  const handleSubmit = async () => {
    if (cssCode === lastSubmittedCss) {
      setOutputError(
        "Kode belum diubah. Silakan perbaiki CSS Anda sebelum submit ulang.",
      );
      return;
    }

    setIsSubmitting(true);
    setGradeResult(null);
    setHint("");
    setOutputError(null);

    try {
      const result = await submitCssSolution({
        challengeId: challenge.id,
        lessonId: challenge.lesson_id,
        css: cssCode,
        starterHtml: htmlCode,
        referenceCss: challenge.reference_css,
        description: challenge.description,
        maxScore: challenge.max_score,
      });

      if ("error" in result && result.error) {
        setGradeResult({ score: 0, feedback: result.error });
        return;
      }

      setGradeResult({ score: result.score!, feedback: result.feedback! });
      setBestScore(result.bestScore!);
      setAttemptsUsed(
        typeof result.attemptsUsed === "number" && !isNaN(result.attemptsUsed)
          ? result.attemptsUsed
          : attemptsUsed + 1,
      );
      setLastSubmittedCss(cssCode);
    } catch (err: any) {
      setGradeResult({
        score: 0,
        feedback: err.message || "Terjadi kesalahan saat menilai.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    setIsLoadingHint(true);
    try {
      const hintText = await getCssHint({
        description: challenge.description,
        studentCss: cssCode,
        referenceCss: challenge.reference_css,
        starterHtml: htmlCode,
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
    setCssCode(challenge.starter_css || "");
    setHtmlCode(challenge.starter_html || "");
    setOutputError(null);
    setGradeResult(null);
    setHint("");
    setPreviewKey((prev) => prev + 1);
  };

  const remainingAttempts = challenge.max_attempts - attemptsUsed;
  const isMaxedOut = attemptsUsed >= challenge.max_attempts;

  const getScoreClass = (score: number) => {
    if (score >= 70) return "";
    if (score >= 50) return styles.scoreMid;
    return styles.scoreLow;
  };

  const [activeTab, setActiveTab] = useState<"css" | "html">("css");

  return (
    <div className={styles.container}>
      {/* Existing best score banner */}
      {existingSubmission && existingSubmission.score > 0 && (
        <div className={styles.existingScore}>
          🏆 Skor terbaik sebelumnya: {existingSubmission.score}/100
        </div>
      )}

      <div className={styles.splitLayout}>
        {/* Left: Description, Hints & Feedback Panel */}
        <div className={styles.descriptionPanel}>
          <h2 className={styles.challengeTitle}>{challenge.title}</h2>
          <span className={styles.languageBadge}>🎨 CSS Challenge</span>
          <div className={styles.description}>{challenge.description}</div>

          {outputError && (
            <div
              style={{
                color: "#EF4444",
                backgroundColor: "#FEF2F2",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #FCA5A5",
                marginBottom: "16px",
                fontSize: "0.8rem",
              }}
            >
              ⚠️ {outputError}
            </div>
          )}

          {/* Grade Result */}
          {gradeResult && (
            <div className={styles.resultPanel}>
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
              <div className={styles.feedbackPanel}>
                <strong
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#1E293B",
                  }}
                >
                  💬 Feedback dari AI:
                </strong>
                {gradeResult.feedback}
              </div>
              <div className={styles.attemptsInfo}>
                Percobaan terpakai: {attemptsUsed}/{challenge.max_attempts}
              </div>
            </div>
          )}

          {/* Hint section */}
          {gradeResult && gradeResult.score < 100 && !isMaxedOut && (
            <>
              {!hint && (
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
              {hint && (
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
                      color: "#92400E",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
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
            <div className={styles.successPanel} style={{ marginTop: "16px", padding: "16px" }}>
              <span
                style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}
              >
                🎉
              </span>
              <h3 style={{ color: "#166534", marginBottom: "6px", fontSize: "1rem" }}>Selamat!</h3>
              <p style={{ color: "#15803D", margin: 0, fontSize: "0.8rem" }}>
                Kamu telah menyelesaikan CSS Challenge ini dengan skor terbaik{" "}
                {bestScore}/100.
                {bestScore < 100 &&
                  !isMaxedOut &&
                  " Kamu masih bisa mencoba untuk skor lebih tinggi!"}
              </p>
            </div>
          )}
        </div>

        {/* Right: Editor + Live Preview */}
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <div className={styles.tabBar}>
              <button
                className={`${styles.tab} ${activeTab === "css" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("css")}
              >
                🎨 CSS Editor
              </button>
              <button
                className={`${styles.tab} ${activeTab === "html" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("html")}
              >
                📄 HTML Editor
              </button>
            </div>

            <div className={styles.buttonGroup}>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isMaxedOut}
                className={styles.submitButton}
              >
                {isSubmitting
                  ? "⏳ Memeriksa..."
                  : isMaxedOut
                    ? "📤 Batas tercapai"
                    : `📤 Submit ke AI (${remainingAttempts}x)`}
              </button>
              <button onClick={handleReset} className={styles.resetButton}>
                ↺ Reset
              </button>
            </div>
          </div>

          <div className={styles.editorBody}>
            {activeTab === "css" ? (
              <CodeEditor
                language="css"
                value={cssCode}
                onChange={setCssCode}
                height="100%"
              />
            ) : (
              <CodeEditor
                language="html"
                value={htmlCode}
                onChange={setHtmlCode}
                height="100%"
              />
            )}
          </div>

          {/* Live Preview */}
          <div className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <span>🖥️ Live Preview</span>
              <span style={{ color: "#10B981", fontSize: "0.6875rem" }}>
                ● Live
              </span>
            </div>
            <iframe
              ref={iframeRef}
              className={styles.previewIframe}
              srcDoc={buildCssPreview(htmlCode, cssCode)}
              title="CSS Preview"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
