"use strict";

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
const submitButton = form.querySelector('button[type="submit"]');
const submitLabel = document.querySelector("#inquiry-submit-label");
const inquiryStatus = document.querySelector("#inquiry-status");
let submitting = false;

document.querySelectorAll("[data-inquiry]").forEach((link) => {
  link.addEventListener("click", () => {
    interest.value = link.dataset.inquiry;
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting) return;

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

  submitting = true;
  submitButton.disabled = true;
  submitLabel.textContent = "Sending...";
  form.setAttribute("aria-busy", "true");
  inquiryStatus.classList.remove("is-error");
  inquiryStatus.textContent = "Sending your inquiry...";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
      credentials: "omit",
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok || result?.ok !== true) {
      const errors = Array.isArray(result?.errors)
        ? result.errors.map((error) => error?.message).filter((message) => typeof message === "string")
        : [];
      inquiryStatus.textContent = errors.length
        ? `${errors.join(" ")} Your message has been kept.`
        : "Submission could not be confirmed. Your message has been kept. Please try again later.";
      inquiryStatus.classList.add("is-error");
      inquiryStatus.focus();
      return;
    }

    window.location.assign(new URL("./thanks.html", window.location.href).href);
  } catch (error) {
    console.error("Could not confirm Formspree submission.", error);
    inquiryStatus.textContent = "We couldn't confirm whether your inquiry was received. Your message has been kept. Please wait before retrying.";
    inquiryStatus.classList.add("is-error");
    inquiryStatus.focus();
  } finally {
    clearTimeout(timeout);
    submitting = false;
    submitButton.disabled = false;
    submitLabel.textContent = "Send inquiry";
    form.setAttribute("aria-busy", "false");
  }
});
