const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = __dirname;
const bundleName = "numbers-rescue-app";
const bundleDir = path.join(root, bundleName);
const htmlFiles = ["index.html", "game.html", "visualizer.html"];
const assetFiles = ["home.css", "game.css", "game.js", "styles.css", "app.js", "sorting-algorithm-lab.html", "sort-quest-game.html"];

fs.mkdirSync(bundleDir, { recursive: true });

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), "utf8")
    .replace(/\s*<script src="\/__preview-bridge\.js"[^>]*><\/script>/, "")
    .replace(/\s*<link rel="preconnect"[^>]*>/g, "")
    .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>/g, "");
  fs.writeFileSync(path.join(bundleDir, file), html);
}

for (const file of assetFiles) {
  fs.copyFileSync(path.join(root, file), path.join(bundleDir, file));
}

fs.writeFileSync(path.join(bundleDir, "README.txt"), [
  "숫자 구조대 오프라인 앱",
  "",
  "1. 이 폴더의 index.html 파일을 Chrome, Edge, Firefox 또는 Safari에서 여세요.",
  "2. 첫 화면에서 게임 모드 또는 학습 모드를 선택하세요.",
  "3. 인터넷 연결이나 별도 설치 없이 사용할 수 있습니다.",
  ""
].join("\n"));

execFileSync("zip", ["-qr", `${bundleName}.zip`, bundleName], { cwd: root });
console.log(`Built ${bundleName}.zip with both offline modes.`);
