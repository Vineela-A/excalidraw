// Dev helpers for local debugging in the main app
/* eslint-disable no-console */
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import { EMOJI_LIST, SMILE_PLUS_SVG, SPEECH_DATA_URL  } from "../src/commentConstants";
function ensureWindow() {
  const w = window as any;
  if (!w.__excalidrawDevLogs) {
    w.__excalidrawDevLogs = [] as string[];
  }
  if (!w.__pushExcalidrawDevLog) {
    w.__pushExcalidrawDevLog = (s: string) => {
      w.__excalidrawDevLogs.push(`${new Date().toLocaleTimeString()}: ${s}`);
      if (w.__excalidrawDevLogs.length > 50) w.__excalidrawDevLogs.shift();
    };
  }
  if (!w.getExcalidrawDevLogs) {
    const pins = new Map<string, { id: string; sceneX: number; sceneY: number; text: string; elementId?: string; author?: string; replies?: Array<{ id: string; text: string; author?: string; time: number; reactions?: { [emoji: string]: number } }>; reactions?: { [emoji: string]: number } }>();
    const pinNodes = new Map<string, HTMLElement>();
    let currentPinTooltip: HTMLElement | null = null;
    w.getExcalidrawDevLogs = () => w.__excalidrawDevLogs.slice().reverse();
  }
  if (!w.__excalidrawRecentEmojis) {
    w.__excalidrawRecentEmojis = [] as string[];
  }
  if (!w.__pushExcalidrawRecentEmoji) {
    w.__pushExcalidrawRecentEmoji = (e: string) => {
      w.__excalidrawRecentEmojis = (w.__excalidrawRecentEmojis || []).filter((x: string) => x !== e);
      w.__excalidrawRecentEmojis.unshift(e);
      if (w.__excalidrawRecentEmojis.length > 12) w.__excalidrawRecentEmojis.pop();
    };
  }
  if (!w.clearExcalidrawDevLogs) {
    w.clearExcalidrawDevLogs = () => {
      w.__excalidrawDevLogs = [];
    };
  }
  return w;
}

// Speech-bubble svg used as pin background (inline data URL)
const SPEECH_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' preserveAspectRatio='xMidYMid meet'>
  <defs>
    <filter id='ds' x='-50%' y='-50%' width='200%' height='200%'>
      <feDropShadow dx='0' dy='2' stdDeviation='3' flood-color='#000' flood-opacity='0.18'/>
    </filter>
  </defs>
  <g filter='url(#ds)'>
    <circle cx='32' cy='32' r='20' fill='#ffffff'/>
    <path d='M50 38 L64 44 L50 32 Z' fill='#ffffff' />
    <circle cx='32' cy='32' r='15' fill='#2CA7B8'/>
  </g>
