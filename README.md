# Jada Campbell | Classical Pianist

A responsive, dependency-free artist website, built with HTML, CSS, and a little
JavaScript. No build step, backend, analytics, remote fonts, or third-party media
requests. All artwork is original decorative SVG/CSS, not an artist photograph.

## Preview locally

Open `index.html` in a browser. For an HTTP preview, if Python is installed:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000`. Stop the server with Ctrl+C. A local HTTP server
also gives more reliable clipboard support than opening a file directly.

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
- **Videos:** replace the decorative `.video-placeholder` blocks with links to
  your own recordings, or poster images linked to those recordings. Update the
  titles, categories, and availability notes. A descriptive link such as
  "Watch [composer and piece] on YouTube" is preferable to an unlabeled play icon.
  Links preserve the current no-third-party-requests-until-click behavior.
- **Contact:** set `CONTACT_EMAIL` in `site.js` to a real address you are comfortable
  publishing. Leave it empty until ready. The inquiry tool generates a local
  draft; it never submits, sends, or stores a message. With an address configured,
  it offers a `mailto:` link that opens the visitor's email application for review
  and manual sending. It does not claim delivery. Long drafts may exceed an email
  application's link limit; the copy-draft option remains available.
- **Hero illustration:** `assets/piano.svg` is original decorative artwork and
  can remain, or be replaced with a licensed photograph and appropriate alt text.

All asset URLs are relative (`./assets/...`), so the site works both locally and
under the GitHub Pages repository subpath `/jadacampbell-piano/`. Do not replace
them with root-relative URLs such as `/styles.css`.

The site remains readable and navigable without JavaScript. The draft tool is
progressively enabled; without JavaScript visitors see an explicit contact notice.
No browser storage is used. Drafts remain in page memory until navigation/reload.

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
affordances, JavaScript syntax, draft-only defaults, and manual deployment.
They do not replace the browser checks below.

Check at mobile and desktop widths; keyboard navigation, visible focus, menu
toggle and Escape behavior; all section links; required and email field
validation; inquiry selection links; preparing and copying drafts; and the
configured email link (if enabled). Ensure there are no missing assets or
horizontal overflow. Respect reduced-motion preferences and keep all placeholder
labels until real content replaces them.
