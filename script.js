"use strict";

// Fill in these URLs when the corresponding resources are released.
const PROJECT_LINKS = { arxiv: "", code: "https://github.com/RoboExpand/RoboExpand", model: "" };
const TASKS = {
  lemon: { name: "Lemon placement", robot: "Astribot", stem: "astribot-s1-lemon", description: "Pick up the lemon and place it inside the target tray." },
  cup: { name: "Cup handover", robot: "Astribot", stem: "astribot-s1-cup", description: "Pick up the cup, transfer it between arms, and rehang it on the other side of the stand." },
  drawer: { name: "Drawer loading", robot: "AgileX", stem: "agilex-drawer", description: "Open the drawer, place the object inside, and close the drawer. The full sequence must be completed for success." },
  corn: { name: "Corn placement", robot: "Tienyi 2.0", stem: "tienyi2.0-corn", description: "Grasp the corn and place it inside the fixed target basket." }
};
const EVALUATIONS = {
  paired: {
    description: "Reconstruct held-out real-robot videos from depth and reference images. Compare the generated observations with the recorded interaction.",
    stat: "6.415 FID", note: "all 1,424 matched views",
    protocol: "500 held-out episodes · 1,424 matched views · methods use their respective conditioning pipelines.",
    cases: [
      { id: "agilex", label: "AgileX", file: "C01_agilex_comparison.mp4" },
      { id: "galaxea", label: "Galaxea R1 Lite", file: "C03_galaxea_r1_lite_comparison.mp4" },
      { id: "unitree", label: "Unitree", file: "C10_unitree_comparison.mp4" }
    ], folder: "paired-test-set-cases", label: "Paired test set"
  },
  open: {
    description: "Transfer simulated interactions into new visual scenes. Inspect scene adherence, physical plausibility, visual quality, and consistency across cameras and time.",
    stat: "62.67% Top-1", note: "expert preference across five criteria",
    protocol: "50 task–scene pairs · 15 scene references · 12 expert evaluators · mean overall rank: 1.515 (1 is best).",
    cases: [
      { id: "q001", label: "Forest tabletop", file: "Q001_comparison.mp4" },
      { id: "q011", label: "Kitchen", file: "Q011_comparison.mp4" },
      { id: "q028", label: "Lakeside", file: "Q028_comparison.mp4" }
    ], folder: "open-scene-eva-cases", label: "Open-scene evaluation"
  }
};
// Selected successful physical trials; clip numbers refer to original RoboExpand rollout files.
const ROLLOUTS = {
  "lemon": [
    {
      "id": "default",
      "label": "Default scene",
      "clip": 1
    },
    {
      "id": "red",
      "label": "Red light",
      "clip": 11
    },
    {
      "id": "green",
      "label": "Green light",
      "clip": 21
    },
    {
      "id": "blue",
      "label": "Blue light",
      "clip": 31
    },
    {
      "id": "background",
      "label": "Checkered tablecloth",
      "clip": 51
    },
    {
      "id": "clutter",
      "label": "Fruit distractors",
      "clip": 41
    }
  ],
  "cup": [
    {
      "id": "default",
      "label": "Default scene",
      "clip": 15
    },
    {
      "id": "red",
      "label": "Red light",
      "clip": 24
    },
    {
      "id": "green",
      "label": "Green light",
      "clip": 32
    },
    {
      "id": "blue",
      "label": "Blue light",
      "clip": 43
    },
    {
      "id": "background",
      "label": "Checkered tablecloth",
      "clip": 4
    },
    {
      "id": "red-cup",
      "label": "Red cup",
      "clip": 51
    },
    {
      "id": "yellow-cup",
      "label": "Yellow cup",
      "clip": 55
    },
    {
      "id": "green-cup",
      "label": "Green cup",
      "clip": 58
    }
  ],
  "drawer": [
    {
      "id": "default",
      "label": "Default scene",
      "clip": 1
    }
  ],
  "corn": [
    {
      "id": "default",
      "label": "Default scene",
      "clip": 1
    }
  ]
};
const GENERATED_DATA = [
  [
    "lemon",
    "Default scene",
    "07_lemon_ep00"
  ],
  [
    "lemon",
    "Red light",
    "10_lemon_red_ep00"
  ],
  [
    "lemon",
    "Green light",
    "12_lemon_green_ep00"
  ],
  [
    "lemon",
    "Blue light",
    "14_lemon_blue_ep00"
  ],
  [
    "lemon",
    "Checkered tablecloth",
    "16_lemon_tablecloth_ep00"
  ],
  [
    "cup",
    "Default scene",
    "19_cup_ep00"
  ],
  [
    "cup",
    "Red cup",
    "22_cup_red_ep00"
  ],
  [
    "cup",
    "Green cup",
    "23_cup_green_ep00"
  ],
  [
    "cup",
    "Yellow cup",
    "24_cup_yellow_ep00"
  ],
  [
    "drawer",
    "Default scene",
    "01_drawer_ep00"
  ],
  [
    "corn",
    "Default scene",
    "04_corn_ep00"
  ]
];
const APPEARANCE_KEYS = {
  'Default scene': 'default', 'Red light': 'red', 'Green light': 'green',
  'Blue light': 'blue', 'Checkered tablecloth': 'background',
  'Red cup': 'red', 'Green cup': 'green', 'Yellow cup': 'yellow'
};
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let toastTimer;

