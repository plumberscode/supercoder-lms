/**
 * Utility for "Soal Coding Web" live preview.
 * Combines student's HTML + CSS + JS into a single iframe srcdoc document,
 * regenerated fully on every debounce tick (same approach as buildCssPreview).
 */

export function buildWebPreview(html: string, css: string, js: string): string {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: Inter, sans-serif; margin: 16px; color: #1E293B; }
${safeCss}
</style>
</head>
<body>
${html}
<script>
window.addEventListener('error', function(e) {
  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#FEE2E2;color:#991B1B;padding:8px 12px;font:12px monospace;white-space:pre-wrap;z-index:99999;border-top:2px solid #EF4444;max-height:40%;overflow:auto;';
  el.textContent = '⚠ JS Error: ' + e.message;
  document.body.appendChild(el);
});
try {
${safeJs}
} catch (err) {
  window.dispatchEvent(new ErrorEvent('error', { message: err.message }));
}
<\/script>
</body>
</html>`;
}
