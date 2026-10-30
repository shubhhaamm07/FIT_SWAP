const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const coverage = require("../src/constants/feature-coverage.json");
const website =
  process.argv[2] || path.resolve(root, "../Client/src/routes/AppRoutes.jsx");
const missingFiles = coverage.filter(
  (row) => !fs.existsSync(path.join(root, row.nativeFile)),
);
let uncovered = [];
let websiteChecked = false;
if (fs.existsSync(website)) {
  websiteChecked = true;
  const routes = [
    ...new Set(
      [
        ...fs
          .readFileSync(website, "utf8")
          .matchAll(/path\s*=\s*["']([^"']+)/g),
      ].map((match) => match[1]),
    ),
  ];
  const mapped = new Set(coverage.map((row) => row.webRoute));
  uncovered = routes.filter((route) => !mapped.has(route));
}
console.log(
  JSON.stringify(
    {
      mappedRoutePatterns: coverage.length,
      websiteChecked,
      missingNativeFiles: missingFiles.map((row) => row.nativeFile),
      unmappedWebsiteRoutes: uncovered,
    },
    null,
    2,
  ),
);
if (missingFiles.length || uncovered.length) process.exitCode = 1;
