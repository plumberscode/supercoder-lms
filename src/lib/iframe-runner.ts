/**
 * Sandboxed iframe-based execution engine for HTML + JavaScript challenges.
 * Uses postMessage for secure communication between parent and iframe.
 */

export interface IframeRunResult {
  output: string
  error: string | null
}

export interface DomTestResult {
  result: string
  error: string | null
}

function buildSrcdoc(studentHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>body { font-family: Inter, sans-serif; margin: 16px; color: #1E293B; }</style>
</head>
<body>
${studentHtml}
<script>
const _output = [];
const _origLog = console.log;
console.log = function() {
  const args = Array.prototype.slice.call(arguments);
  _output.push(args.map(function(a) {
    if (typeof a === 'object') return JSON.stringify(a);
    return String(a);
  }).join(' '));
};
console.error = function() {
  const args = Array.prototype.slice.call(arguments);
  _output.push('[ERROR] ' + args.map(String).join(' '));
};

window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'exec-js') {
    let caughtErr = null;
    const onErr = function(ev) { 
      caughtErr = ev.message; 
    };
    window.addEventListener('error', onErr);
    
    try {
      const script = document.createElement('script');
      script.textContent = e.data.code;
      document.body.appendChild(script);
    } catch(err) {
      if (!caughtErr) caughtErr = err.message;
    }
    
    window.removeEventListener('error', onErr);
    
    parent.postMessage({ type: 'exec-result', output: _output.join('\\n'), error: caughtErr }, '*');
  }
  if (e.data && e.data.type === 'run-test') {
    try {
      var result = new Function(e.data.code)();
      parent.postMessage({ type: 'test-result', id: e.data.id, result: String(result == null ? '' : result), error: null }, '*');
    } catch(err) {
      parent.postMessage({ type: 'test-result', id: e.data.id, result: '', error: err.message }, '*');
    }
  }
});

// Signal ready
parent.postMessage({ type: 'iframe-ready' }, '*');
<\/script>
</body>
</html>`
}

/**
 * Create a sandboxed iframe, inject student HTML, and execute student JS.
 */
export function createSandboxedIframe(
  container: HTMLElement,
  studentHtml: string,
  visible: boolean = true
): Promise<HTMLIFrameElement> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.style.width = '100%'
    iframe.style.height = visible ? '100%' : '0'
    iframe.style.border = 'none'
    iframe.style.backgroundColor = 'white'
    if (!visible) {
      iframe.style.position = 'absolute'
      iframe.style.opacity = '0'
      iframe.style.pointerEvents = 'none'
    }

    const srcdoc = buildSrcdoc(studentHtml)
    iframe.setAttribute('srcdoc', srcdoc)

    const timeout = setTimeout(() => {
      reject(new Error('Iframe gagal dimuat (timeout)'))
    }, 10000)

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'iframe-ready') {
        clearTimeout(timeout)
        window.removeEventListener('message', onMessage)
        resolve(iframe)
      }
    }
    window.addEventListener('message', onMessage)

    container.appendChild(iframe)
  })
}

/**
 * Execute student JavaScript inside the sandboxed iframe.
 */
export function executeJsInIframe(
  iframe: HTMLIFrameElement,
  jsCode: string
): Promise<IframeRunResult> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ output: '', error: 'Timeout: Kode berjalan terlalu lama (maks 10 detik)' })
    }, 10000)

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'exec-result') {
        clearTimeout(timeout)
        window.removeEventListener('message', onMessage)
        resolve({
          output: e.data.output || '',
          error: e.data.error || null
        })
      }
    }
    window.addEventListener('message', onMessage)

    iframe.contentWindow?.postMessage({ type: 'exec-js', code: jsCode }, '*')
  })
}

/**
 * Run a DOM assertion test inside the iframe. The test script should
 * return a string value that will be compared to expected output.
 */
export function runDomTest(
  iframe: HTMLIFrameElement,
  testId: string,
  testScript: string
): Promise<DomTestResult> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ result: '', error: 'Timeout: Test berjalan terlalu lama' })
    }, 5000)

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'test-result' && e.data.id === testId) {
        clearTimeout(timeout)
        window.removeEventListener('message', onMessage)
        resolve({
          result: e.data.result || '',
          error: e.data.error || null
        })
      }
    }
    window.addEventListener('message', onMessage)

    iframe.contentWindow?.postMessage({
      type: 'run-test',
      id: testId,
      code: testScript
    }, '*')
  })
}

/**
 * Remove iframe from DOM and clean up.
 */
export function destroyIframe(iframe: HTMLIFrameElement): void {
  iframe.remove()
}
