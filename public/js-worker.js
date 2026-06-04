// Sandboxed JavaScript execution worker
// Blocks dangerous globals and captures console output

self.onmessage = function (e) {
  const { code, input } = e.data;
  const output = [];

  // Block dangerous globals
  const blocked = [
    'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource',
    'localStorage', 'sessionStorage', 'indexedDB',
    'navigator', 'location', 'document', 'window'
  ];
  blocked.forEach(function (name) {
    try { self[name] = undefined; } catch (e) { /* ignore */ }
  });

  // Override importScripts
  self.importScripts = function () {
    throw new Error('importScripts is disabled');
  };

  // Override console.log to capture output
  const fakeConsole = {
    log: function () {
      const args = Array.prototype.slice.call(arguments);
      output.push(args.map(function (a) {
        if (typeof a === 'object') return JSON.stringify(a);
        return String(a);
      }).join(' '));
    },
    error: function () {
      const args = Array.prototype.slice.call(arguments);
      output.push('[ERROR] ' + args.map(String).join(' '));
    },
    warn: function () {
      const args = Array.prototype.slice.call(arguments);
      output.push('[WARN] ' + args.map(String).join(' '));
    }
  };

  // Auto-terminate after 10 seconds
  const timer = setTimeout(function () {
    self.postMessage({ output: output.join('\n'), error: 'Timeout: Kode berjalan terlalu lama (maks 10 detik)' });
    self.close();
  }, 10000);

  try {
    // Build sandboxed function
    const fn = new Function('console', 'input', code);
    fn(fakeConsole, input || '');
    clearTimeout(timer);
    self.postMessage({ output: output.join('\n'), error: null });
  } catch (err) {
    clearTimeout(timer);
    self.postMessage({ output: output.join('\n'), error: err.message || String(err) });
  }
};
