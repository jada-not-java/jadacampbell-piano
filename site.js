"use strict";

const CONTACT_EMAIL = document.querySelector("#contact-email").textContent.trim();

document.documentElement.classList.add("js");

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
menuToggle.hidden = false;
menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(expanded));
  navigation.classList.toggle("is-open", expanded);
});

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
}

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menuToggle.focus();
  }
});

document.querySelectorAll("[data-video-id]").forEach((container) => {
  const button = container.querySelector(".video-load");
  button.hidden = false;
  button.addEventListener("click", () => {
    const player = document.createElement("iframe");
    player.src = `https://www.youtube-nocookie.com/embed/${container.dataset.videoId}?autoplay=1&rel=0`;
    player.title = container.dataset.videoTitle;
    player.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    player.allowFullscreen = true;
    player.referrerPolicy = "strict-origin-when-cross-origin";
    container.replaceChildren(player);
    player.focus();
  }, { once: true });
});

const form = document.querySelector("#inquiry-form");
const interest = document.querySelector("#interest");
const result = document.querySelector("#inquiry-result");
const draft = document.querySelector("#inquiry-draft");
const status = document.querySelector("#draft-status");
const emailLink = document.querySelector("#email-inquiry");
form.hidden = false;

const contactEmail = CONTACT_EMAIL.trim();
const emailConfigured = /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(contactEmail);
if (contactEmail && !emailConfigured) {
  console.error("CONTACT_EMAIL must be a valid email address. Inquiry delivery is disabled.");
}
if (emailConfigured) {
  document.querySelector(".contact-notice strong").textContent = "Performance & collaboration inquiries";
  document.querySelector("#contact-availability").textContent =
    "Prepare an inquiry, then open it in your email app to review and send. This website does not send or store messages.";
}

document.querySelectorAll("[data-inquiry]").forEach((link) => {
  link.addEventListener("click", () => {
    interest.value = link.dataset.inquiry;
  });
});

function clearDraft() {
  result.hidden = true;
  draft.value = "";
  status.textContent = "";
  emailLink.hidden = true;
  emailLink.removeAttribute("href");
}
form.addEventListener("input", clearDraft);
interest.addEventListener("change", clearDraft);
document.querySelectorAll("[data-inquiry]").forEach((link) => {
  link.addEventListener("click", clearDraft);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = data.get("name").trim();
  const message = data.get("message").trim();
  if (!name || !message) {
    const field = !name ? form.elements.namedItem("name") : form.elements.namedItem("message");
    field.setCustomValidity("Please enter more than spaces.");
    field.reportValidity();
    field.addEventListener("input", () => field.setCustomValidity(""), { once: true });
    return;
  }
  const subject = `${data.get("interest")} inquiry`;
  const body = `Hello Jada,\n\n${message}\n\n${name}\n${data.get("email").trim()}`;
  draft.value = `Subject: ${subject}\n\n${body}`;
  result.hidden = false;
  status.textContent = emailConfigured
    ? "Draft prepared, not sent. Open your email app to review and send it, or copy the draft."
    : "Draft prepared, not sent. You can copy it, but a contact address is not available yet.";
  if (emailConfigured) {
    emailLink.href = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    emailLink.hidden = false;
  }
  draft.focus();
});

document.querySelector("#copy-inquiry").addEventListener("click", async () => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(draft.value);
    status.textContent = "Draft copied. Nothing has been sent.";
  } catch {
    draft.focus();
    draft.select();
    status.textContent = "Automatic copying is unavailable. The draft is selected; use your device's Copy command. Nothing has been sent.";
  }
});
