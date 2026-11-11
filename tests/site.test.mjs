import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";

const root = new URL("../", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const script = await readFile(new URL("site.js", root), "utf8");
const css = await readFile(new URL("styles.css", root), "utf8");
const workflow = await readFile(new URL(".github/workflows/pages.yml", root), "utf8");

test("all local assets exist and remain repository-subpath safe", async () => {
  const paths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1]).filter((path) => !path.startsWith("#"));
  assert.ok(paths.length > 0);
  for (const path of paths) {
    assert.ok(path.startsWith("./"), `Expected a relative asset: ${path}`);
    await access(fileURLToPath(new URL(path, root)));
    const deployed = new URL(path, "https://example.test/jadacampbell-piano/");
    assert.ok(deployed.pathname.startsWith("/jadacampbell-piano/"));
  }
});

test("section links have unique, existing destinations", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "Duplicate element ID");
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.includes(id), `Missing destination: ${id}`);
  }
  for (const section of ["about", "performances", "gallery", "contact"]) {
    assert.ok(ids.includes(section));
  }
});

test("every collaboration link maps to an inquiry option", () => {
  const options = [...html.matchAll(/<option>([^<]+)<\/option>/g)].map((match) => match[1]);
  const inquiries = [...html.matchAll(/data-inquiry="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(inquiries.length, 5);
  inquiries.forEach((value) => assert.ok(options.includes(value)));
});

test("JavaScript parses and contact defaults to honest draft-only behavior", () => {
  assert.doesNotThrow(() => new Script(script));
  assert.match(script, /const CONTACT_EMAIL = ""/);
  assert.match(html, /Draft only\. This does not submit/);
  assert.match(html, /id="email-inquiry" hidden/);
  assert.doesNotMatch(html, /<iframe|action="https?:|mailto:/);
  assert.doesNotMatch(script, /\bfetch\(|XMLHttpRequest|localStorage|sessionStorage/);
});

test("accessibility and no-JavaScript affordances remain present", () => {
  assert.match(html, /<html lang="en">/);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<noscript>/);
  assert.match(html, /aria-expanded="false" aria-controls="navigation"/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /:focus-visible/);
});

test("Pages publication is manual and only public site files are packaged", () => {
  assert.match(workflow, /on:\s+workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+(push|pull_request|schedule):/m);
  assert.match(workflow, /cp index\.html styles\.css site\.js _site\//);
  assert.match(workflow, /cp -r assets _site\/assets/);
  assert.doesNotMatch(workflow, /enablement:\s*true|cp -r \./);
});
