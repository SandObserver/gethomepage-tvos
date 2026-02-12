// ───────────────────────────────────────────────
// Configuration – easy to tweak here
// ───────────────────────────────────────────────
const CC_CONFIG = {
  // Base URL for SVG icons (change if your server IP/port moves)
  iconBaseUrl: 'http://localhost/icons/',

  // Selectors for core dashboard elements
  selectors: {
    widgetsWrap: '#widgets-wrap',
    bookmarks: '#bookmarks',
    mainContainer: '.container.relative.m-auto.flex.flex-col.justify-start.z-10.h-full.min-h-screen',
    timeWidget: '.information-widget-datetime',
    weatherWidget: '.information-widget-openmeteo',
    terminalLi: 'li[data-name="Terminal"]',
    upcomingLi: 'li.service.item[data-name="Upcoming"]',
    // Storage widgets: look for GB/TB in text (you can add more selectors if needed)
    storageWidgets: '.information-widget-resource',
    timeMachineWidget: '.widget-container', // will search for 'Time Machine' text inside
    uptimeWidget: '.information-widget-resource', // will search for 'UP' or specific SVG
  },

  // Delay before building (increase if dashboard loads slowly)
  buildDelayMs: 300,
};

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────
function createIconButton(title, iconName) {
  const link = document.createElement('a');
  link.href = '#';
  link.title = title;
  link.className = 'rounded-full flex items-center justify-center w-14 h-14 cursor-pointer';

  const wrap = document.createElement('div');
  wrap.className = 'flex items-center justify-center w-full h-full';

  const div = document.createElement('div');
  div.className = 'w-7 h-7';

  const mask = document.createElement('div');
  mask.style.cssText = `
    width: 32px;
    height: 32px;
    max-width: 100%;
    max-height: 100%;
    background: rgb(255, 255, 255);
    mask: url("${CC_CONFIG.iconBaseUrl}${iconName}.svg") center center / contain no-repeat;
    -webkit-mask: url("${CC_CONFIG.iconBaseUrl}${iconName}.svg") center center / contain no-repeat;
  `;

  div.appendChild(mask);
  wrap.appendChild(div);
  link.appendChild(wrap);

  const container = document.createElement('div');
  container.classList.add('cc-toggle-button');
  container.appendChild(link);

  return { container, link };
}

function cleanupWidgetClasses(widget) {
  if (!widget) return;
  widget.classList.remove('flex', 'flex-col', 'justify-center', 'widget-container');
  const inner = widget.querySelector('div, .widget-inner');
  if (inner) {
    inner.classList.remove('grow', 'justify-end');
    inner.classList.add('justify-start');
  }
}

