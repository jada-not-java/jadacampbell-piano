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

document.querySelectorAll("[data-inquiry]").forEach((link) => {
  link.addEventListener("click", () => {
    interest.value = link.dataset.inquiry;
  });
});

form.addEventListener("submit", (event) => {
  const data = new FormData(form);
  const name = data.get("name").trim();
  const message = data.get("message").trim();
  if (!name || !message) {
    event.preventDefault();
    const field = !name ? form.elements.namedItem("name") : form.elements.namedItem("message");
    field.setCustomValidity("Please enter more than spaces.");
    field.reportValidity();
    field.addEventListener("input", () => field.setCustomValidity(""), { once: true });
  }
});
