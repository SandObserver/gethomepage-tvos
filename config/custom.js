// ────────────────────────────────────────────────
// CONFIGURATION (edit these as needed)
// ────────────────────────────────────────────────
const CONFIG = {
  unsplash: {
    // Get your own free key at: https://unsplash.com/developers → New Application → copy "Access Key"
    key: 'YOUR_UNSPLASH_ACCESS_KEY',
    collectionId: '399194',
    targetWidth: 3000,
    targetHeight: 2500,
    brightness: 75,
  },
  // Script injection
  externalScripts: [
    'icons/control-center.js',
  ],
  // Selectors & modifications — grouped by purpose
  modifications: {
    // Insert empty elements
    insertElement: [
      { selector: '.service-card', position: 'before', tag: 'span', class: 'reflection' },
      { selector: '.service-card', position: 'before', tag: 'div', class: 'content' },
      { selector: '.apple-tv-card', position: 'after', tag: 'div', class: 'apple-tv-card-title' },
      { selector: '.container', position: 'after', tag: 'div', class: 'liquid-glass-element' },
      { selector: '.content', position: 'after', tag: 'div', class: 'service-logo' },
      { selector: '#background', position: 'after', tag: 'div', class: 'background-overlay' },
    ],
    // Wrap elements with multiple nested wrappers (innermost last)
    wrapWith: [
      {
        selector: '.service-card',
        wrapperClasses: ['item-content', 'apple-tv-card-container', 'apple-tv-card'],
      },
    ],
    // Add classes
    addClasses: [
      { selector: '.service', classes: ['item'] },
      { selector: '.service-card', classes: ['parallax-content'] },
      { selector: '#layout-groups > .services-group:first-of-type', classes: ['header', 'glass'] },
      { selector: '#layout-groups .services-group:not(#layout-groups > .services-group:first-of-type)', classes: ['body'] },
    ],
  },
  // Card transformation (icon → background, name move, tags preserve, title cleanup)
  cardTransform: {
    serviceListSelector: '.services-list > li.service.item',
    skipIfTransformed: true,
  },
  // Decimal rounding (speedtest etc.)
  rounding: {
    enabled: true,
    regex: /(\d+\.\d+)(?!\d)/g,
  },
  // Parallax / hover effect tuning
  parallax: {
    maxRotate: 10,
    translateZ: '4rem',
    contentScale: 1.075,
    reflectionScale: 1.5,
  },
};
// ────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────
function addClasses(el, classString) {
  if (!el || !classString) return;
  const toAdd = classString.split(/\s+/).filter(Boolean);
  if (!toAdd.length) return;
  const current = el.className.split(/\s+/).filter(Boolean);
  el.className = [...new Set([...current, ...toAdd])].join(' ');
}

function wrapElementMultiple(el, wrapperClasses) {
  if (!el || !wrapperClasses?.length) return;
  let current = el;
  // Reverse: innermost wrapper applied last
  for (let i = wrapperClasses.length - 1; i >= 0; i--) {
    const cls = wrapperClasses[i].trim();
    if (!cls) continue;
    const wrapper = document.createElement('div');
    wrapper.className = cls;
    current.parentNode?.insertBefore(wrapper, current);
    wrapper.appendChild(current);
    current = wrapper;
  }
}

function insertEmptyElement(target, { tag = 'div', class: cls = '', position = 'before' }) {
  if (!target) return;
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  const pos = position.toLowerCase();
  if (pos.includes('before') || pos === 'beforebegin') {
    target.parentNode?.insertBefore(el, target);
  } else if (pos.includes('after') || pos === 'afterend') {
    target.parentNode?.insertBefore(el, target.nextSibling);
  } else if (pos === 'prepend' || pos === 'afterbegin') {
    target.insertBefore(el, target.firstChild);
  } else if (pos === 'append' || pos === 'beforeend') {
    target.appendChild(el);
  }
}

// ────────────────────────────────────────────────
// Safari detection
// ────────────────────────────────────────────────
function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// ────────────────────────────────────────────────
// Core DOM modifications (run once on ready)
// ────────────────────────────────────────────────
function applyStaticModifications() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStaticModifications);
    return;
  }
  // 1. Wraps
  CONFIG.modifications.wrapWith.forEach(({ selector, wrapperClasses }) => {
    document.querySelectorAll(selector).forEach(el => wrapElementMultiple(el, wrapperClasses));
  });
  // 2. Add classes
  CONFIG.modifications.addClasses.forEach(({ selector, classes }) => {
    const classStr = classes?.join(' ') || '';
    if (!classStr) return;
    document.querySelectorAll(selector).forEach(el => addClasses(el, classStr));
  });
  // 3. Insert empty elements
  CONFIG.modifications.insertElement.forEach(item => {
    document.querySelectorAll(item.selector).forEach(target => {
      insertEmptyElement(target, {
        tag: item.tag,
        class: item.class || '',
        position: item.position,
      });
    });
  });
}