// ───────────────────────────────────────────────
// Main build logic
// ───────────────────────────────────────────────
setTimeout(() => {
  console.log("[Control Center] Script executing");

  const widgetsWrap = document.querySelector(CC_CONFIG.selectors.widgetsWrap);
  const bookmarks = document.querySelector(CC_CONFIG.selectors.bookmarks);
  if (!widgetsWrap || !bookmarks) {
    console.error("[Control Center] Required elements (#widgets-wrap or #bookmarks) not found");
    return;
  }

  widgetsWrap.style.display = 'none';
  bookmarks.style.display = 'none';

  // Create main container
  const cc = document.createElement('div');
  cc.classList.add('control-center');
  cc.id = 'control-center-panel';

  // Smart insertion position
  const mainContainer = document.querySelector(CC_CONFIG.selectors.mainContainer);
  if (mainContainer) {
    const dialog = mainContainer.querySelector('div[role="dialog"][aria-modal="true"]');
    if (dialog) {
      dialog.insertAdjacentElement('afterend', cc);
    } else {
      mainContainer.appendChild(cc);
    }
  } else {
    document.body.appendChild(cc);
    console.warn("[Control Center] Main container not found, appended to body");
  }

  // ─── Top bar (always visible) ───
  const topBar = document.createElement('div');
  topBar.classList.add('top-bar');
  cc.appendChild(topBar);

  // Time widget
  const timeWidget = document.querySelector(CC_CONFIG.selectors.timeWidget);
  if (timeWidget) {
    cleanupWidgetClasses(timeWidget);
    topBar.appendChild(timeWidget);
  }

  // Weather widget (if present)
  const weatherWidget = document.querySelector(CC_CONFIG.selectors.weatherWidget);
  if (weatherWidget) {
    cleanupWidgetClasses(weatherWidget);
    topBar.appendChild(weatherWidget);
  }

  // Calendar toggle (left side)
  const { container: calendarToggle, link: calLink } = createIconButton('Calendar', 'calendar');
  topBar.appendChild(calendarToggle);

  // Control Center toggle (right side)
  const { container: ccToggle, link: ccLink } = createIconButton('Control Center', 'control-center');
  topBar.appendChild(ccToggle);

  // ─── Collapsible panel area ───
  const collapsible = document.createElement('div');
  collapsible.classList.add('cc-collapsible');
  collapsible.style.display = 'none';
  cc.appendChild(collapsible);

  // Control Center main content
  const ccContent = document.createElement('div');
  ccContent.id = 'cc-content';
  collapsible.appendChild(ccContent);

  const mainGrid = document.createElement('div');
  mainGrid.classList.add('main-grid');
  ccContent.appendChild(mainGrid);

  const leftCol = document.createElement('div');
  leftCol.classList.add('col', 'left');
  mainGrid.appendChild(leftCol);

  const rightCol = document.createElement('div');
  rightCol.classList.add('col', 'right');
  mainGrid.appendChild(rightCol);

  // ─── Repurposed widgets as toggles ───
  // Terminal → large central button (like Power)
  const termLi = document.querySelector(CC_CONFIG.selectors.terminalLi);
  if (termLi) {
    const a = termLi.querySelector('a');
    if (a) {
      a.className = 'flex flex-col items-center justify-center h-full w-full cursor-pointer text-theme-200';
      const label = document.createElement('div');
      label.classList.add('toggle-label');
      label.textContent = 'Terminal';
      a.appendChild(label);

      const toggle = document.createElement('div');
      toggle.classList.add('toggle', 'large', 'power'); // kept class, even if name is cosmetic
      toggle.appendChild(a);
      leftCol.appendChild(toggle);
    }
  }

  // Storage widgets (first two with GB/TB) → e.g. media/storage indicators
  const storageResources = Array.from(document.querySelectorAll(CC_CONFIG.selectors.storageWidgets))
    .filter(el => /GB|TB/.test(el.textContent));

  if (storageResources.length >= 1) {
    const media1 = storageResources[0].cloneNode(true);
    media1.className = 'flex items-center justify-start h-full w-full p-3 text-theme-200';
    const toggle1 = document.createElement('div');
    toggle1.classList.add('toggle', 'small', 'wifi'); // kept class name
    toggle1.appendChild(media1);
    rightCol.appendChild(toggle1);
  }

  if (storageResources.length >= 2) {
    const media2 = storageResources[1].cloneNode(true);
    media2.className = 'flex items-center justify-start h-full w-full p-3 text-theme-200';
    const toggle2 = document.createElement('div');
    toggle2.classList.add('toggle', 'small', 'dnd'); // kept class name
    toggle2.appendChild(media2);
    rightCol.appendChild(toggle2);
  }

  // Time Machine → sleep/backup indicator
  const tmContainer = Array.from(document.querySelectorAll(CC_CONFIG.selectors.timeMachineWidget))
    .find(el => el.textContent.includes('Time Machine'));
  if (tmContainer) {
    const res = tmContainer.querySelector('.information-widget-resource');
    if (res) {
      res.className = 'flex items-center justify-start h-full w-full p-3 text-theme-200';
      const toggle = document.createElement('div');
      toggle.classList.add('toggle', 'small', 'sleep');
      toggle.appendChild(res);
      rightCol.appendChild(toggle);
    }
  }

  // Uptime → system/audio indicator
  const uptimeRes = Array.from(document.querySelectorAll(CC_CONFIG.selectors.uptimeWidget))
    .find(el => el.textContent.includes('UP') || el.querySelector('svg[viewBox="0 0 512 512"]'));
  if (uptimeRes) {
    uptimeRes.className = 'flex items-center justify-start h-full w-full p-3 text-theme-200';
    const toggle = document.createElement('div');
    toggle.classList.add('toggle', 'small', 'audio');
    toggle.appendChild(uptimeRes);
    leftCol.appendChild(toggle);
  }

  // ─── Bottom bookmarks (excluding Terminal) ───
  const bottom = document.createElement('div');
  bottom.classList.add('bottom-icons');
  ccContent.appendChild(bottom);

  document.querySelectorAll('#bookmarks li.bookmark').forEach(li => {
    if (li.dataset.name !== 'Terminal') {
      const clone = li.cloneNode(true);
      const a = clone.querySelector('a');
      if (a) {
        a.className = 'rounded-full flex items-center justify-center w-14 h-14 cursor-pointer';
        const icon = a.querySelector('div');
        if (icon) icon.className = 'flex items-center justify-center w-full h-full';
        bottom.appendChild(clone);
      }
    }
  });

  // ─── Calendar content ───
  const calendarContent = document.createElement('div');
  calendarContent.id = 'calendar-content';
  calendarContent.style.display = 'none';
  collapsible.appendChild(calendarContent);

  const upcomingLi = document.querySelector(CC_CONFIG.selectors.upcomingLi);
  if (upcomingLi) {
    const cardContainer = upcomingLi.querySelector('.apple-tv-card-container');
    if (cardContainer) {
      // Hide original Upcoming group
      const servicesGroup = upcomingLi.closest('.service');
      if (servicesGroup) servicesGroup.style.display = 'none';

      const cloned = cardContainer.cloneNode(true);

      // Cleanup unwanted parts (same as before)
      cloned.querySelectorAll('span.reflection, a.content, .apple-tv-card-title').forEach(el => el.remove());

      const appleTvCard = cloned.querySelector('.apple-tv-card');
      if (appleTvCard) {
        Array.from(appleTvCard.children).forEach(child => {
          if (!child.classList.contains('parallax-content')) child.remove();
        });
      }

      // Layout (unchanged)
      calendarContent.style.padding = '16px';
      calendarContent.style.display = 'flex';
      calendarContent.style.justifyContent = 'center';
      cloned.style.width = '100%';
      cloned.style.maxWidth = '1100px';
      cloned.style.margin = '0 auto';
      calendarContent.appendChild(cloned);

      // Click fixes (unchanged)
      cloned.querySelectorAll('a').forEach(a => {
        a.style.pointerEvents = 'auto';
        a.style.position = 'relative';
        a.style.zIndex = '10';
      });
      cloned.querySelectorAll('.service-title, .service-tags').forEach(el => {
        el.style.pointerEvents = 'none';
      });
    } else {
      calendarContent.innerHTML = '<div style="padding: 3rem; color: #888; text-align: center;">Calendar widget not found</div>';
    }
  } else {
    calendarContent.innerHTML = '<div style="padding: 3rem; color: #888; text-align: center;">Upcoming service not found</div>';
  }

  // ─── Toggle logic ───
  function showPanel(panel) {
    collapsible.style.display = 'block';
    cc.classList.add('cc-expanded');
    ccContent.style.display = panel === 'cc' ? 'block' : 'none';
    calendarContent.style.display = panel === 'calendar' ? 'block' : 'none';
  }

  function hideAll() {
    collapsible.style.display = 'none';
    cc.classList.remove('cc-expanded');
    ccContent.style.display = 'none';
    calendarContent.style.display = 'none';
  }

  calLink.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (collapsible.style.display !== 'none' && calendarContent.style.display === 'block') {
      hideAll();
    } else {
      showPanel('calendar');
    }
  });

  ccLink.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (collapsible.style.display !== 'none' && ccContent.style.display === 'block') {
      hideAll();
    } else {
      showPanel('cc');
    }
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!cc.contains(e.target)) hideAll();
  });

  cc.addEventListener('click', (e) => e.stopPropagation());

  console.log("[Control Center] Ready – Calendar & CC toggles active");
}, CC_CONFIG.buildDelayMs);

