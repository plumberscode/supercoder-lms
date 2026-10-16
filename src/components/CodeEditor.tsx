"use client";

import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

type MonacoEditor = Parameters<OnMount>[0];

// Starter code HTML/CSS sering tersimpan dalam satu baris panjang.
// Rapikan otomatis bila ada baris yang terlalu panjang.
const LONG_LINE = 80;
function needsFormat(value: string) {
  return value.split("\n").some((line) => line.length > LONG_LINE);
}

interface Props {
  language: "python" | "javascript" | "html" | "css";
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export default function CodeEditor({
  language,
  value,
  onChange,
  readOnly = false,
  height = "400px",
}: Props) {
  const editorRef = useRef<MonacoEditor | null>(null);

  const formatIfNeeded = () => {
    const editor = editorRef.current;
    if (!editor || readOnly) return;
    if (language !== "html" && language !== "css") return;
    if (!needsFormat(editor.getValue())) return;
    editor.getAction("editor.action.formatDocument")?.run();
  };

  useEffect(() => {
    const t = setTimeout(formatIfNeeded, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, language, readOnly]);

  return (
    <div
      style={{
        borderRadius: "0",
        overflow: "hidden",
        height: height === "100%" ? "100%" : "auto",
        width: "100%",
      }}
    >
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange(val || "")}
        theme="vs-dark"
        onMount={(editor) => {
          editorRef.current = editor;
          setTimeout(formatIfNeeded, 300);
        }}
        loading={
          <div
            style={{
              height,
              backgroundColor: "#1E1E1E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6B7280",
              fontSize: "0.875rem",
              fontFamily: "monospace",
            }}
          >
            Memuat editor...
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: language === "python" ? 4 : 2,
          wordWrap: "on",
          padding: { top: 16 },
          readOnly,
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}
