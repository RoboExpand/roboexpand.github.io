# RoboExpand Project Website

Project page for **RoboExpand: A Real2Sim2Real Data Engine with Agentic Reconstruction and Multi-View Video Generation**.

- Website: [roboexpand.github.io](https://roboexpand.github.io/)
- Code: [RoboExpand/RoboExpand](https://github.com/RoboExpand/RoboExpand)

The site presents the pipeline, reconstructed assets, trajectory generalization, multi-view video transfer, generated training data, and real-world policy rollouts. arXiv, Hugging Face model links, and BibTeX will be added when available.

## Repository

```text
index.html        Project information, figures, and section structure
styles.css        Desktop layout and visual styles
script.js         Resource links, media configuration, video carousels
assets/           Only the images and videos used by the live site
scripts/          Local preview, packaging, and optional media preparation
.nojekyll         Serve the static site directly through GitHub Pages
```

The website has no frontend dependencies, build step, external fonts, or CDN requirements. The published media includes 37 selected videos; only visible players load and autoplay. Physical rollouts use policies trained on RoboExpand-generated data, with one successful example per available task and scene.

## Local preview

With Node.js installed:

```sh
node scripts/serve.mjs
```

Open [localhost:8000](http://127.0.0.1:8000). The preview server supports HTTP Range requests for video seeking.

## Maintenance

- Edit project text and section structure in `index.html`.
- Set publication and model URLs in `PROJECT_LINKS` in `script.js`.
- Update the selected examples through `TASKS`, `EVALUATIONS`, `GENERATED_DATA`, and `ROLLOUTS` in `script.js`.
- Keep only referenced website files under `assets/`.

Original and unused source media are preserved locally under `work/source-assets/`, outside Git. Media preparation scripts resolve inputs from either `assets/` or that local archive. To regenerate derived media, restore the source collection and install the optional Python dependencies in `scripts/requirements-media.txt`:

```sh
python scripts/prepare_media.py
```

`prepare_rollouts.py` rebuilds selected physical videos and review strips; `prepare_logos.py` normalizes institution logos. Rendering the original RUC EPS requires Ghostscript (`rungs` in TeX Live). Media preparation is optional for previewing or deploying this repository.

## GitHub Pages

The site is published from the root of the `main` branch. Push approved changes to `main`; the repository's existing **pages build and deployment** workflow publishes them automatically.

To prepare a separate static package:

```sh
node scripts/package_site.mjs
```

The helper writes `outputs/site/` and `outputs/site-manifest.json`, verifies all referenced files, and refuses to overwrite an existing package. `work/`, `outputs/`, source originals, and local review files are excluded from Git.
