"use client";

import { useState, useEffect, useRef } from "react";
import CodeEditor from "./CodeEditor";
import styles from "./WebChallenge.module.css";
import {
  submitWebChallengeSolution,
  getWebChallengeHint,
} from "@/app/lessons/web-challenge-actions";
import { buildWebPreview } from "@/lib/web-preview";

type WebMode = "html" | "html-css" | "html-css-js";

interface WebChallengeData {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  mode: WebMode;
  starter_html: string;
  starter_css: string;
  starter_js: string;
  reference_html: string;
  reference_css: string;
  reference_js: string;
  max_score: number;
  max_attempts: number;
}

interface Props {
  challenge: WebChallengeData;
  existingSubmission?: { score: number; data: any } | null;
}

export default function WebChallenge({ challenge, existingSubmission }: Props) {
  const includeCss = challenge.mode === "html-css" || challenge.mode === "html-css-js";
  const includeJs = challenge.mode === "html-css-js";

  const initialHtml =
    existingSubmission?.data?.html || challenge.starter_html || "";
  const initialCss =
    existingSubmission?.data?.css || challenge.starter_css || "";
  const initialJs = existingSubmission?.data?.js || challenge.starter_js || "";

  const [htmlCode, setHtmlCode] = useState(initialHtml);
  const [cssCode, setCssCode] = useState(initialCss);
  const [jsCode, setJsCode] = useState(initialJs);

  const tabs: { key: "html" | "css" | "js"; label: string }[] = [
    { key: "html", label: "📄 HTML" },
    ...(includeCss ? [{ key: "css" as const, label: "🎨 CSS" }] : []),
    ...(includeJs ? [{ key: "js" as const, label: "⚡ JavaScript" }] : []),
  ];
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");

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
  const [lastSubmittedHtml, setLastSubmittedHtml] = useState<string>(initialHtml);
  const [lastSubmittedCss, setLastSubmittedCss] = useState<string>(initialCss);
  const [lastSubmittedJs, setLastSubmittedJs] = useState<string>(initialJs);
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
        iframeRef.current.srcdoc = buildWebPreview(
          htmlCode,
          includeCss ? cssCode : "",
          includeJs ? jsCode : "",
        );
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [htmlCode, cssCode, jsCode, includeCss, includeJs, previewKey]);

  const handleSubmit = async () => {
    if (
      htmlCode === lastSubmittedHtml &&
      cssCode === lastSubmittedCss &&
      jsCode === lastSubmittedJs
    ) {
      setOutputError(
        "Kode belum diubah. Silakan perbaiki kode Anda sebelum submit ulang.",
      );
      return;
    }

    setIsSubmitting(true);
    setGradeResult(null);
    setHint("");
    setOutputError(null);

    try {
      const result = await submitWebChallengeSolution({
        challengeId: challenge.id,
        lessonId: challenge.lesson_id,
        mode: challenge.mode,
        html: htmlCode,
        css: includeCss ? cssCode : "",
        js: includeJs ? jsCode : "",
        referenceHtml: challenge.reference_html,
        referenceCss: challenge.reference_css,
        referenceJs: challenge.reference_js,
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
      setLastSubmittedHtml(htmlCode);
      setLastSubmittedCss(cssCode);
      setLastSubmittedJs(jsCode);
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
      const hintText = await getWebChallengeHint({
        description: challenge.description,
        mode: challenge.mode,
        studentHtml: htmlCode,
        studentCss: cssCode,
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
    setCssCode(challenge.starter_css || "");
    setJsCode(challenge.starter_js || "");
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

  const modeLabel =
    challenge.mode === "html"
      ? "🕸️ HTML"
      : challenge.mode === "html-css"
        ? "🕸️ HTML + CSS"
        : "🕸️ HTML + CSS + JS";

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
          <span className={styles.languageBadge}>{modeLabel}</span>
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
                Kamu telah menyelesaikan soal ini dengan skor terbaik{" "}
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
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
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
            {activeTab === "html" && (
              <CodeEditor
                language="html"
                value={htmlCode}
                onChange={setHtmlCode}
                height="100%"
              />
            )}
            {activeTab === "css" && includeCss && (
              <CodeEditor
                language="css"
                value={cssCode}
                onChange={setCssCode}
                height="100%"
              />
            )}
            {activeTab === "js" && includeJs && (
              <CodeEditor
                language="javascript"
                value={jsCode}
                onChange={setJsCode}
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
              srcDoc={buildWebPreview(
                htmlCode,
                includeCss ? cssCode : "",
                includeJs ? jsCode : "",
              )}
              title="Web Preview"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
