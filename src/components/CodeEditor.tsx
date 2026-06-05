'use client'

import Editor from '@monaco-editor/react'

interface Props {
  language: 'python' | 'javascript' | 'html' | 'css'
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  height?: string
}

export default function CodeEditor({ language, value, onChange, readOnly = false, height = '400px' }: Props) {
  return (
    <div style={{ borderRadius: '0', overflow: 'hidden' }}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange(val || '')}
        theme="vs-dark"
        loading={
          <div style={{
            height,
            backgroundColor: '#1E1E1E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}>
            Memuat editor...
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: language === 'python' ? 4 : 2,
          wordWrap: 'on',
          padding: { top: 16 },
          readOnly,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  )
}