function notify(message) {
  const notice = $('#notification');
  notice.textContent = message;
  notice.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => notice.classList.remove('visible'), 3500);
}

$$('[data-resource]').forEach(link => {
  const url = PROJECT_LINKS[link.dataset.resource];
  if (url) {
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.querySelector('.soon')?.remove();
  } else {
    link.setAttribute('aria-label', `${link.textContent.replace('Soon', '').trim()} — coming soon`);
    link.addEventListener('click', event => {
      event.preventDefault();
      notify('This resource will be available soon.');
    });
  }
});

const menu = $('.menu-toggle');
const navInner = $('.nav-inner');
const projectNav = $('#project-nav');
const navBrand = navInner.querySelector('.wordmark');
const navLinks = [...projectNav.querySelectorAll('a')];

function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  projectNav.classList.remove('is-open');
}

// Links retain their intrinsic widths when the compact menu wraps.
function fitNavigation() {
  const linksWidth = navLinks.reduce((width, link) => width + link.getBoundingClientRect().width, 0);
  const linkGaps = (navLinks.length - 1) * parseFloat(getComputedStyle(projectNav).columnGap);
  const fullWidth = navBrand.getBoundingClientRect().width + parseFloat(getComputedStyle(navInner).columnGap) + linksWidth + linkGaps;
  const compact = fullWidth > navInner.getBoundingClientRect().width;
  if (compact === navInner.classList.contains('is-compact')) return;

  const moveFocus = compact && projectNav.contains(document.activeElement);
  navInner.classList.toggle('is-compact', compact);
  closeMenu();
  if (moveFocus) menu.focus({ preventScroll: true });
}

const navSizeObserver = new ResizeObserver(fitNavigation);
[navInner, navBrand, ...navLinks].forEach(element => navSizeObserver.observe(element));
fitNavigation();
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  projectNav.classList.toggle('is-open', open);
});
navLinks.forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && projectNav.classList.contains('is-open')) {
    closeMenu();
    menu.focus({ preventScroll: true });
  }
});
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });

