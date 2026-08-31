/**
 * Utility for CSS Challenge live preview.
 * Combines teacher's HTML template with student's CSS into an iframe srcdoc.
 */

export function buildCssPreview(html: string, css: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: Inter, sans-serif; margin: 16px; color: #1E293B; }
${css}
</style>
</head>
<body>
${html}
</body>
</html>`;
}
