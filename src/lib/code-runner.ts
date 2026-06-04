export interface CodeResult {
  output: string
  error: string | null
  executionTime: number
}

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>
  }
}

let pyodideInstance: any = null
let pyodideLoading: Promise<any> | null = null

export async function runJavaScript(code: string, input?: string): Promise<CodeResult> {
  const start = performance.now()

  return new Promise((resolve) => {
    const worker = new Worker('/js-worker.js')
    const timeout = setTimeout(() => {
      worker.terminate()
      resolve({
        output: '',
        error: 'Timeout: Kode berjalan terlalu lama (maks 10 detik)',
        executionTime: performance.now() - start
      })
    }, 11000)

    worker.onmessage = (e) => {
      clearTimeout(timeout)
      worker.terminate()
      resolve({
        output: e.data.output || '',
        error: e.data.error || null,
        executionTime: performance.now() - start
      })
    }

    worker.onerror = (e) => {
      clearTimeout(timeout)
      worker.terminate()
      resolve({
        output: '',
        error: e.message || 'Worker error',
        executionTime: performance.now() - start
      })
    }

    worker.postMessage({ code, input: input || '' })
  })
}

async function loadPyodideRuntime(): Promise<any> {
  if (pyodideInstance) return pyodideInstance
  if (pyodideLoading) return pyodideLoading

  pyodideLoading = (async () => {
    // Load Pyodide script from CDN
    if (!document.querySelector('script[data-pyodide]')) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js'
        script.setAttribute('data-pyodide', 'true')
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Gagal memuat Pyodide runtime'))
        document.head.appendChild(script)
      })
    }

    pyodideInstance = await (window as any).loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'
    })
    return pyodideInstance
  })()

  return pyodideLoading
}

export async function runPython(code: string, _input?: string): Promise<CodeResult> {
  const start = performance.now()

  try {
    const pyodide = await loadPyodideRuntime()

    // Capture stdout
    pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`)

    // Execute with timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: Kode berjalan terlalu lama (maks 10 detik)')), 10000)
    )

    await Promise.race([
      (async () => {
        pyodide.runPython(code)
      })(),
      timeoutPromise
    ])

    const stdout = pyodide.runPython('sys.stdout.getvalue()') as string
    const stderr = pyodide.runPython('sys.stderr.getvalue()') as string

    return {
      output: stdout.trimEnd(),
      error: stderr ? stderr.trimEnd() : null,
      executionTime: performance.now() - start
    }
  } catch (err: any) {
    return {
      output: '',
      error: err.message || String(err),
      executionTime: performance.now() - start
    }
  }
}

export async function runCode(language: string, code: string, input?: string): Promise<CodeResult> {
  if (language === 'javascript') {
    return runJavaScript(code, input)
  } else if (language === 'python') {
    return runPython(code, input)
  }
  return { output: '', error: `Bahasa "${language}" tidak didukung`, executionTime: 0 }
}