// Silent autoplay starts when a video enters the viewport and stops offscreen.
// A visitor's manual pause is respected until they resume or change the slide.
const videoStates = new WeakMap();
const internalPauses = new WeakSet();
function pauseVideo(video) {
  if (!video.paused) {
    internalPauses.add(video);
    video.pause();
  }
}
function playVideo(video) {
  const state = videoStates.get(video);
  if (!state.visible || state.userPaused || document.hidden) return;
  video.muted = true;
  video.autoplay = true;
  if (!video.getAttribute('src')) video.src = video.dataset.src;
  video.play().then(() => {
    video.parentElement.querySelector('.autoplay-fallback').hidden = true;
  }).catch(error => {
    if (error.name !== 'AbortError' && state.visible && !video.error) {
      video.parentElement.querySelector('.autoplay-fallback').hidden = false;
    }
  });
}
const videoObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const video = entry.target;
    const state = videoStates.get(video);
    state.visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
    if (state.visible) playVideo(video);
    else { video.autoplay = false; pauseVideo(video); }
  });
}, { threshold: [0, 0.2] });

$$('.video-shell video').forEach(video => {
  videoStates.set(video, { visible: false, userPaused: false });
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  const fallback = document.createElement('button');
  fallback.type = 'button';
  fallback.className = 'autoplay-fallback';
  fallback.hidden = true;
  fallback.textContent = 'Play video';
  fallback.setAttribute('aria-label', `Play ${video.getAttribute('aria-label')}`);
  video.parentElement.append(fallback);
  fallback.addEventListener('click', () => {
    videoStates.get(video).userPaused = false;
    playVideo(video);
  });
  video.addEventListener('play', () => {
    videoStates.get(video).userPaused = false;
    fallback.hidden = true;
  });
  video.addEventListener('pause', () => {
    if (internalPauses.has(video)) internalPauses.delete(video);
    else if (videoStates.get(video).visible && !document.hidden) videoStates.get(video).userPaused = true;
  });
  video.addEventListener('loadedmetadata', () => {
    video.removeAttribute('data-failed');
    if (video.videoWidth && video.videoHeight && !video.closest('.task-rollouts')) {
      video.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
    }
  });
  video.addEventListener('error', () => {
    if (video.error) { video.dataset.failed = 'true'; fallback.hidden = true; }
  });
  videoObserver.observe(video);
});

// The hero uses a pre-accelerated reel. Keep the original task players at normal speed.
const backdrop = $('#task-backdrop');
const backdropToggle = $('#toggle-backdrop');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let backdropEnabled = !motionPreference.matches;
let backdropVisible = false;

function updateBackdrop() {
  if (backdropEnabled && backdropVisible && !document.hidden) {
    backdrop.play().catch(error => {
      if (error.name !== 'AbortError') backdropEnabled = false;
    });
  } else {
    backdrop.pause();
  }
}

function showBackdropState() {
  backdropToggle.classList.toggle('is-playing', !backdrop.paused);
  backdropToggle.setAttribute('aria-label', backdrop.paused ? 'Play background video' : 'Pause background video');
}

backdropToggle.hidden = false;
backdropToggle.addEventListener('click', () => {
  backdropEnabled = backdrop.paused;
  updateBackdrop();
});
backdrop.addEventListener('play', showBackdropState);
backdrop.addEventListener('pause', showBackdropState);
backdrop.addEventListener('error', () => { backdropToggle.hidden = true; });
new IntersectionObserver(([entry]) => {
  backdropVisible = entry.isIntersecting;
  updateBackdrop();
}).observe(backdrop);
document.addEventListener('visibilitychange', updateBackdrop);
motionPreference.addEventListener('change', () => {
  backdropEnabled = !motionPreference.matches;
  updateBackdrop();
});

function switchVideo(video, source, poster, title) {
  pauseVideo(video);
  videoStates.get(video).userPaused = false;
  video.removeAttribute('data-failed');
  video.poster = poster;
  video.dataset.src = source;
  video.setAttribute('aria-label', title);
  const fallback = video.parentElement.querySelector('.autoplay-fallback');
  fallback.hidden = true;
  fallback.setAttribute('aria-label', `Play ${title}`);
  video.preload = 'metadata';
  video.autoplay = videoStates.get(video).visible;
  video.src = source;
  playVideo(video);
}

