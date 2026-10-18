const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
let html = fs.readFileSync(path.join(root, "game.html"), "utf8");
const css = fs.readFileSync(path.join(root, "game.css"), "utf8");
const js = fs.readFileSync(path.join(root, "game.js"), "utf8");

if (js.toLowerCase().includes("</script")) throw new Error("Game script contains an unescaped closing script tag.");

html = html
  .replace(/\s*<script src="\/__preview-bridge\.js"[^>]*><\/script>/, "")
  .replace(/\s*<link rel="preconnect"[^>]*>/g, "")
  .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>/g, "")
  .replace(/\s*<link rel="stylesheet" href="game\.css">/, `\n  <style>\n${css}\n  </style>`)
  .replace(/\s*<script src="game\.js" defer><\/script>/, "")
  .replace('<a class="brand" href="index.html" aria-label="학습 모드 선택으로 돌아가기">', '<a class="brand" href="#top" aria-label="숫자 구조대 처음으로">')
  .replace(/\s*<a class="mode-home-link"[^>]*>[\s\S]*?<\/a>/, "")
  .replace(/\s*<a class="study-link"[^>]*>[\s\S]*?<\/a>/, "")
  .replace(/\s*<a class="game-download"[^>]*>[\s\S]*?<\/a>/, "")
  .replace("</body>", `  <script>\n${js}\n  </script>\n</body>`);

fs.writeFileSync(path.join(root, "sort-quest-game.html"), html);
console.log("Built sort-quest-game.html for offline play.");
