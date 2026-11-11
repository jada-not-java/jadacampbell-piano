# Jada Campbell | Classical Pianist

A responsive, dependency-free artist website, built with HTML, CSS, and a little
JavaScript. No build step, custom backend, analytics, or remote fonts. YouTube players
load only after a visitor chooses Play; no third-party media requests are made on
initial page load. All artwork is original decorative SVG/CSS, not an artist photograph.

## Preview locally

Open `index.html` in a browser. For an HTTP preview, if Python is installed:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000`. Stop the server with Ctrl+C.

## Replace the placeholder content

The visible content lives in `index.html`; visual styles live in `styles.css`.
Search for the section IDs `about`, `performances`, `gallery`, and `contact`.

- **Name and biography:** update the name, page title, description, header, hero,
  footer, and biography together. The current bio is explicitly a placeholder,
  with no invented education, awards, affiliations, or performance history.
- **Portrait:** replace `.portrait-placeholder` with an `<img>` pointing to an
  image in `assets`. Supply descriptive `alt`, intrinsic `width` and `height`,
  and responsive styling. Remove the "Photograph to come" caption.
- **Gallery:** replace each `.gallery-placeholder` with an actual image. Use
  `loading="lazy"`, meaningful alt text, image dimensions, and factual captions.
  Add image credits or permission notices where required. Keep file sizes modest.
- **Videos:** the performance section includes Jada's solo YouTube channel,
  Rachmaninoff's Piano Concerto No. 2, Gershwin's Rhapsody in Blue, and the Redmond
  Tech Orchestra interview. To replace a video, update its `data-video-id`,
  `data-video-title`, Play button's `aria-label`, visible title, and direct YouTube
  link together. The ID is the part after `v=` in a YouTube watch URL. The players
  use YouTube's privacy-enhanced domain and connect only after Play is selected.
  YouTube may process visitor data once a player loads. Direct links work without
  JavaScript and remain available if playback is blocked. Local `file://` previews
  may be rejected by YouTube because no HTTP referrer is available; use the local
  HTTP server above or the direct links instead.
- **Contact:** the `#contact-email` link in `index.html` holds the public contact
  address. To change it, update both its visible address and `mailto:` destination.
  The contact form uses the **Basic HTML Formspree integration**: a native POST to
  `https://formspree.io/f/mljbrneo`. It works on GitHub Pages without JavaScript,
  an SDK, a build step, or a custom backend. The form submits `name`, `email`,
  `interest`, `message`, and an inbox `_subject`. Formspree handles processing,
  spam checks, and the next page's submission status; this site never displays
  an unverified success message. Visitors' details are shared with Formspree only
  when they submit, as disclosed beside the Send button. To use a different form,
  change the `action` in `index.html` and the endpoint assertion in the tests.
  Manage notification recipients and any domain restrictions in Formspree, not in
  the public site code. The direct email link is an independent fallback.
- **Hero illustration:** `assets/piano.svg` is original decorative artwork and
  can remain, or be replaced with a licensed photograph and appropriate alt text.

All asset URLs are relative (`./assets/...`), so the site works both locally and
under the GitHub Pages repository subpath `/jadacampbell-piano/`. Do not replace
them with root-relative URLs such as `/styles.css`.

The site remains readable and navigable without JavaScript, including native
contact-form submission and direct video links. No browser storage is used.

## GitHub Pages (when ready, not enabled by this project)

The included `.github/workflows/pages.yml` is **manual-only**. Pushing code does
not trigger publication. No Pages settings have been enabled by this implementation.

After you decide to publish:

1. Push the finished site and workflow to the repository's `main` branch.
2. In repository **Settings > Pages**, choose **GitHub Actions** as the source.
3. In **Actions > Deploy artist website to GitHub Pages**, choose **Run workflow**
   on `main`. Approve the `github-pages` environment deployment if prompted.
4. Visit `https://jada-not-java.github.io/jadacampbell-piano/`.

The workflow uploads only `index.html`, `styles.css`, `site.js`, and `assets`,
not development files or this README. Future updates require another manual run.
No deployment command or workflow run is needed for local development.

## Checks before publishing

Run the dependency-free structural checks with Node.js 18 or newer:

```powershell
node --test
```

These check asset paths, section links, inquiry categories, accessibility
affordances, JavaScript syntax, Formspree configuration, and manual deployment.
They do not replace the browser checks below.

Check at mobile and desktop widths; keyboard navigation, visible focus, menu
toggle and Escape behavior; all section links; required and email field
validation; inquiry selection links; the Formspree field payload; and the direct
email link. A real submission sends an actual inquiry: use intentional test
content only when ready, then verify the Formspree dashboard and notification
email. Structural checks do not prove inbox delivery. Ensure there are no missing assets or
horizontal overflow. Respect reduced-motion preferences and keep all placeholder
labels until real content replaces them.
