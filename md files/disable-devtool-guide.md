# Setting Up `disable-devtool` — Complete Configuration Guide

> A practical guide to integrating and configuring the `disable-devtool` library
> in any web project. Covers installation, all configuration options, detector tuning,
> bypass mechanisms, and known limitations.

---

## 1. What Is `disable-devtool`?

`disable-devtool` is an open-source JavaScript library that detects when a user opens
browser developer tools and responds with a configurable action (page close, redirect,
or HTML rewrite). It also disables common DevTools access shortcuts.

- **GitHub:** [github.com/theajack/disable-devtool](https://github.com/theajack/disable-devtool)
- **npm:** [npmjs.com/package/disable-devtool](https://www.npmjs.com/package/disable-devtool)
- **License:** MIT

**Common use cases:**
- Protecting client-side business logic from casual inspection
- Preventing non-technical users from accidentally breaking things via console
- Anti-cheat protection in browser-based games/exams
- Reducing copy-paste scraping attempts

> [!WARNING]
> `disable-devtool` is **not a security control**. It is a deterrent against casual inspection.
> Any determined developer can bypass it. Always implement real server-side security for sensitive
> operations. Never rely on this library to protect secrets, credentials, or sensitive API logic.

---

## 2. Installation

### Option A: npm (Recommended for Bundled Projects)

```bash
npm install disable-devtool
```

```javascript
// ES Module (React, Vue, Angular, Vite, etc.)
import DisableDevtool from 'disable-devtool';
DisableDevtool(options);

// CommonJS (Node.js / older setups)
const DisableDevtool = require('disable-devtool');
DisableDevtool(options);
```

### Option B: CDN Script Tag (Vanilla HTML)

The simplest one-liner — add the attribute `disable-devtool-auto` and the library
auto-initializes with defaults:

```html
<!-- Auto-init with default settings: -->
<script disable-devtool-auto src="https://cdn.jsdelivr.net/npm/disable-devtool@latest"></script>
```

Or load and configure manually:

```html
<!-- Load first, then configure: -->
<script src="https://cdn.jsdelivr.net/npm/disable-devtool@latest"></script>
<script>
  DisableDevtool({
    url: 'https://yoursite.com/access-denied',
    interval: 500
  });
</script>
```

### Option C: Self-Host (Recommended for Production)

Serving from your own origin prevents the detection script from being easily blocked
by URL-based content filters:

```bash
# Download and save to your project:
curl -o public/js/disable-devtool.min.js \
  https://cdn.jsdelivr.net/npm/disable-devtool@latest/disable-devtool.min.js
```

```html
<script src="/js/disable-devtool.min.js"></script>
<script>
  DisableDevtool({ /* your config */ });
</script>
```

> [!TIP]
> Self-hosting is strongly preferred. A CDN-hosted script can be blocked by browser extensions
> (uBlock Origin) by URL pattern. When bundled into your own assets, it's harder to selectively
> target and block.

---

## 3. Configuration Reference

```javascript
DisableDevtool({
  // ─── Core Behaviour ───────────────────────────────────────────────────────

  url: '',
  // URL to redirect to when DevTools are detected.
  // Example: 'https://yoursite.com/access-denied'
  // If empty AND rewriteHTML is empty: attempts window.close() then falls back
  // to timeOutUrl after 500ms.

  rewriteHTML: '',
  // Replace the entire page HTML with this string when detected.
  // Example: '<h1>Access Denied</h1><p>Please close DevTools.</p>'
  // Takes priority over url if both are set.

  timeOutUrl: '',
  // Fallback URL if window.close() fails (popup blocker).
  // Default: 'https://theajack.github.io/disable-devtool/404.html?h=<host>'

  ondevtoolopen: null,
  // Custom callback instead of redirect/close. Receives (detectorType, next).
  // If set, url/rewriteHTML are IGNORED — you handle the response yourself.
  // Example:
  // ondevtoolopen: (type, next) => {
  //   console.warn('DevTools opened, type:', type);
  //   next(); // Call next() to proceed with default close action
  // }

  ondevtoolclose: null,
  // Callback when DevTools are closed after being detected.
  // Note: clearIntervalWhenDevOpenTrigger must be false for this to work.

  // ─── Timing ───────────────────────────────────────────────────────────────

  interval: 500,
  // Polling interval in milliseconds. Detectors run every N ms.
  // Lower = faster detection, higher CPU overhead.
  // Higher = delayed detection, lower overhead.
  // Recommended range: 200–1000ms.

  stopIntervalTime: 5000,
  // Time in ms before stopping the polling interval on mobile devices.
  // Reduces battery drain on mobile after initial check period.

  clearIntervalWhenDevOpenTrigger: false,
  // If true: stop polling after DevTools first detected (fire-and-forget).
  // If false: keep polling (allows ondevtoolclose callback to work).
  // Note: Automatically set to false if ondevtoolclose is configured.

  // ─── Detectors ────────────────────────────────────────────────────────────

  detectors: [0, 1, 2, 3, 4, 5, 6, 7],
  // Which detection methods to activate. See Section 4 for full explanation.
  // Default: all detectors. Can restrict to reduce false positives.
  // DetectorType values:
  //   0 = RegToString
  //   1 = DefineId
  //   2 = Size
  //   3 = DateToString
  //   4 = FuncToString
  //   5 = Debugger
  //   6 = Performance
  //   7 = DebugLib (Eruda, vConsole)

  // ─── UI Controls ──────────────────────────────────────────────────────────

  disableMenu: true,
  // Whether to block the right-click context menu.
  // Prevents 'Inspect Element' from the context menu.

  disableSelect: false,
  // Prevent text selection on the page.

  disableInputSelect: false,
  // Prevent text selection inside <input> elements.

  disableCopy: false,
  // Block Ctrl+C / Cmd+C copying.

  disableCut: false,
  // Block Ctrl+X / Cmd+X cutting.

  disablePaste: false,
  // Block Ctrl+V / Cmd+V pasting.

  // ─── Advanced ─────────────────────────────────────────────────────────────

  md5: '',
  // MD5 hash of your bypass key. See Section 5 for bypass setup.
  // Example: DisableDevtool.md5('mySecretKey') → use the result here.

  tkName: 'ddtk',
  // URL query parameter name used to pass the bypass token.
  // Example: https://yoursite.com/?ddtk=mySecretKey

  clearLog: true,
  // Whether to clear the console log on each poll cycle.
  // Prevents developers from reading console output.

  ignore: null,
  // Conditions under which to skip detection entirely.
  // Can be a function returning boolean, or array of URL strings/RegExps.
  // Example (skip on localhost):
  // ignore: () => location.hostname === 'localhost'
  // Example (skip on specific paths):
  // ignore: ['/admin', /^\/debug/]

  disableIframeParents: true,
  // If this page is inside an iframe, also disable DevTools in parent frames.

  seo: true,
  // If true, the library is SEO-friendly (avoids breaking crawlers).
});
```

---

## 4. Detector Types — Detailed Explanation

Each detector uses a different method to identify open DevTools. Understanding them
helps you choose the right combination for your use case.

### Detector 0 — RegToString

**Mechanism:** Creates a `RegExp` object with a custom `.toString()` getter. Chrome DevTools
calls `.toString()` on RegExp objects when rendering them in the console panel. The moment
the getter fires, DevTools is confirmed open.

```javascript
// What happens internally:
var trap = /./;
trap.toString = () => { /* devtools detected */ return '/./' };
console.log(trap); // DevTools renders this → .toString() fires
```

**Best for:** Detecting when the console panel is actively open and rendering output.
**False positive risk:** LOW — only fires when DevTools console is open and active.

---

### Detector 1 — DefineId

**Mechanism:** Creates a DOM element and traps its `.id` property getter via
`Object.defineProperty`. DevTools calls `.id` when displaying elements in the Elements
or Console panel.

```javascript
// Internally:
var el = document.createElement('div');
Object.defineProperty(el, 'id', {
  get: () => { /* devtools detected */ return 'trap-id'; }
});
console.log(el); // DevTools renders div#trap-id → .id fires
```

**Best for:** Catching DevTools open in any panel (Elements, Console, Network, etc.).
**False positive risk:** LOW.

---

### Detector 2 — Size

**Mechanism:** Compares `window.outerWidth/outerHeight` with `window.innerWidth/innerHeight`.
When DevTools is docked to the side or bottom of the browser, the inner viewport shrinks
while outer dimensions stay the same. A significant difference = DevTools docked.

```javascript
// Internally:
var widthDiff = window.outerWidth - window.innerWidth;
var heightDiff = window.outerHeight - window.innerHeight;
var THRESHOLD = 200; // px
if (widthDiff > THRESHOLD || heightDiff > THRESHOLD) {
  // DevTools likely docked
}
```

**Best for:** Simple reliable detection when DevTools is docked (most common position).
**False positive risk:** MEDIUM — triggers if user has browser zoom, OS scaling, or
browser chrome that happens to narrow the viewport. Use with caution on mobile.

> [!TIP]
> Detector 2 (Size) does **NOT** catch undocked DevTools (popped out into a separate window)
> because both dimensions stay the same. Combine it with other detectors for full coverage.

---

### Detector 3 — DateToString

**Mechanism:** Same pattern as RegToString but using a `Date` object:

```javascript
var d = new Date();
d.toString = () => { /* devtools detected */ return '...'; };
console.log(d); // DevTools renders the date → .toString() fires
```

**Best for:** Additional coverage alongside RegToString and FuncToString.
**False positive risk:** LOW.

---

### Detector 4 — FuncToString

**Mechanism:** Traps `Function.prototype.toString` at the individual function level:

```javascript
var f = function testFn() {};
f.toString = () => { /* devtools detected */ return 'function testFn() {}'; };
console.log(f); // DevTools shows function source → .toString() fires
```

**Best for:** Strong coverage — DevTools always formats function objects.
**False positive risk:** LOW.

---

### Detector 5 — Debugger

**Mechanism:** Timing-based. Places a `debugger;` statement inside a timing measurement:

```javascript
var start = Date.now();
(function() { debugger; })();
var elapsed = Date.now() - start;

// Normal execution (DevTools closed): elapsed < 5ms
// DevTools open with breakpoints active: elapsed > 100ms (paused at debugger)
if (elapsed > 100) { /* devtools detected */ }
```

**Best for:** Catching automated testing tools (Puppeteer, Playwright, Selenium) because
they maintain a persistent debugging session (Chrome DevTools Protocol) even in headless mode.
**False positive risk:** LOW on normal browsers. MEDIUM on slow/overloaded devices where
the timing threshold might be crossed unintentionally.

> [!NOTE]
> Detector 5 is particularly effective against automated headless browsers because Chrome DevTools
> Protocol (CDP) keeps a debugging session permanently active, making the `debugger;` timing
> check fire consistently regardless of whether a human is watching.

---

### Detector 6 — Performance

**Mechanism:** Measures how long a batch of `console.log()` calls takes:

```javascript
var start = performance.now();
for (var i = 0; i < 100; i++) {
  console.log('performance-check');
  console.clear();
}
var elapsed = performance.now() - start;

// DevTools closed: console.log is a near-no-op → < 5ms
// DevTools open: each log is rendered in DOM → > 50ms
if (elapsed > THRESHOLD) { /* devtools detected */ }
```

**Best for:** Complementary to Detector 5 — catches DevTools without breakpoints active.
**False positive risk:** MEDIUM on low-end devices or heavily loaded CPUs. Lower your
`interval` if you see false positives.

---

### Detector 7 — DebugLib

**Mechanism:** Checks for the global presence of third-party mobile debugging libraries:

```javascript
if (window.eruda || window.VConsole) { /* devtools detected */ }
// Also checks for injected DOM elements from these libraries
if (document.getElementById('eruda') || document.getElementById('__vconsole')) { ... }
```

**Best for:** Mobile environments where native DevTools are unavailable and users inject
Eruda or vConsole via bookmarklets.
**False positive risk:** NONE — only fires if these specific libraries are loaded.

---

## 5. Developer Bypass Setup (Recommended)

You should configure a bypass so that your own developers can inspect the application
without disabling the protection globally.

### How It Works

1. Choose a secret key (never commit this to code or version control)
2. Generate its MD5 hash
3. Pass the hash to the library
4. Developers access DevTools by adding `?ddtk=yourSecretKey` to the URL

### Setup

```javascript
// Step 1: Generate the hash (run this once, save the result):
const hash = DisableDevtool.md5('your-secret-key-here');
console.log('MD5 hash:', hash); // e.g. "5f4dcc3b5aa765d61d8327deb882cf99"

// Step 2: Use the hash in your config (NOT the key itself):
DisableDevtool({
  md5: '5f4dcc3b5aa765d61d8327deb882cf99', // ← The hash
  tkName: 'ddtk',                           // ← URL param name (customise if needed)
  url: 'https://yoursite.com/access-denied'
});
```

```
// Step 3: Developers bypass by visiting:
https://yoursite.com/?ddtk=your-secret-key-here
                           ↑ The raw key, not the hash
```

> [!IMPORTANT]
> - Store the **raw key** in a password manager or `.env` file — never in your source code
> - Only the **MD5 hash** goes in the code, which is safe to commit
> - Use a long, random key (at least 20 characters) to prevent brute-force guessing
> - Change the `tkName` from the default `ddtk` to something project-specific to avoid
>   easy discovery by someone who knows the library's defaults

### Environment-Based Bypass (Recommended for Dev/Staging)

Instead of a URL token, completely skip the library in non-production environments:

```javascript
// In React / Vite / Next.js:
import DisableDevtool from 'disable-devtool';

if (import.meta.env.PROD) {        // Vite
// if (process.env.NODE_ENV === 'production') {  // CRA / Next.js
  DisableDevtool({
    url: '/access-denied',
    detectors: [1, 3, 4, 5, 6, 7],
    interval: 500,
    disableMenu: true,
    md5: process.env.VITE_DEVTOOL_BYPASS_HASH
  });
}
// In development: library never loads → DevTools work normally
```

---

## 6. Recommended Configurations by Use Case

### Use Case A: SaaS Dashboard (Protect Business Logic)

```javascript
DisableDevtool({
  url: '/access-denied',          // Redirect to a polite "access denied" page
  interval: 500,
  disableMenu: true,
  detectors: [1, 3, 4, 5, 6, 7], // All except Size (avoids mobile false positives)
  clearLog: true,
  md5: 'YOUR_MD5_HASH_HERE',      // Developer bypass enabled
  ignore: () => {
    // Skip on localhost so developers can work normally
    return ['localhost', '127.0.0.1'].includes(location.hostname);
  }
});
```

---

### Use Case B: Online Exam / Quiz Platform

The strongest configuration — makes the page unusable when DevTools are open:

```javascript
DisableDevtool({
  rewriteHTML: `
    <div style="display:flex;align-items:center;justify-content:center;
                height:100vh;font-family:sans-serif;text-align:center">
      <div>
        <h2>Exam Paused</h2>
        <p>Developer tools are not allowed during the exam.<br>
           Please close them and refresh this page to continue.</p>
      </div>
    </div>
  `,
  interval: 200,                  // Faster polling for exams
  disableMenu: true,
  disableCopy: true,              // Block copying answers
  disableCut: true,
  detectors: [0, 1, 2, 3, 4, 5, 6, 7], // All detectors
  clearLog: false,
  clearIntervalWhenDevOpenTrigger: false,
  ondevtoolopen: (type, next) => {
    // Log the attempt server-side before triggering rewrite:
    fetch('/api/exam/integrity-violation', {
      method: 'POST',
      body: JSON.stringify({ type, time: Date.now() }),
      headers: { 'Content-Type': 'application/json' }
    });
    next(); // Proceed with rewriteHTML
  }
});
```

---

### Use Case C: Mobile Web App

Mobile DevTools (Eruda/vConsole injected via bookmarklet) are the primary concern:

```javascript
DisableDevtool({
  url: '/blocked',
  interval: 1000,          // Longer interval is fine on mobile (save battery)
  stopIntervalTime: 10000, // Stop polling after 10 seconds on mobile
  disableMenu: true,
  detectors: [2, 7],       // Size: catches docked mobile DevTools
                            // DebugLib: catches Eruda/vConsole
  // Avoid detectors 5+6 on mobile — performance thresholds may false-positive
  // on slow devices
});
```

---

### Use Case D: Internal Admin Panel

Hide implementation details from non-admin staff — but allow actual admins to debug:

```javascript
const isAdmin = document.cookie.includes('role=admin');

if (!isAdmin) {
  DisableDevtool({
    rewriteHTML: '<h1>Admin access only</h1>',
    disableMenu: true,
    detectors: [1, 3, 4, 5, 6],
    interval: 500,
    ignore: () => location.search.includes('internal=true') // Secondary bypass
  });
}
```

---

## 7. Avoiding False Positives

False positives (library triggering when DevTools is NOT open) are the biggest practical
problem. Here's how to diagnose and fix them.

### Diagnosing Which Detector is Triggering

```javascript
DisableDevtool({
  ondevtoolopen: (type, next) => {
    const detectorNames = {
      '-1': 'Unknown',
      '0': 'RegToString',
      '1': 'DefineId',
      '2': 'Size',
      '3': 'DateToString',
      '4': 'FuncToString',
      '5': 'Debugger',
      '6': 'Performance',
      '7': 'DebugLib'
    };
    console.warn(`[disable-devtool] Triggered by: ${detectorNames[type]} (type=${type})`);
    // DON'T call next() — let you observe without closing the page
  }
});
```

Run this on the device/browser causing false positives. The console output tells you
exactly which detector fired — then disable that specific one.

### Common False Positive Scenarios and Fixes

| Scenario | Detector | Fix |
|---|---|---|
| Slow/old mobile device | 6 (Performance) | Remove `6` from `detectors` array |
| Browser zoom at unusual level | 2 (Size) | Remove `2` from `detectors` |
| Page running inside iframe | 2 (Size) | Set `disableIframeParents: false` or remove `2` |
| Heavy CPU load on page | 5 (Debugger), 6 (Performance) | Increase `interval` to 1000+ |
| User has Grammarly / other extensions | 7 (DebugLib) | Remove `7` if false positives occur |
| Browser extensions modifying console | 0, 3, 4 | Remove the toString-based detectors |

---

## 8. Framework-Specific Integration

### React

```jsx
// src/security/devtool-protection.js
import DisableDevtool from 'disable-devtool';

let initialized = false;

export function initDevtoolProtection() {
  if (initialized || process.env.NODE_ENV !== 'production') return;
  initialized = true;

  DisableDevtool({
    url: `${process.env.REACT_APP_BASE_URL}/access-denied`,
    interval: 500,
    disableMenu: true,
    detectors: [1, 3, 4, 5, 6, 7],
    md5: process.env.REACT_APP_DEVTOOL_BYPASS_HASH,
    ignore: () => window.__DEVELOPER_MODE__ === true
  });
}

// Call in index.js / App.js:
// initDevtoolProtection();
```

### Vue 3

```javascript
// src/plugins/disable-devtool.js
import DisableDevtool from 'disable-devtool';

export default {
  install(app) {
    if (import.meta.env.PROD) {
      DisableDevtool({
        url: '/access-denied',
        interval: 500,
        disableMenu: true,
        detectors: [1, 3, 4, 5, 6, 7],
        md5: import.meta.env.VITE_DEVTOOL_BYPASS_HASH
      });
    }
  }
};

// In main.js:
// import DevtoolPlugin from './plugins/disable-devtool';
// app.use(DevtoolPlugin);
```

### Next.js

```javascript
// components/DevtoolProtection.js
'use client';
import { useEffect } from 'react';

export default function DevtoolProtection() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    import('disable-devtool').then(({ default: DisableDevtool }) => {
      DisableDevtool({
        url: '/access-denied',
        interval: 500,
        disableMenu: true,
        detectors: [1, 3, 4, 5, 6, 7],
        md5: process.env.NEXT_PUBLIC_DEVTOOL_BYPASS_HASH
      });
    });
  }, []);

  return null;
}

// In app/layout.js:
// import DevtoolProtection from '@/components/DevtoolProtection';
// Add <DevtoolProtection /> inside <body>
```

### Vanilla HTML

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Load it as early as possible in <head> for fastest detection -->
  <script src="/js/disable-devtool.min.js"></script>
  <script>
    DisableDevtool({
      url: '/access-denied.html',
      interval: 500,
      disableMenu: true,
      detectors: [1, 3, 4, 5, 6, 7],
      md5: '5f4dcc3b5aa765d61d8327deb882cf99' // md5('yourSecretKey')
    });
  </script>
</head>
<body>
  <!-- Page content -->
</body>
</html>
```

> [!TIP]
> Place the `<script>` in `<head>` rather than before `</body>`. Detection starts as soon as
> the script loads — the earlier it loads, the sooner detection begins. Loading it last means
> DevTools could be open and inspecting the page before protection kicks in.

---

## 9. What This Library Cannot Protect Against

Be explicit with stakeholders about these limitations:

| Attack | Protected? | Notes |
|---|---|---|
| Casual user pressing F12 | Yes | Keyboard shortcut blocked |
| Right-click > Inspect | Yes | Context menu disabled |
| DevTools opened before page load | No | Script not yet running |
| `view-source:yoursite.com` | No | Browser built-in, no JS involved |
| `curl` / `wget` / Postman requests | No | Library is frontend-only |
| Request interception (blocking the script) | No | Script never loads |
| Offline JS analysis (downloaded file) | No | No protection once file is local |
| Browser extensions (uBlock, Tampermonkey) | No | Run before page scripts |
| Server-side resource access | No | Irrelevant to frontend library |

**Bottom line:** This library raises the bar for casual inspection. It is not a replacement for:
- Server-side authentication and authorization
- API rate limiting
- Proper secrets management (no API keys in frontend code)
- Content Security Policy (CSP) headers
- Server-side input validation

---

## 10. Quick Reference Cheat Sheet

```javascript
// MINIMAL SETUP (copy-paste ready):
DisableDevtool({
  url: 'https://yoursite.com/blocked',
  detectors: [1, 3, 4, 5, 6, 7],
  interval: 500,
  disableMenu: true
});

// WITH DEVELOPER BYPASS:
DisableDevtool({
  url: 'https://yoursite.com/blocked',
  detectors: [1, 3, 4, 5, 6, 7],
  interval: 500,
  disableMenu: true,
  md5: DisableDevtool.md5('your-secret-key'), // Run once to get hash
  tkName: 'ddtk'  // Access via: yoursite.com/?ddtk=your-secret-key
});

// PRODUCTION-ONLY (skip in dev):
if (process.env.NODE_ENV === 'production') {
  DisableDevtool({ /* config */ });
}

// CHECK IF RUNNING:
console.log(DisableDevtool.isRunning); // true/false

// STOP DETECTION PROGRAMMATICALLY:
DisableDevtool.isSuspend = true;

// RESUME AFTER STOPPING:
DisableDevtool.isSuspend = false;
```

---

*Library: `disable-devtool` by theajack — MIT License*
*Docs: [github.com/theajack/disable-devtool](https://github.com/theajack/disable-devtool)*