// ────────────────────────────────────────────────
// Service card transformation
// ────────────────────────────────────────────────
function transformServiceCards() {
  const list = document.querySelector('.services-list');
  // Early exit if critical structure isn't ready yet (helps Safari timing)
  if (!list || list.children.length < 2) {  // adjust threshold if your dashboard has fewer cards
    console.log("[Safari] Services list not ready yet — skipping transform");
    return;
  }

  const items = document.querySelectorAll(CONFIG.cardTransform.serviceListSelector);
  if (!items.length) return;

  let count = 0;
  items.forEach(item => {
    if (CONFIG.cardTransform.skipIfTransformed && item.dataset.transformed === 'true') return;

    const nameDiv = item.querySelector('.service-name');
    const titleTextLink = item.querySelector('.service-title-text');
    const iconLink = item.querySelector('.service-icon');
    const contentDiv = item.querySelector('.apple-tv-card > .content');
    const titleDiv = item.querySelector('.apple-tv-card-title');
    const serviceTags = item.querySelector('.service-tags');
    const serviceLogoDiv = item.querySelector('.service-logo');

    if (!nameDiv || !titleTextLink || !contentDiv || !titleDiv) return;

    const url = titleTextLink.href || titleTextLink.getAttribute('href');
    if (!url || url === 'undefined') return;

    // 1. Move name
    titleDiv.appendChild(nameDiv);

    // 2. Move SVG into .service-logo
    if (iconLink && serviceLogoDiv) {
      while (iconLink.firstChild) {
        serviceLogoDiv.appendChild(iconLink.firstChild);
      }
      iconLink.remove();
    }

    // 3. Replace content with clickable <a>
    const newLink = document.createElement('a');
    newLink.className = 'content';
    newLink.href = url;
    newLink.target = '_blank';
    newLink.tabIndex = 0;
    newLink.setAttribute('aria-label', nameDiv.textContent.trim() || 'Open service');
    newLink.style.opacity = '1';
    contentDiv.replaceWith(newLink);

    // 4. MOVE tags
    if (serviceTags) {
      const appleTvCard = item.querySelector('.apple-tv-card');
      if (appleTvCard) {
        appleTvCard.appendChild(serviceTags);
        serviceTags.style.zIndex = '20';
        serviceTags.classList.add('absolute', 'top-0', 'right-0', 'flex', 'flex-row', 'justify-end', 'gap-0');
      }
    }

    // 5. Clean up old title container
    const titleContainer = titleTextLink.closest('.service-title');
    titleContainer?.remove();

    item.dataset.transformed = 'true';
    count++;
  });

  if (count > 0) {
    console.log(`Transformed ${count} service cards`);
  }
}

// ────────────────────────────────────────────────
// Decimal rounding observer
// ────────────────────────────────────────────────
function roundDecimalsInText() {
  if (!CONFIG.rounding.enabled) return false;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let changed = false;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.nodeValue;
    if (!text.includes('.')) continue;
    const newText = text.replace(CONFIG.rounding.regex, (match, numStr) => {
      const num = parseFloat(numStr);
      return isNaN(num) ? match : Math.round(num) + match.slice(numStr.length);
    });
    if (newText !== text) {
      node.nodeValue = newText;
      changed = true;
    }
  }
  return changed;
}

// ────────────────────────────────────────────────
// Unsplash background
// ────────────────────────────────────────────────
async function setRandomUnsplashBackground() {
  const elem = document.getElementById('background');
  if (!elem) return;
  try {
    const params = new URLSearchParams({
      collections: CONFIG.unsplash.collectionId,
      orientation: 'landscape',
      content_filter: 'high',
      client_id: CONFIG.unsplash.key,
    });
    const res = await fetch(`https://api.unsplash.com/photos/random?${params}`);
    if (!res.ok) throw new Error(`Unsplash ${res.status}`);
    const photo = await res.json();
    let url = photo.urls.raw;
    url += `&w=${CONFIG.unsplash.targetWidth}&h=${CONFIG.unsplash.targetHeight}&q=85&fm=jpg&fit=crop&crop=entropy`;
    elem.style.backgroundImage = `linear-gradient(rgb(var(--bg-color) / 0), rgb(var(--bg-color) / 0)), url('${url}')`;
    elem.style.backgroundSize = 'cover';
    elem.style.backgroundPosition = 'center';
    elem.style.backgroundRepeat = 'no-repeat';
    elem.style.filter = `brightness(${CONFIG.unsplash.brightness}%)`;

    // Force repaint (helps Safari sometimes)
    void elem.offsetHeight;

    console.log(`Unsplash background set (${photo.user.name})`);
  } catch (err) {
    console.warn('Unsplash background failed:', err.message);
  }
}