</svg>
`;

function flashSaved() {
  try {
    const flash = document.createElement("div");
    flash.textContent = "Saved";
    flash.style.position = "fixed";
    flash.style.right = "12px";
    flash.style.bottom = "12px";
    flash.style.background = "#059669";
    flash.style.color = "white";
    flash.style.padding = "8px 12px";
    flash.style.borderRadius = "6px";
    flash.style.zIndex = "2147483647";
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1600);
  } catch (e) {
    // ignore
  }
}

// Persistent dev pins implementation
const pins = new Map<string, { id: string; sceneX: number; sceneY: number; text: string; elementId?: string; author?: string; replies?: Array<{ id: string; text: string; author?: string; time: number; reactions?: { [emoji: string]: number } }>; reactions?: { [emoji: string]: number } }>();
const pinNodes = new Map<string, HTMLElement>();
let currentPinTooltip: HTMLElement | null = null;
const DEV_PIN_W = 52;
const DEV_PIN_H = 52;

function showPinTooltip(id: string, node: HTMLElement) {
  const p = pins.get(id);
  if (!p) return;
  hidePinTooltip();
  const tooltip = document.createElement("div");
  tooltip.className = "excalidraw-dev-pin-tooltip";
  tooltip.style.position = "absolute";
  tooltip.style.zIndex = "2147483647";
  tooltip.style.background = "rgba(0,0,0,0.85)";
  tooltip.style.color = "white";
  tooltip.style.padding = "6px 8px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontSize = "12px";
  tooltip.style.maxWidth = "260px";
  tooltip.style.boxShadow = "0 8px 30px rgba(16,24,40,0.2)";
  tooltip.style.pointerEvents = "none";
  const title = document.createElement("div");
  title.style.fontWeight = "600";
  title.style.marginBottom = "4px";
  title.textContent = p.text || "(no comment)";
  const time = document.createElement("div");
  time.style.opacity = "0.85";
  time.style.fontSize = "11px";
  time.textContent = new Date().toLocaleString();
  tooltip.appendChild(title);
  tooltip.appendChild(time);
  document.body.appendChild(tooltip);
  const rect = node.getBoundingClientRect();
  tooltip.style.left = `${rect.right + 8 + window.scrollX}px`;
  tooltip.style.top = `${rect.top + window.scrollY}px`;
  currentPinTooltip = tooltip;
}

function hidePinTooltip() {
  if (currentPinTooltip) {
    currentPinTooltip.remove();
    currentPinTooltip = null;
  }
}

function ensurePinsRendered() {
  if (!document.getElementById("excalidraw-dev-pins-root")) {
    const root = document.createElement("div");
    root.id = "excalidraw-dev-pins-root";
    root.style.position = "absolute";
    root.style.left = "0";
    root.style.top = "0";
    // do not capture pointer events on the full-root so clicks reach the canvas
    // pins themselves will have `pointerEvents = 'auto'` so they remain interactive
    root.style.pointerEvents = "none";
    root.style.width = "100%";
    root.style.height = "100%";
    root.style.zIndex = "2147483646";
    const container = document.querySelector(".excalidraw") || document.body;
    // remove legacy blue-circle pins that might linger from older devHelpers versions
    try {
      document.querySelectorAll('.excalidraw-dev-pin').forEach((n) => {
        const bg = (n as HTMLElement).style.background || getComputedStyle(n as Element).background || "";
        if (bg.includes("rgba(59,130,246") || (n as HTMLElement).style.width === '32px') {
          n.remove();
        }
      });
    } catch (e) {
      // ignore
    }
    container.appendChild(root);
    try {
      console.log("devHelpers: created pins root", root, { container });
      const w = ensureWindow();
      w.__pushExcalidrawDevLog("devHelpers: created pins root");
    } catch (e) {}
    // individual pin nodes handle their own pointer events; no delegation required
  }
  // expose quick inspector
  try {
    // @ts-ignore
    window.__excalidrawDevPins = () => Array.from(pinNodes.keys());
  } catch (e) {}
}

// persist dev pins to localStorage so they survive page reloads
const PINS_STORAGE_KEY = "__excalidraw_dev_pins_v1";

function savePinsToStorage() {
  try {
    const arr = Array.from(pins.values());
    localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    // ignore
  }
}

function loadPinsFromStorage() {
  try {
    const raw = localStorage.getItem(PINS_STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw) as any[];
    for (const p of arr) {
      if (p && p.id) {
        pins.set(p.id, p);
      }
    }
  } catch (e) {
    // ignore
  }
}
function attachPinNode(id: string, node?: HTMLElement) {
  const root = document.getElementById("excalidraw-dev-pins-root")!;
  let n = node;
  if (!n) {
    n = document.createElement("div");
    n.className = "excalidraw-dev-pin";
    n.style.position = "absolute";
    n.style.width = `${DEV_PIN_W}px`;
    n.style.height = `${DEV_PIN_H}px`;
    n.style.borderRadius = `0`;
    n.style.background = `transparent`;
    n.style.border = `none`;
    n.style.pointerEvents = "auto";
    // background wrapper (speech bubble svg)
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(SPEECH_SVG, "image/svg+xml");
      const candidate = doc.documentElement;
      if (candidate && candidate.tagName && candidate.tagName.toLowerCase() === "svg") {
        const svg = candidate as unknown as SVGElement;
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        (svg as any).style.pointerEvents = "none";
        n.appendChild(svg);
      }
    } catch (e) {
      // fallback to img data URL if parsing fails
      const img = document.createElement("img");
      img.className = "excalidraw-dev-pin-img";
      img.src = SPEECH_DATA_URL;
      img.style.position = "absolute";
      img.style.left = "0";
      img.style.top = "0";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.display = "block";
      img.style.pointerEvents = "none";
      n.appendChild(img);
    }
  }
  n.setAttribute("data-devpin-id", id);
  pinNodes.set(id, n);
  // optional centered initial (first letter of text) for quick identity
  try {
    const p = pins.get(id);
    const initial = p?.text?.trim()?.charAt(0)?.toUpperCase() ?? "";
    if (initial) {
      const span = document.createElement("div");
      span.className = "excalidraw-dev-pin-initial";
      span.textContent = initial;
      span.style.position = "absolute";
      span.style.left = "50%";
      span.style.top = "50%";
      span.style.transform = "translate(-50%,-50%)";
      span.style.width = "22px";
      span.style.height = "22px";
      span.style.borderRadius = "50%";
      span.style.display = "flex";
      span.style.alignItems = "center";
      span.style.justifyContent = "center";
      span.style.color = "white";
      span.style.fontWeight = "700";
      span.style.fontSize = "12px";
      span.style.lineHeight = "22px";
      span.style.textAlign = "center";
      span.style.zIndex = "2147483648";
      span.style.fontFamily = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
      span.style.pointerEvents = "none";
      n.appendChild(span);
    }
  } catch (e) {
    // ignore
  }
  try {
    const w = ensureWindow();
    w.__pushExcalidrawDevLog(`devHelpers: attachPinNode id=${id}`);
    console.log("devHelpers: attachPinNode", id, n);
  } catch (e) {}
  // append pins to body so they receive pointer events even if root has pointer-events:none
  n.style.zIndex = `2147483647`;
  n.style.pointerEvents = "auto";
  document.body.appendChild(n);
  // make the pin interactive: clicking opens a dev thread overlay
  n.style.cursor = "pointer";
  // prefer click to avoid interfering with pointer drag gestures; allow default
  n.addEventListener("click", (ev) => {
    ev.stopPropagation();
    try {
      const w = ensureWindow();
      w.__pushExcalidrawDevLog(`devPin clicked id=${id}`);
      console.log("devPin clicked", id, ev);
    } catch (e) {}
    showThreadOverlayForPin(id);
  });
  // lightweight hover tooltip
  n.addEventListener("mouseenter", () => showPinTooltip(id, n));
  n.addEventListener("mouseleave", () => hidePinTooltip());
}

function renderAllPins(api: any) {
  try {
    const appState = api.getAppState();
    const container = document.querySelector('.excalidraw') || document.body;
    const containerRect = container.getBoundingClientRect();
    for (const [id, p] of pins.entries()) {
      const node = pinNodes.get(id) || null;
      const vp = sceneCoordsToViewportCoords({ sceneX: p.sceneX, sceneY: p.sceneY }, appState);
      // compute page coordinates relative to container (center the speech bubble on the pin)
      const left = containerRect.left + (vp.x - DEV_PIN_W / 2 - (appState?.offsetLeft || 0)) + window.scrollX;
      const top = containerRect.top + (vp.y - DEV_PIN_H / 2 - (appState?.offsetTop || 0)) + window.scrollY;
      if (!node) {
        const el = document.createElement("div");
        el.className = "excalidraw-dev-pin";
        el.style.position = "absolute";
        el.style.width = `${DEV_PIN_W}px`;
        el.style.height = `${DEV_PIN_H}px`;
        el.style.borderRadius = `0`;
        el.style.background = `transparent`;
        el.style.border = `none`;
        // visual wrapper: use an <img> for the SVG to avoid background-image issues
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(SPEECH_SVG, "image/svg+xml");
          const candidate = doc.documentElement;
          if (candidate && candidate.tagName && candidate.tagName.toLowerCase() === "svg") {
            const svg = candidate as unknown as SVGElement;
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            (svg as any).style.pointerEvents = "none";
            el.appendChild(svg);
          }
        } catch (e) {
          const img = document.createElement("img");
          img.className = "excalidraw-dev-pin-img";
          img.src = SPEECH_DATA_URL;
          img.style.position = "absolute";
          img.style.left = "0";
          img.style.top = "0";
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.display = "block";
          img.style.pointerEvents = "none";
          el.appendChild(img);
        }
        el.style.pointerEvents = "auto";
        el.title = p.text || "";
        attachPinNode(id, el);
        try {
          const w = ensureWindow();
          w.__pushExcalidrawDevLog(`devHelpers: renderAllPins attach id=${id}`);
        } catch (e) {}
      }
      const el = pinNodes.get(id)!;
      if (!el) {
        console.warn("devHelpers: expected pin node but not found", id);
      }
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
    }
  } catch (e) {
    // ignore
  }
}

function bindApiScrollHandler(api: any) {
  try {
    if (api && typeof api.onScrollChange === "function") {
      api.onScrollChange(() => renderAllPins(api));
    }
    window.addEventListener("resize", () => renderAllPins(api));
  } catch (e) {
    // ignore
  }
}

// Thread overlay for dev pins
let currentOverlay: HTMLElement | null = null;
let currentDocListener: ((ev: PointerEvent) => void) | null = null;

function showThreadOverlayForPin(id: string) {
  try {
    const w = ensureWindow();
    w.__pushExcalidrawDevLog(`showThreadOverlayForPin called id=${id}`);
  } catch (e) {}
  console.log("showThreadOverlayForPin", id);
  const pin = pins.get(id);
  if (!pin) return;
  removeThreadOverlay();
  const root = document.getElementById("excalidraw-dev-pins-root") || document.body;
  const overlay = document.createElement("div");
  overlay.className = "excalidraw-dev-thread-overlay";
  overlay.style.position = "absolute";
  overlay.style.zIndex = "2147483647";
  overlay.style.width = "380px";
  overlay.style.maxWidth = "calc(100vw - 24px)";
  overlay.style.background = "white";
  overlay.style.color = "#111";
  overlay.style.border = "1px solid rgba(0,0,0,0.08)";
  overlay.style.borderRadius = "12px";
  overlay.style.padding = "8px";
  overlay.style.boxShadow = "0 12px 40px rgba(16,24,40,0.12)";
  overlay.style.pointerEvents = "auto";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";

  // Header: toolbar
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.marginBottom = "8px";

  const leftHeader = document.createElement("div");
  leftHeader.style.display = "flex";
  leftHeader.style.alignItems = "center";

  const rightHeader = document.createElement("div");
  rightHeader.style.display = "flex";
  rightHeader.style.alignItems = "center";
  rightHeader.style.gap = "8px";

  // menu
  const menu = document.createElement("div");
  menu.textContent = "⋯";
  menu.style.fontSize = "20px";
  rightHeader.appendChild(menu);

  header.appendChild(leftHeader);
  header.appendChild(rightHeader);
  overlay.appendChild(header);

  // Thread list
  const threadList = document.createElement("div");
  threadList.style.display = "flex";
  threadList.style.flexDirection = "column";
  threadList.style.gap = "12px";
  threadList.style.maxHeight = "260px";
  threadList.style.overflow = "auto";
  threadList.style.padding = "4px 2px";

  // Original comment entry
  const entry = document.createElement("div");
  entry.style.display = "flex";
  entry.style.gap = "12px";
  entry.style.alignItems = "flex-start";

  // avatar
  const avatarWrap = document.createElement("div");
  avatarWrap.style.width = "36px";
  avatarWrap.style.height = "36px";
  avatarWrap.style.borderRadius = "50%";
  avatarWrap.style.background = "#1FA9B6";
  avatarWrap.style.display = "flex";
  avatarWrap.style.alignItems = "center";
  avatarWrap.style.justifyContent = "center";
  avatarWrap.style.color = "white";
  avatarWrap.style.fontWeight = "700";
  avatarWrap.style.fontSize = "14px";
  avatarWrap.style.flex = "0 0 auto";

  const p = pins.get(id);
  const initial = (p?.author?.trim()?.charAt(0) ?? p?.text?.trim()?.charAt(0) ?? "V").toUpperCase();
  avatarWrap.textContent = initial;

  const body = document.createElement("div");
  body.style.flex = "1 1 auto";

  const bodyHeader = document.createElement("div");
  bodyHeader.style.display = "flex";
  bodyHeader.style.alignItems = "center";
  bodyHeader.style.justifyContent = "space-between";

  const name = document.createElement("div");
  name.style.fontWeight = "700";
  name.textContent = p?.author || "Anonymous User";

  const when = document.createElement("div");
  when.style.color = "#6b7280";
  when.style.fontSize = "12px";
  when.textContent = new Date().toLocaleString();

  bodyHeader.appendChild(name);
  bodyHeader.appendChild(when);

  const commentText = document.createElement("div");
  commentText.style.marginTop = "6px";
  commentText.textContent = p?.text || "(no comment)";

  body.appendChild(bodyHeader);
  body.appendChild(commentText);

  // reactions container (pills) shown under the main comment
  const reactionsWrap = document.createElement("div");
  reactionsWrap.style.display = "flex";
  reactionsWrap.style.gap = "8px";
  reactionsWrap.style.marginTop = "8px";
  reactionsWrap.style.flexWrap = "wrap";
  reactionsWrap.style.alignItems = "center";

  function renderReactions() {
    reactionsWrap.innerHTML = "";
    const rx = p?.reactions || {};
    Object.keys(rx).forEach((emo) => {
      const count = rx[emo] || 0;
      const pill = document.createElement("div");
      pill.style.display = "inline-flex";
      pill.style.alignItems = "center";
      pill.style.gap = "6px";
      pill.style.padding = "4px 8px";
      pill.style.border = "1px solid #c7def8";
      pill.style.borderRadius = "16px";
      pill.style.background = "#ffffff";
      pill.style.color = "#111827";
      pill.style.fontSize = "14px";
      pill.textContent = `${emo} ${count}`;
      pill.style.cursor = "pointer";
      pill.title = `Remove reaction ${emo}`;
      pill.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (!p) return;
        p.reactions = p.reactions || {};
        const cur = p.reactions[emo] || 0;
        if (cur > 1) {
          p.reactions[emo] = cur - 1;
        } else {
          delete p.reactions[emo];
        }
        try {
          const w = ensureWindow();
          w.__pushExcalidrawDevLog(`devHelpers: reaction removed pin=${id} emoji=${emo}`);
        } catch (e) {}
        renderReactions();
        flashSaved();
      });
      reactionsWrap.appendChild(pill);
    });
  }

  body.appendChild(reactionsWrap);
  renderReactions();

  // main comment edit helpers
  let mainEditRow: HTMLDivElement | null = null;
  function enableMainEdit() {
    if (!p) return;
    if (mainEditRow) return; // already editing
    const ta = document.createElement("textarea");
    ta.value = p.text || "";
    ta.style.width = "100%";
    ta.style.minHeight = "64px";
    ta.style.fontSize = "14px";
    ta.style.padding = "8px";
    commentText.replaceWith(ta);

    mainEditRow = document.createElement("div");
    mainEditRow.style.display = "flex";
    mainEditRow.style.gap = "12px";
    mainEditRow.style.marginTop = "8px";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.style.color = "#2563eb";
    saveBtn.style.background = "transparent";
    saveBtn.style.border = "none";
    saveBtn.style.cursor = "pointer";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.color = "#111";
    cancelBtn.style.background = "transparent";
    cancelBtn.style.border = "none";
    cancelBtn.style.cursor = "pointer";

    saveBtn.addEventListener("click", () => {
      p.text = ta.value;
      commentText.textContent = p.text || "(no comment)";
      ta.replaceWith(commentText);
      mainEditRow?.remove();
      mainEditRow = null;
    });
    cancelBtn.addEventListener("click", () => {
      ta.replaceWith(commentText);
      mainEditRow?.remove();
      mainEditRow = null;
    });

    mainEditRow.appendChild(saveBtn);
    mainEditRow.appendChild(cancelBtn);
    body.appendChild(mainEditRow);
    ta.focus();
  }
  // open edit on clicking the main comment text
  commentText.addEventListener("click", () => enableMainEdit());

  // right-side action (reaction + add)
  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.alignItems = "center";
  actions.style.gap = "8px";
  actions.style.flex = "0 0 auto";

  const reactBtn = document.createElement("div");
  
  reactBtn.innerHTML = SMILE_PLUS_SVG;
  reactBtn.style.width = "32px";
  reactBtn.style.height = "32px";
  reactBtn.style.borderRadius = "50%";
  reactBtn.style.display = "flex";
  reactBtn.style.alignItems = "center";
  reactBtn.style.justifyContent = "center";
  reactBtn.style.background = "transparent";
  reactBtn.style.cursor = "pointer";
  reactBtn.setAttribute("aria-label", "Add reaction");
  reactBtn.title = "Add reaction";

  actions.appendChild(reactBtn);

  // emoji picker for adding reactions to the main comment
  let currentPicker: HTMLElement | null = null;
  const onDocPickerPointer = (ev: PointerEvent) => {
    if (currentPicker && !currentPicker.contains(ev.target as Node) && ev.target !== reactBtn) {
      currentPicker.remove();
      currentPicker = null;
      try {
        document.removeEventListener("pointerdown", onDocPickerPointer);
      } catch (e) {}
    }
  };

  reactBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (currentPicker) {
      currentPicker.remove();
      currentPicker = null;
      try {
        document.removeEventListener("pointerdown", onDocPickerPointer);
      } catch (e) {}
      return;
    }
    const picker = document.createElement("div");
    picker.style.position = "absolute";
    picker.style.padding = "8px";
    picker.style.background = "#fff";
    picker.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
    picker.style.borderRadius = "8px";
    picker.style.zIndex = "10010";
    picker.style.minWidth = "240px";
    // search input
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Search";
    search.style.width = "100%";
    search.style.padding = "8px 10px";
    search.style.border = "1px solid #e6eefb";
    search.style.borderRadius = "8px";
    search.style.marginBottom = "8px";
    picker.appendChild(search);
    // recent row
    const w = ensureWindow();
    const recentRow = document.createElement("div");
    recentRow.style.display = "flex";
    recentRow.style.gap = "8px";
    recentRow.style.marginBottom = "8px";
    (w.__excalidrawRecentEmojis || []).forEach((re: string) => {
      const rb = document.createElement("button");
      rb.textContent = re;
      rb.style.fontSize = "18px";
      rb.style.width = "32px";
      rb.style.height = "32px";
      rb.style.border = "none";
      rb.style.background = "transparent";
      rb.style.cursor = "pointer";
      rb.addEventListener("click", () => {
        if (!p) return;
        p.reactions = p.reactions || {};
        p.reactions[re] = (p.reactions[re] || 0) + 1;
        renderReactions();
        picker.remove();
        currentPicker = null;
      });
      recentRow.appendChild(rb);
    });
    if ((w.__excalidrawRecentEmojis || []).length) picker.appendChild(recentRow);
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(8, 1fr)";
    grid.style.gap = "8px";
    EMOJI_LIST.forEach((e) => {
      const b = document.createElement("button");
      b.textContent = e;
      b.style.fontSize = "18px";
      b.style.width = "32px";
      b.style.height = "32px";
      b.style.border = "none";
      b.style.background = "transparent";
      b.style.cursor = "pointer";
      b.addEventListener("click", () => {
        if (!p) return;
        p.reactions = p.reactions || {};
        p.reactions[e] = (p.reactions[e] || 0) + 1;
        // track recent
        const ww = ensureWindow();
        ww.__pushExcalidrawRecentEmoji(e);
        renderReactions();
        picker.remove();
        currentPicker = null;
      });
      grid.appendChild(b);
    });
    picker.appendChild(grid);
    // append picker into the thread overlay so clicks inside the picker
    // are considered inside the overlay and don't close it
    overlay.appendChild(picker);
    const rect = reactBtn.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    picker.style.left = `${rect.left - overlayRect.left + window.scrollX - 20}px`;
    picker.style.top = `${rect.bottom - overlayRect.top + window.scrollY + 8}px`;
    currentPicker = picker;
    setTimeout(() => document.addEventListener("pointerdown", onDocPickerPointer));
  });

  entry.appendChild(avatarWrap);
  entry.appendChild(body);
  entry.appendChild(actions);

  threadList.appendChild(entry);

  // render existing replies
  function renderReply(r: { id: string; text: string; author?: string; time: number }) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "10px";
    row.style.alignItems = "flex-start";

    const av = document.createElement("div");
    av.style.width = "28px";
    av.style.height = "28px";
    av.style.borderRadius = "50%";
    av.style.background = "#e5e7eb";
    av.style.display = "flex";
    av.style.alignItems = "center";
    av.style.justifyContent = "center";
    av.style.color = "#111827";
    av.style.fontWeight = "700";
    av.style.fontSize = "12px";
    av.textContent = (r.author ?? "?").trim().charAt(0).toUpperCase();

    const cbody = document.createElement("div");
    cbody.style.flex = "1 1 auto";

    const cheader = document.createElement("div");
    cheader.style.display = "flex";
    cheader.style.justifyContent = "space-between";
    cheader.style.alignItems = "center";

    const cname = document.createElement("div");
    cname.style.fontWeight = "600";
    cname.style.fontSize = "13px";
    cname.textContent = r.author || "Anonymous";

    const cwhen = document.createElement("div");
    cwhen.style.fontSize = "12px";
    cwhen.style.color = "#6b7280";
    cwhen.textContent = new Date(r.time).toLocaleString();

    // right side controls for reply: timestamp + reaction button
    const rightControls = document.createElement("div");
    rightControls.style.display = "flex";
    rightControls.style.alignItems = "center";
    rightControls.style.gap = "8px";
    rightControls.appendChild(cwhen);

    // reply reaction button (small smiley)
    const rReactBtn = document.createElement("div");
    rReactBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="#f3f4f6" />
        <circle cx="8.2" cy="9.6" r="1" fill="#9ca3af" />
        <circle cx="15.8" cy="9.6" r="1" fill="#9ca3af" />
        <path d="M8.5 15c1.2 1 3 1 4.5 0" stroke="#6b7280" stroke-width="1.2" stroke-linecap="round" fill="none" />
      </svg>`;
    rReactBtn.style.width = "28px";
    rReactBtn.style.height = "28px";
    rReactBtn.style.display = "flex";
    rReactBtn.style.alignItems = "center";
    rReactBtn.style.justifyContent = "center";
    rReactBtn.style.background = "transparent";
    rReactBtn.style.borderRadius = "50%";
    rReactBtn.style.cursor = "pointer";
    rReactBtn.title = "Add reaction";
    rightControls.appendChild(rReactBtn);

    cheader.appendChild(cname);
    cheader.appendChild(rightControls);

    const ctext = document.createElement("div");
    ctext.style.marginTop = "6px";
    ctext.textContent = r.text;

    cbody.appendChild(cheader);
    cbody.appendChild(ctext);

    // reactions for this reply
    const replyReactionsWrap = document.createElement("div");
    replyReactionsWrap.style.display = "flex";
    replyReactionsWrap.style.gap = "8px";
    replyReactionsWrap.style.marginTop = "6px";
    replyReactionsWrap.style.alignItems = "center";
    function renderReplyReactions() {
      replyReactionsWrap.innerHTML = "";
      const rrx = (r as any).reactions || {};
      Object.keys(rrx).forEach((emo) => {
        const count = rrx[emo] || 0;
        const pill = document.createElement("div");
        pill.style.display = "inline-flex";
        pill.style.alignItems = "center";
        pill.style.gap = "6px";
        pill.style.padding = "4px 8px";
        pill.style.border = "1px solid #c7def8";
        pill.style.borderRadius = "16px";
        pill.style.background = "#ffffff";
        pill.style.color = "#111827";
        pill.style.fontSize = "14px";
        pill.textContent = `${emo} ${count}`;
          pill.style.cursor = "pointer";
          pill.title = `Remove reaction ${emo}`;
          pill.addEventListener("click", (ev) => {
            ev.stopPropagation();
            (r as any).reactions = (r as any).reactions || {};
            const cur = ((r as any).reactions[emo] || 0);
            if (cur > 1) {
              (r as any).reactions[emo] = cur - 1;
            } else {
              delete (r as any).reactions[emo];
            }
            // reflect in parent pin replies array if present
            if (p && p.replies) {
              const idx = p.replies.findIndex((rr) => rr.id === r.id);
              if (idx >= 0) {
                (p.replies[idx] as any).reactions = (r as any).reactions;
              }
            }
            try { const w = ensureWindow(); w.__pushExcalidrawDevLog(`devHelpers: reply reaction removed pin=${id} reply=${r.id} emoji=${emo}`); } catch(e){}
            renderReplyReactions();
            flashSaved();
          });
          replyReactionsWrap.appendChild(pill);
      });
    }
    cbody.appendChild(replyReactionsWrap);
    renderReplyReactions();

    // reply emoji picker (scoped)
    let replyPicker: HTMLElement | null = null;
    const onDocReplyPicker = (ev: PointerEvent) => {
      if (replyPicker && !replyPicker.contains(ev.target as Node) && ev.target !== rReactBtn) {
        replyPicker.remove();
        replyPicker = null;
        try {
          document.removeEventListener("pointerdown", onDocReplyPicker);
        } catch (e) {}
      }
    };
    rReactBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (replyPicker) {
        replyPicker.remove();
        replyPicker = null;
        try {
          document.removeEventListener("pointerdown", onDocReplyPicker);
        } catch (e) {}
        return;
      }
      const picker = document.createElement("div");
      picker.style.position = "absolute";
      picker.style.padding = "8px";
      picker.style.background = "#fff";
      picker.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
      picker.style.borderRadius = "8px";
      picker.style.zIndex = "10010";
      picker.style.minWidth = "200px";
      // search + recent
      const search = document.createElement("input");
      search.type = "search";
      search.placeholder = "Search";
      search.style.width = "100%";
      search.style.padding = "8px 10px";
      search.style.border = "1px solid #e6eefb";
      search.style.borderRadius = "8px";
      search.style.marginBottom = "8px";
      picker.appendChild(search);
      const w = ensureWindow();
      const recentRow = document.createElement("div");
      recentRow.style.display = "flex";
      recentRow.style.gap = "8px";
      recentRow.style.marginBottom = "8px";
      (w.__excalidrawRecentEmojis || []).forEach((re: string) => {
        const rb = document.createElement("button");
        rb.textContent = re;
        rb.style.fontSize = "18px";
        rb.style.width = "32px";
        rb.style.height = "32px";
        rb.style.border = "none";
        rb.style.background = "transparent";
        rb.style.cursor = "pointer";
        rb.addEventListener("click", () => {
          (r as any).reactions = (r as any).reactions || {};
          (r as any).reactions[re] = ((r as any).reactions[re] || 0) + 1;
          renderReplyReactions();
          picker.remove();
          replyPicker = null;
        });
        recentRow.appendChild(rb);
      });
      if ((w.__excalidrawRecentEmojis || []).length) picker.appendChild(recentRow);
      const grid = document.createElement("div");
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "repeat(8, 1fr)";
      grid.style.gap = "8px";
      EMOJI_LIST.forEach((e) => {
        const b = document.createElement("button");
        b.textContent = e;
        b.style.fontSize = "18px";
        b.style.width = "32px";
        b.style.height = "32px";
        b.style.border = "none";
        b.style.background = "transparent";
        b.style.cursor = "pointer";
        b.addEventListener("click", () => {
          (r as any).reactions = (r as any).reactions || {};
          (r as any).reactions[e] = ((r as any).reactions[e] || 0) + 1;
          const ww = ensureWindow();
          ww.__pushExcalidrawRecentEmoji(e);
          renderReplyReactions();
          picker.remove();
          replyPicker = null;
        });
        grid.appendChild(b);
      });
      picker.appendChild(grid);
      // append reply picker inside overlay so overlay.contains(picker) === true
      overlay.appendChild(picker);
      const rect = rReactBtn.getBoundingClientRect();
      const overlayRect2 = overlay.getBoundingClientRect();
      picker.style.left = `${rect.left - overlayRect2.left + window.scrollX - 20}px`;
      picker.style.top = `${rect.bottom - overlayRect2.top + window.scrollY + 8}px`;
      replyPicker = picker;
      setTimeout(() => document.addEventListener("pointerdown", onDocReplyPicker));
    });

    // reply edit helpers: allow edit / cancel / delete for child replies
    let replyEditRow: HTMLDivElement | null = null;
    function enableReplyEdit() {
      if (replyEditRow) return; // already editing
      const ta = document.createElement("textarea");
      ta.value = r.text || "";
      ta.style.width = "100%";
      ta.style.minHeight = "56px";
      ta.style.fontSize = "14px";
      ta.style.padding = "8px";
      ctext.replaceWith(ta);

      replyEditRow = document.createElement("div");
      replyEditRow.style.display = "flex";
      replyEditRow.style.gap = "8px";
      replyEditRow.style.marginTop = "8px";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.style.color = "#2563eb";
      saveBtn.style.background = "transparent";
      saveBtn.style.border = "none";
      saveBtn.style.cursor = "pointer";

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.style.color = "#111";
      cancelBtn.style.background = "transparent";
      cancelBtn.style.border = "none";
      cancelBtn.style.cursor = "pointer";

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style.color = "#dc2626";
      deleteBtn.style.background = "transparent";
      deleteBtn.style.border = "none";
      deleteBtn.style.cursor = "pointer";

      saveBtn.addEventListener("click", () => {
        r.text = ta.value;
        ctext.textContent = r.text || "";
        ta.replaceWith(ctext);
        replyEditRow?.remove();
        replyEditRow = null;
        // persist into the pin's replies array if present
        if (p && p.replies) {
          const idx = p.replies.findIndex((rr) => rr.id === r.id);
          if (idx >= 0) p.replies[idx].text = r.text;
        }
      });

      cancelBtn.addEventListener("click", () => {
        ta.replaceWith(ctext);
        replyEditRow?.remove();
        replyEditRow = null;
      });

      deleteBtn.addEventListener("click", () => {
        // remove from the in-memory replies and DOM
        if (p && p.replies) {
          p.replies = p.replies.filter((rr) => rr.id !== r.id);
        }
        row.remove();
      });

      replyEditRow.appendChild(saveBtn);
      replyEditRow.appendChild(cancelBtn);
      replyEditRow.appendChild(deleteBtn);
      cbody.appendChild(replyEditRow);
      ta.focus();
    }

    // open reply edit on clicking the reply text
    ctext.addEventListener("click", (ev) => {
      ev.stopPropagation();
      enableReplyEdit();
    });

    row.appendChild(av);
    row.appendChild(cbody);

    threadList.appendChild(row);
  }

  (p?.replies || []).forEach((r) => renderReply(r));

  overlay.appendChild(threadList);

  // Reply input
  const replyRow = document.createElement("div");
  replyRow.style.display = "flex";
  replyRow.style.alignItems = "center";
  replyRow.style.gap = "8px";
  replyRow.style.marginTop = "8px";

  const replyInput = document.createElement("input");
  replyInput.type = "text";
  replyInput.placeholder = "Leave a reply. Use @ to mention.";
  replyInput.style.flex = "1 1 auto";
  replyInput.style.border = "1px solid rgba(0,0,0,0.06)";
  replyInput.style.borderRadius = "8px";
  replyInput.style.padding = "10px 12px";
  replyInput.style.fontSize = "14px";

  const sendBtn = document.createElement("button");
  sendBtn.textContent = "➤";
  sendBtn.style.width = "36px";
  sendBtn.style.height = "36px";
  sendBtn.style.borderRadius = "50%";
  sendBtn.style.border = "none";
  sendBtn.style.background = "transparent";
  sendBtn.style.cursor = "pointer";

  replyRow.appendChild(replyInput);
  replyRow.appendChild(sendBtn);

  overlay.appendChild(replyRow);

  // handle sending a reply
  sendBtn.addEventListener("click", () => {
    const text = (replyInput.value || "").trim();
    if (!text) return;
    const w = ensureWindow();
    const reply = { id: `r-${Date.now()}-${Math.floor(Math.random() * 10000)}`, text, author: "You", time: Date.now(), reactions: {} };
    try {
      if (!p) return;
      p.replies = p.replies || [];
      p.replies.push(reply);
      renderReply(reply);
      replyInput.value = "";
      w.__pushExcalidrawDevLog(`devHelpers: reply added pin=${id} reply=${reply.id}`);
      flashSaved();
    } catch (e) {
      // ignore
    }
  });

  replyInput.addEventListener("keydown", (ev) => {
    if ((ev as KeyboardEvent).key === "Enter") {
      ev.preventDefault();
      sendBtn.click();
    }
  });

  // position overlay near pin node
  const node = pinNodes.get(id);
  if (node) {
    const rect = node.getBoundingClientRect();
    overlay.style.left = `${rect.right + 8 + window.scrollX}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
  } else {
    overlay.style.left = `20px`;
    overlay.style.top = `20px`;
  }

  // close on outside click
  const onDocPointer = (ev: PointerEvent) => {
    if (!overlay.contains(ev.target as Node)) {
      removeThreadOverlayLocal();
    }
  };
  currentDocListener = onDocPointer;
  // attach asynchronously to avoid immediate closure capture issues
  setTimeout(() => {
    if (currentDocListener) document.addEventListener("pointerdown", currentDocListener!);
  });

  overlay.addEventListener("pointerdown", (ev) => ev.stopPropagation());
  // append overlay to body so it's positioned above canvas and not affected by root styles
  document.body.appendChild(overlay);
  currentOverlay = overlay;

  // remove overlay helper (scoped)
  const removeThreadOverlayLocal = () => {
    if (currentOverlay) {
      currentOverlay.remove();
      currentOverlay = null;
    }
    if (currentDocListener) {
      try {
        document.removeEventListener("pointerdown", currentDocListener);
      } catch (e) {
        // ignore
      }
      currentDocListener = null;
    }
  };
}

function removeThreadOverlay() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
  }
  if (currentDocListener) {
    try {
      document.removeEventListener("pointerdown", currentDocListener);
    } catch (e) {}
    currentDocListener = null;
  }
}

function onCreateCommentPin(ev: any) {
  const w = ensureWindow();
  const detail = ev?.detail ?? {};
  const sceneX = detail.sceneX ?? detail.x;
  const sceneY = detail.sceneY ?? detail.y;
  const text = detail.text ?? "";
  const author = detail.author ?? detail.name ?? detail.username ?? "";
  const elementId = detail.elementId ?? "";
  const msg = `createCommentPin element=${elementId} scene=(${sceneX},${sceneY}) text=${text}`;
  console.log(msg, detail);
  w.__pushExcalidrawDevLog(msg);
  flashSaved();
  // try to render a small pin on the canvas using the internal API if available
  try {
    // @ts-ignore
    const api = window.__excalidrawAPI;
    if (api && typeof api.getAppState === "function") {
      // persist pin via the dev pins system so it follows viewport
      ensurePinsRendered();
      const id = detail.id ?? `devpin-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      pins.set(id, { id, sceneX, sceneY, text, elementId, author, replies: [], reactions: {} });
      savePinsToStorage();
      renderAllPins(api);
    }
  } catch (e) {
    // ignore
  }
}

