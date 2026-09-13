import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "../dist");
const origin = "https://raoniaaa.github.io";
const base = "/Resume/";
const resumeName = "冉芸侨-1年经验-Agent开发_AI应用方向-上海.pdf";
assert.ok(existsSync(root), "Run pnpm build before check:site.");
function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}
const pages = files(root).filter((path) => path.endsWith(".html"));
let checkedLinks = 0;
let downloads = 0;
for (const path of pages) {
  const html = readFileSync(path, "utf8");
  const pageURL = new URL(base + relative(root, path), origin);
  assert.ok(!html.includes("%BASE_URL%"), "Unresolved Vite base in " + path);
  assert.ok(
    !html.includes("成都龙微"),
    "Removed experience reappeared in " + path,
  );
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(
    new Set(ids).size,
    ids.length,
    "Duplicate element id in " + path,
  );
  for (const [, rawURL] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = new URL(rawURL, pageURL);
    if (url.origin !== origin) continue;
    assert.ok(
      url.pathname.startsWith(base),
      "Link escaped Pages base: " + rawURL,
    );
    let target = resolve(
      root,
      decodeURIComponent(url.pathname.slice(base.length)),
    );
    if (url.pathname.endsWith("/")) target = resolve(target, "index.html");
    assert.ok(existsSync(target), "Missing asset/page: " + rawURL);
    if (url.hash && target.endsWith(".html")) {
      const targetHTML = readFileSync(target, "utf8");
      assert.ok(
        targetHTML.includes(
          'id="' + decodeURIComponent(url.hash.slice(1)) + '"',
        ),
        "Broken anchor: " + rawURL,
      );
    }
    checkedLinks++;
  }
  for (const [, name] of html.matchAll(/\bdownload="([^"]+)"/g)) {
    assert.equal(name, resumeName, "Download filename changed in " + path);
    downloads++;
  }
}
assert.equal(
  pages.length,
  8,
  "Expected homepage, six projects, and preview redirect.",
);
assert.equal(
  downloads,
  8,
  "Expected two homepage downloads and one per project.",
);
const main = readFileSync(resolve(root, "index.html"), "utf8");
for (const text of [
  "mailto:Raoniaaa@gmail.com",
  "tel:+8617551635652",
  "2025/07 — 2026/06",
  'id="projects"',
  'id="about"',
  'id="contact"',
  'data-motion="static"',
]) {
  assert.ok(
    main.includes(text),
    "Missing personal information or fallback: " + text,
  );
}
const resume = readFileSync(resolve(root, resumeName));
assert.ok(resume.subarray(0, 5).toString() === "%PDF-", "Invalid resume PDF.");
assert.equal(
  createHash("sha256").update(resume).digest("hex"),
  "87fcf73500307521fb80e33bd38fedef710e3841d6a94428a7f5e1d3895d5699",
  "Resume changed; verify the intended replacement before updating this check.",
);
for (const path of files(resolve(root, "assets")).filter((path) =>
  path.endsWith(".css"),
)) {
  const css = readFileSync(path, "utf8");
  for (const [, raw] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (raw.startsWith("data:")) continue;
    const url = new URL(raw, origin + base + "assets/style.css");
    if (url.origin !== origin) continue;
    assert.ok(
      url.pathname.startsWith(base),
      "CSS asset escaped Pages base: " + raw,
    );
    assert.ok(
      existsSync(
        resolve(root, decodeURIComponent(url.pathname.slice(base.length))),
      ),
      "Missing CSS asset: " + raw,
    );
  }
}
console.log(
  "Passed: " +
    pages.length +
    " pages, " +
    checkedLinks +
    " local links, " +
    downloads +
    " clean resume downloads, CSS assets and PDF integrity.",
);