// ────────────────────────────────────────────────
// Glass fallback (Chrome vs others)
// ────────────────────────────────────────────────
function applyGlassFallback() {
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  let elem = document.getElementById('liquid-glass-element') ||
             document.querySelector('.liquid-glass-element');
  if (elem) {
    elem.className = isChrome ? 'glass-main' : 'glass-fallback';
  } else {
    console.warn('No glass element found for fallback');
  }
}

// ────────────────────────────────────────────────
// Apple TV parallax + hover (fixed for Homepage)
// ────────────────────────────────────────────────
(function initAppleTvParallax() {
  "use strict";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setPerspective(card) {
    if (!card) return;
    const a = Math.max(card.clientWidth, card.clientHeight);
    const container = card.parentElement;
    if (container) {
      container.style.perspective = `${2.5 * a}px`;
    }
  }

  function handleFocusBlur(e, isFocus) {
    const card = e.target.closest(".apple-tv-card");
    if (card && isFocus) setPerspective(card);
  }

  function handleEnter(e) {
    const card = e.target.closest(".apple-tv-card");
    if (!card) return;
    const content = card.querySelector(".content");
    if (content) content.focus();
    card.classList.add("hover");
    handleMove(e, card);
  }

  function handleMove(e, passedCard = null) {
    const card = passedCard || e.target.closest(".apple-tv-card");
    if (!card || !card.classList.contains("hover") || reducedMotion) return;

    let x, y;
    if (e.type.startsWith("touch")) {
      const touch = e.touches[0];
      const rect = card.getBoundingClientRect();
      x = touch.pageX - rect.left;
      y = touch.pageY - rect.top;
    } else {
      x = e.offsetX;
      y = e.offsetY;
    }

    const w = card.clientWidth;
    const h = card.clientHeight;
    const rx = (w / 2 - x) / w * CONFIG.parallax.maxRotate;
    const ry = -(h / 2 - y) / h * CONFIG.parallax.maxRotate;
    const tx = -(w / 2 - x) / w * CONFIG.parallax.maxRotate;
    const ty = -(h / 2 - y) / h * CONFIG.parallax.maxRotate;

    card.style.transform = `translateZ(${CONFIG.parallax.translateZ}) rotateY(${rx}deg) rotateX(${ry}deg) translateX(${tx}px) translateY(${ty}px)`;

    card.querySelectorAll(".parallax-content").forEach((el, i) => {
      const factor = el.classList.contains("reverse") ? 0.2 : -0.65;
      el.style.transform = `scale(${CONFIG.parallax.contentScale}) translateX(${tx * factor * (i+1)}px) translateY(${ty * factor * (i+1)}px)`;
    });

    const refl = card.querySelector(".reflection");
    if (refl) {
      const s = CONFIG.parallax.reflectionScale * Math.max(w, h);
      refl.style.width = `${s}px`;
      refl.style.height = `${s}px`;
      refl.style.margin = `-${s/2}px 0 0 -${s/2}px`;
      refl.style.transform = `translateY(${y - h/2}px) translateX(${0.1 * w + 0.8 * x}px)`;
    }

    const shadow = card.querySelector(".shadow");
    if (shadow) {
      if (y < h/3) {
        const opacity = 1 - (y / (h/3));
        shadow.style.opacity = opacity;
        shadow.style.boxShadow = `inset 0 -${opacity}em .4em -.5em rgba(0,0,0,${Math.min(opacity * 0.35, 0.35)})`;
      } else {
        shadow.style.opacity = '';
        shadow.style.boxShadow = '';
      }
    }
  }

  function handleLeave(e) {
    const card = e.target.closest(".apple-tv-card");
    if (!card) return;
    card.querySelector(".content")?.blur();
    card.classList.remove("hover");
    card.style.transform = '';
    card.querySelectorAll(".parallax-content").forEach(el => el.style.transform = '');
    const refl = card.querySelector(".reflection");
    if (refl) refl.style.transform = '';
    const shadow = card.querySelector(".shadow");
    if (shadow) {
      shadow.style.boxShadow = '';
      shadow.style.opacity = '';
    }
  }

  function applyListeners(card) {
    if (card.dataset.parallaxInit) return;
    card.dataset.parallaxInit = 'true';

    const size = Math.max(card.clientWidth, card.clientHeight);
    card.style.fontSize = `${size / 3.5}px`;

    const content = card.querySelector(".content");
    if (content) {
      content.tabIndex = 0;
      content.addEventListener("focus", e => handleFocusBlur(e, true));
      content.addEventListener("blur", e => handleFocusBlur(e, false));
    }

    card.addEventListener("mouseenter", handleEnter);
    card.addEventListener("touchstart", handleEnter, { passive: true });
    card.addEventListener("mousemove", handleMove);
    card.addEventListener("touchmove", handleMove, { passive: true });
    card.addEventListener("mouseleave", handleLeave);
    card.addEventListener("touchend", handleLeave);
    card.addEventListener("touchcancel", handleLeave);

    if (!reducedMotion && !card.querySelector(".shadow")) {
      const shadow = document.createElement("span");
      shadow.classList.add("shadow");
      card.prepend(shadow);
    }
  }

  function initCards() {
    document.querySelectorAll(".apple-tv-card").forEach(applyListeners);
  }

  // Run initially + delayed + on mutations
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCards);
  } else {
    initCards();
  }

  // More aggressive retries
  [500, 1200, 2500, 4500, 8000].forEach(delay => setTimeout(initCards, delay));

  const grid = document.querySelector(".services-list") || document.body;
  const observer = new MutationObserver(() => {
    setTimeout(initCards, 400);
  });
  observer.observe(grid, { childList: true, subtree: true });

  console.log("Apple TV parallax initialized (with more delays & observer)");
})();

