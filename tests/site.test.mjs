import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";

const root = new URL("../", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const thanks = await readFile(new URL("thanks.html", root), "utf8");
const script = await readFile(new URL("site.js", root), "utf8");
const css = await readFile(new URL("styles.css", root), "utf8");
const workflow = await readFile(new URL(".github/workflows/pages.yml", root), "utf8");

test("all local assets exist and remain repository-subpath safe", async () => {
  const paths = [...(html + thanks).matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1]).filter((path) => !/^(#|https:\/\/|mailto:)/.test(path));
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

test("provided performances, interview and solo channel are available without JavaScript", () => {
  assert.match(html, /href="https:\/\/www\.youtube\.com\/@jadacampbell5229"/);
  const expectedVideos = ["Amu5UD6Q9bg", "URhVBis8MXo", "ChPC1qFlqUM"];
  const videoIds = [...html.matchAll(/data-video-id="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(videoIds, expectedVideos);
  for (const id of expectedVideos) {
    assert.ok(html.includes(`href="https://www.youtube.com/watch?v=${id}"`));
  }
  const buttons = [...html.matchAll(/<button class="video-load"([^>]+)>/g)];
  assert.equal(buttons.length, 3);
  buttons.forEach(([, attributes]) => {
    assert.match(attributes, /aria-label="Play [^"]+"/);
    assert.match(attributes, /\bhidden\b/);
  });
  assert.match(script, /https:\/\/www\.youtube-nocookie\.com\/embed\//);
  assert.match(script, /player\.title = container\.dataset\.videoTitle/);
  assert.match(script, /player\.referrerPolicy = "strict-origin-when-cross-origin"/);
});

test("contact posts the inquiry to Formspree without JavaScript and keeps direct email", () => {
  assert.doesNotThrow(() => new Script(script));
  const contact = html.match(/id="contact-email" href="mailto:([^"]+)">([^<]+)<\/a>/);
  assert.ok(contact, "A direct email link must work without JavaScript");
  assert.equal(contact[1], contact[2], "Displayed address must match the email destination");
  assert.match(contact[1], /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  const form = html.match(/<form\b([^>]+)>([\s\S]*?)<\/form>/);
  assert.ok(form);
  assert.match(form[1], /action="https:\/\/formspree\.io\/f\/mljbrneo"/);
  assert.match(form[1], /method="POST"/);
  assert.doesNotMatch(form[1], /\bhidden\b/);
  assert.match(form[1], /aria-describedby="inquiry-privacy"/);
  assert.match(form[2], /name="_subject" value="New performance inquiry for Jada Campbell"/);
  for (const field of ["name", "email", "message"]) {
    assert.match(form[2], new RegExp(`<(?:input|textarea)\\b[^>]*name="${field}"[^>]*\\brequired\\b`));
  }
  assert.match(form[2], /type="email"/);
  assert.match(form[2], /<select id="interest" name="interest">/);
  assert.match(form[2], /Send inquiry/);
  assert.match(form[2], /sent to Formspree/);
  assert.doesNotMatch(html, /inquiry-draft|inquiry-result|copy-inquiry|Prepare inquiry|Draft only/);
  assert.doesNotMatch(script, /clearDraft|CONTACT_EMAIL|draft\.value/);
  assert.match(script, /headers: \{ Accept: "application\/json" \}/);
  assert.doesNotMatch(script, /XMLHttpRequest|localStorage|sessionStorage/);
});

test("thank-you page and redirect stay inside the repository subpath", () => {
  assert.match(script, /new URL\("\.\/thanks\.html", window\.location\.href\)/);
  assert.match(thanks, /<meta name="robots" content="noindex">/);
  assert.equal([...thanks.matchAll(/<h1\b/g)].length, 1);
  assert.match(thanks, /Your inquiry has been submitted/);
  assert.match(thanks, /href="\.\/index\.html"/);
  assert.doesNotMatch(thanks, /<script/);
  assert.equal(
    new URL("./thanks.html", "https://example.test/jadacampbell-piano/index.html#contact").pathname,
    "/jadacampbell-piano/thanks.html",
  );
});

test("accessibility and no-JavaScript affordances remain present", () => {
  assert.match(html, /<html lang="en">/);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-expanded="false" aria-controls="navigation"/);
  assert.match(html, /id="inquiry-privacy"/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /:focus-visible/);
});

test("dark theme preserves readable text, gold accents, and visible form borders", () => {
  const palette = Object.fromEntries([...css.matchAll(/--([\w-]+): (#[\da-f]{6});/g)]
    .map(([, name, value]) => [name, value]));
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/../g).map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const contrast = (foreground, background) => {
    const values = [luminance(palette[foreground]), luminance(palette[background])];
    return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
  };
  assert.match(css, /color-scheme: dark/);
  for (const background of ["background", "surface", "green"]) {
    for (const foreground of ["ink", "muted", "gold"]) {
      assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
    }
  }
  assert.ok(contrast("green-deep", "gold") >= 4.5, "Gold button text");
  assert.ok(contrast("field-border", "surface") >= 3, "Form border against field");
  assert.ok(contrast("field-border", "background") >= 3, "Form border against page");
  for (const page of [html, thanks]) {
    assert.ok(page.includes(`<meta name="theme-color" content="${palette.background}">`));
  }
});

test("Pages publication is manual and only public site files are packaged", () => {
  assert.match(workflow, /on:\s+workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+(push|pull_request|schedule):/m);
  assert.match(workflow, /cp index\.html thanks\.html styles\.css site\.js _site\//);
  assert.match(workflow, /cp -r assets _site\/assets/);
  assert.doesNotMatch(workflow, /enablement:\s*true|cp -r \./);
});