const taskOrder = Object.keys(TASKS);
const carouselItems = {
  demo: taskOrder.map(task => ({
    title: `${TASKS[task].name} · ${TASKS[task].robot}`,
    source: `assets/web/demo-${task}.mp4`,
    poster: `assets/posters/demo-${task}.jpg`,
    caption: 'From a real demonstration to reconstructed scenes, expanded trajectories, and transferred video.'
  })),
  transfer: Object.entries(EVALUATIONS).flatMap(([mode, evaluation]) => evaluation.cases.map(item => ({
    title: `${mode === 'paired' ? 'Paired' : 'Open scene'} · ${item.label}`,
    source: `assets/${evaluation.folder}/${item.file}`,
    poster: `assets/posters/${mode}-${item.id}.jpg`,
    caption: mode === 'paired'
      ? 'Generated video, input depth, and ground truth across three cameras.'
      : 'Reference, simulation, depth, and transferred video across three cameras.'
  }))),
  generated: GENERATED_DATA.map(([task, appearance, folder]) => ({
    title: `${TASKS[task].name} · ${appearance}`,
    source: `assets/roboexpand-generated-datasets-cases/${folder}/generated_three_views.mp4`,
    poster: `assets/posters/dataset-${task}-${APPEARANCE_KEYS[appearance]}-generated_three_views.jpg`,
    caption: 'Synchronized head, left-wrist, and right-wrist observations paired with simulation actions and states.'
  })),
  ...Object.fromEntries(Object.entries(ROLLOUTS).map(([task, scenes]) => [`rollout-${task}`, scenes.map(scene => ({
    title: scene.label,
    source: `assets/web/rollout-${task}-${scene.id}.mp4`,
    poster: `assets/posters/rollout-${task}-${scene.id}.jpg`,
    caption: TASKS[task].description
  }))]))
};

$$('[data-carousel]').forEach(region => {
  const key = region.dataset.carousel;
  const items = carouselItems[key];
  let index = 0;
  region.dataset.slideIndex = '0';
  region.querySelectorAll('[data-direction]').forEach(button => { button.disabled = items.length < 2; });
  function move(direction) {
    if (items.length < 2) return;
    index = (index + direction + items.length) % items.length;
    const item = items[index];
    region.dataset.slideIndex = String(index);
    $(`#${key}-case-title`).textContent = item.title;
    $(`#${key}-count`).textContent = `${index + 1} / ${items.length}`;
    $(`#${key}-caption`).textContent = item.caption;
    switchVideo($(`#${key}-video`), item.source, item.poster, item.title);
  }
  region.querySelectorAll('[data-direction]').forEach(button => {
    button.addEventListener('click', () => move(Number(button.dataset.direction)));
  });
  region.addEventListener('keydown', event => {
    // Keep the native video's keyboard seeking and volume controls intact.
    if (event.target !== region && !event.target.closest('[data-direction]')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
});

document.addEventListener('visibilitychange', () => {
  $$('.video-shell video').forEach(video => { if (document.hidden) pauseVideo(video); else playVideo(video); });
});

const figureDialog = $('#figure-dialog');
$$('.zoom-figure').forEach(button => button.addEventListener('click', () => {
  $('#expanded-figure').src = button.dataset.image;
  $('#expanded-figure').alt = button.querySelector('img').alt;
  $('#figure-caption').textContent = button.dataset.caption;
  figureDialog.showModal();
}));
$('#close-figure').addEventListener('click', () => figureDialog.close());
figureDialog.addEventListener('click', event => {
  if (event.target !== figureDialog) return;
  const rect = figureDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) figureDialog.close();
});

const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  $$('#project-nav a').forEach(link => {
    if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}), { rootMargin: '-10% 0px -65% 0px', threshold: 0 });
$$('#project-nav a').forEach(link => navObserver.observe($(link.hash)));
navObserver.observe($('#top'));