// ────────────────────────────────────────────────
// Initialization
// ────────────────────────────────────────────────
function initialize() {
  applyStaticModifications();
  applyGlassFallback();
  setRandomUnsplashBackground();
  transformServiceCards();
  if (CONFIG.rounding.enabled) {
    roundDecimalsInText();
  }
  CONFIG.externalScripts.forEach(src => {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => console.log(`${src} loaded`);
    script.onerror = () => console.warn(`${src} failed`);
    document.head.appendChild(script);
  });
}

// Safari-friendly delayed start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (isSafari()) {
      setTimeout(initialize, 1200); // longer delay for Safari
    } else {
      initialize();
    }
  });
} else {
  if (isSafari()) {
    setTimeout(initialize, 1200);
  } else {
    initialize();
  }
}

// ────────────────────────────────────────────────
// Dynamic observers
// ────────────────────────────────────────────────
let debounceTimer;

// Services list changes → transform more often
const servicesGrid = document.querySelector('.services-list');
if (servicesGrid) {
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      transformServiceCards();
      roundDecimalsInText();
    }, 400);
  });
  observer.observe(servicesGrid, { childList: true, subtree: true, attributes: true });
}

// Global rounding observer
if (CONFIG.rounding.enabled) {
  const roundingObserver = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(roundDecimalsInText, 500);
  });
  roundingObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });
}

// Aggressive Safari re-transform phase (first 15 seconds)
if (isSafari()) {
  const aggressiveObserver = new MutationObserver(() => {
    transformServiceCards();
    roundDecimalsInText();
  });
  aggressiveObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
  setTimeout(() => aggressiveObserver.disconnect(), 15000);
}

// Extra safety: re-transform periodically
setInterval(transformServiceCards, 4000); // lowered from 6000 for faster recovery

console.log("custom.js initialized — tvOS style + enhancements active (status & Safari fixes applied)");

// Custom scroll dots (unchanged)
(function() {
  function initCustomScrollDots() {
    if (document.querySelector('.custom-scroll-dots')) {
      console.log('Custom scroll dots already exist');
      return;
    }
    const container = document.createElement('div');
    container.className = 'custom-scroll-dots';
    const topDot = document.createElement('div');
    topDot.className = 'custom-scroll-dot';
    topDot.id = 'dot-top';
    const bottomDot = document.createElement('div');
    bottomDot.className = 'custom-scroll-dot';
    bottomDot.id = 'dot-bottom';
    container.appendChild(topDot);
    container.appendChild(bottomDot);

    document.documentElement.appendChild(container);
    console.log('Custom scroll dots appended to documentElement');

    container.style.display = 'none';
    container.offsetHeight;
    container.style.display = 'flex';
    container.style.transform = 'translate3d(0,0,0)';
    container.style.webkitTransform = 'translate3d(0,0,0)';

    topDot.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    bottomDot.addEventListener('click', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max, behavior: 'smooth' });
    });

    function updateActiveDot() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const percent = maxScroll > 0 ? scrollTop / maxScroll : 0;
      topDot.classList.toggle('active', percent < 0.3);
      bottomDot.classList.toggle('active', percent > 0.7);
    }

    updateActiveDot();
    window.addEventListener('scroll', updateActiveDot, { passive: true });
    window.addEventListener('resize', updateActiveDot, { passive: true });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initCustomScrollDots, 600); // slightly longer for Safari
  } else {
    window.addEventListener('load', () => {
      setTimeout(initCustomScrollDots, 600);
    });
  }
})();