function onOpenCommentThread(ev: any) {
  const w = ensureWindow();
  const elementId = ev?.detail?.elementId;
  const msg = `openCommentThread element=${elementId}`;
  console.log(msg, ev?.detail);
  w.__pushExcalidrawDevLog(msg);
}

export function initDevHelpers() {
  if (typeof window === "undefined") return;
  const w = ensureWindow();
  // attach listeners once
  if (!w.__excalidrawDevHelpersAttached) {
    window.addEventListener("excalidraw:createCommentPin", onCreateCommentPin as any);
    window.addEventListener("excalidraw:openCommentThread", onOpenCommentThread as any);
    w.__excalidrawDevHelpersAttached = true;
    console.log("excalidraw: devHelpers attached");
    w.__pushExcalidrawDevLog("devHelpers attached");
    // try to bind to internal API if present to keep pins in sync with viewport
    try {
      // @ts-ignore
      const api = window.__excalidrawAPI;
      if (api) {
        bindApiScrollHandler(api);
      } else {
        // poll until api is available
        const i = setInterval(() => {
          // @ts-ignore
          const a = window.__excalidrawAPI;
          if (a) {
            bindApiScrollHandler(a);
            clearInterval(i);
          }
        }, 500);
      }
    } catch (e) {
      // ignore
    }
  }
}

// auto-init
initDevHelpers();

export default null;
