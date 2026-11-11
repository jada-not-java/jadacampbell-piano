import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../site.js", import.meta.url), "utf8");

class Element {
  constructor(value = "") {
    this.value = value;
    this.textContent = "";
    this.attributes = new Map();
    this.listeners = new Map();
    this.classes = new Set();
    this.classList = {
      add: (value) => this.classes.add(value),
      remove: (value) => this.classes.delete(value),
    };
  }
  addEventListener(type, callback, options) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push({ callback, once: options?.once });
    this.listeners.set(type, listeners);
  }
  async emit(type, event) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      await listener.callback(event);
      if (listener.once) {
        this.listeners.set(type, this.listeners.get(type).filter((item) => item !== listener));
      }
    }
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  setCustomValidity(message) { this.validationMessage = message; }
  reportValidity() { this.validityReported = true; }
  focus() { this.focused = true; }
}

function setup(respond = async () => ({ ok: true, json: async () => ({ ok: true }) })) {
  const fields = {
    name: new Element("Test Organizer"),
    email: new Element("organizer@example.com"),
    interest: new Element("Chamber music"),
    message: new Element("A project with an ampersand & a question?"),
    _subject: new Element("New performance inquiry for Jada Campbell"),
  };
  const form = new Element();
  const button = new Element();
  const label = new Element();
  const status = new Element();
  const selectors = {
    ".menu-toggle": new Element(),
    "#navigation": new Element(),
    "#inquiry-form": form,
    "#interest": fields.interest,
    "#inquiry-submit-label": label,
    "#inquiry-status": status,
  };
  form.action = "https://formspree.io/f/mljbrneo";
  form.elements = { namedItem: (name) => fields[name] };
  form.querySelector = () => button;
  const document = new Element();
  document.documentElement = new Element();
  document.querySelector = (selector) => selectors[selector];
  document.querySelectorAll = () => [];
  const requests = [];
  const redirects = [];
  const clock = {};
  const logs = [];
  runInNewContext(source, {
    document,
    FormData: function () {
      const data = new FormData();
      Object.entries(fields).forEach(([name, field]) => data.set(name, field.value));
      return data;
    },
    fetch: (url, options) => {
      requests.push({ url, options });
      return respond(url, options);
    },
    window: {
      location: {
        href: "https://example.test/jadacampbell-piano/index.html#contact",
        assign: (url) => redirects.push(url),
      },
    },
    URL,
    AbortController,
    setTimeout: (callback, delay) => {
      clock.callback = callback;
      clock.delay = delay;
      return 1;
    },
    clearTimeout: () => { clock.cleared = true; },
    console: { error: (...args) => logs.push(args) },
  });
  const submit = () => {
    const event = { preventDefault() { this.defaultPrevented = true; } };
    return form.emit("submit", event);
  };
  return { fields, form, button, label, status, requests, redirects, clock, logs, submit };
}

test("accepted inquiry posts all fields and redirects inside the Pages subpath", async () => {
  const app = setup();
  await app.submit();
  assert.equal(app.requests.length, 1);
  const { url, options } = app.requests[0];
  assert.equal(url, "https://formspree.io/f/mljbrneo");
  assert.equal(options.method, "POST");
  assert.equal(options.headers.Accept, "application/json");
  assert.equal(options.credentials, "omit");
  for (const [name, field] of Object.entries(app.fields)) {
    assert.equal(options.body.get(name), field.value);
  }
  assert.deepEqual(app.redirects, ["https://example.test/jadacampbell-piano/thanks.html"]);
  assert.equal(app.clock.cleared, true);
  assert.equal(app.button.disabled, false);
});

test("pending request blocks repeat submission and shows an accessible sending state", async () => {
  let resolveResponse;
  const app = setup(() => new Promise((resolve) => { resolveResponse = resolve; }));
  const pending = app.submit();
  assert.equal(app.button.disabled, true);
  assert.equal(app.label.textContent, "Sending...");
  assert.equal(app.form.attributes.get("aria-busy"), "true");
  await app.submit();
  assert.equal(app.requests.length, 1);
  resolveResponse({ ok: true, json: async () => ({ ok: true }) });
  await pending;
  assert.equal(app.form.attributes.get("aria-busy"), "false");
});

test("Formspree rejection preserves the message and safely exposes server errors", async () => {
  const app = setup(async () => ({
    ok: false,
    json: async () => ({ errors: [{ message: "Please verify your email." }, { message: "<b>Server text</b>" }] }),
  }));
  await app.submit();
  assert.deepEqual(app.redirects, []);
  assert.match(app.status.textContent, /Please verify your email/);
  assert.match(app.status.textContent, /<b>Server text<\/b>/);
  assert.match(app.status.textContent, /message has been kept/);
  assert.equal(app.status.classes.has("is-error"), true);
  assert.equal(app.status.focused, true);
  assert.equal(app.fields.message.value, "A project with an ampersand & a question?");
  assert.equal(app.button.disabled, false);
});

test("HTTP success without explicit Formspree acceptance does not redirect", async () => {
  const app = setup(async () => ({ ok: true, json: async () => ({}) }));
  await app.submit();
  assert.deepEqual(app.redirects, []);
  assert.match(app.status.textContent, /could not be confirmed/);
});

test("network and malformed JSON failures are visible and never imply success", async () => {
  for (const respond of [
    async () => { throw new Error("offline"); },
    async () => ({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } }),
  ]) {
    const app = setup(respond);
    await app.submit();
    assert.deepEqual(app.redirects, []);
    assert.match(app.status.textContent, /couldn't confirm whether/);
    assert.equal(app.logs.length, 1);
    assert.equal(app.button.disabled, false);
    assert.equal(app.label.textContent, "Send inquiry");
    assert.equal(app.clock.cleared, true);
  }
});

test("timeout aborts without redirecting or automatically retrying", async () => {
  const app = setup((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")));
  }));
  const pending = app.submit();
  assert.equal(app.clock.delay, 30000);
  app.clock.callback();
  await pending;
  assert.equal(app.requests.length, 1);
  assert.deepEqual(app.redirects, []);
  assert.match(app.status.textContent, /Please wait before retrying/);
  assert.equal(app.button.disabled, false);
});

test("whitespace validation blocks requests and recovers when the field is edited", async () => {
  const app = setup();
  app.fields.name.value = "   ";
  await app.submit();
  assert.equal(app.requests.length, 0);
  assert.equal(app.fields.name.validationMessage, "Please enter more than spaces.");
  assert.equal(app.fields.name.validityReported, true);
  app.fields.name.value = "Test Organizer";
  await app.fields.name.emit("input");
  assert.equal(app.fields.name.validationMessage, "");
  await app.submit();
  assert.equal(app.redirects.length, 1);
});

test("visitor can retry after a rejected request without losing the message", async () => {
  let count = 0;
  const app = setup(async () => {
    count += 1;
    return count === 1
      ? { ok: false, json: async () => ({ errors: [{ message: "Try again later." }] }) }
      : { ok: true, json: async () => ({ ok: true }) };
  });
  await app.submit();
  await app.submit();
  assert.equal(app.requests.length, 2);
  assert.equal(app.status.classes.has("is-error"), false);
  assert.equal(app.redirects.length, 1);
  assert.equal(app.requests[1].options.body.get("message"), app.fields.message.value);
});
