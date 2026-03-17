/**
 * Client-side Monitoring Service — SEB-inspired proctoring detector.
 *
 * Detects and reports:
 *   - Tab switches (visibilitychange)
 *   - Paste events
 *   - Fullscreen exits
 *   - Clipboard access (copy/cut)
 *   - Offline/online transitions
 *   - Window focus loss (blur)
 *   - DevTools open (heuristic)
 *
 * Only active during proctored assessments. Events are emitted via
 * the realtimeService Socket.IO connection.
 */

export type ViolationType =
  | 'tab_switch'
  | 'paste_detected'
  | 'fullscreen_exit'
  | 'clipboard_access'
  | 'offline'
  | 'focus_lost'
  | 'devtools_open';

export type ViolationHandler = (type: ViolationType, detail?: string) => void;

interface MonitoringConfig {
  /** Called when a violation is detected */
  onViolation: ViolationHandler;
  /** Called when fullscreen state changes */
  onFullscreenChange?: (isFullscreen: boolean) => void;
  /** Called when online state changes */
  onOnlineChange?: (isOnline: boolean) => void;
  /** Whether to enforce fullscreen (request on start) */
  enforceFullscreen?: boolean;
}

class MonitoringService {
  private config: MonitoringConfig | null = null;
  private isActive = false;
  private listeners: Array<{ target: EventTarget; event: string; handler: EventListener }> = [];

  // Devtools detection state
  private devtoolsCheckInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start monitoring for violations.
   */
  start(config: MonitoringConfig): void {
    if (this.isActive) return;
    this.config = config;
    this.isActive = true;

    // ── Tab visibility ──────────────────────────────────────
    this.addListener(document, 'visibilitychange', () => {
      if (document.hidden) {
        this.config?.onViolation('tab_switch', 'Document became hidden');
      }
    });

    // ── Paste detection ─────────────────────────────────────
    this.addListener(document, 'paste', (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      const pastedText = clipboardEvent.clipboardData?.getData('text') ?? '';
      const truncated = pastedText.length > 100 ? pastedText.slice(0, 100) + '...' : pastedText;
      this.config?.onViolation('paste_detected', `Pasted ${pastedText.length} chars: "${truncated}"`);
    });

    // ── Copy/Cut (clipboard access) ─────────────────────────
    this.addListener(document, 'copy', () => {
      this.config?.onViolation('clipboard_access', 'Copy event detected');
    });
    this.addListener(document, 'cut', () => {
      this.config?.onViolation('clipboard_access', 'Cut event detected');
    });

    // ── Fullscreen exit ─────────────────────────────────────
    this.addListener(document, 'fullscreenchange', () => {
      const isFullscreen = !!document.fullscreenElement;
      this.config?.onFullscreenChange?.(isFullscreen);
      if (!isFullscreen) {
        this.config?.onViolation('fullscreen_exit', 'Exited fullscreen mode');
      }
    });

    // ── Online/Offline ──────────────────────────────────────
    this.addListener(window, 'offline', () => {
      this.config?.onOnlineChange?.(false);
      this.config?.onViolation('offline', 'Connection lost');
    });
    this.addListener(window, 'online', () => {
      this.config?.onOnlineChange?.(true);
    });

    // ── Focus loss ──────────────────────────────────────────
    this.addListener(window, 'blur', () => {
      this.config?.onViolation('focus_lost', 'Window lost focus');
    });

    // ── DevTools detection (heuristic) ──────────────────────
    // Uses console timing: when devtools is open, console.log is slower
    this.startDevtoolsDetection();

    // ── Request fullscreen if configured ────────────────────
    if (config.enforceFullscreen) {
      this.requestFullscreen();
    }
  }

  /**
   * Stop all monitoring and remove listeners.
   */
  stop(): void {
    if (!this.isActive) return;
    this.isActive = false;

    // Remove all event listeners
    for (const { target, event, handler } of this.listeners) {
      target.removeEventListener(event, handler);
    }
    this.listeners = [];

    // Stop devtools detection
    if (this.devtoolsCheckInterval) {
      clearInterval(this.devtoolsCheckInterval);
      this.devtoolsCheckInterval = null;
    }

    this.config = null;
  }

  /**
   * Check if monitoring is currently active.
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Get current fullscreen state.
   */
  getIsFullscreen(): boolean {
    return !!document.fullscreenElement;
  }

  /**
   * Get current online state.
   */
  getIsOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Request fullscreen mode.
   */
  async requestFullscreen(): Promise<boolean> {
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Exit fullscreen mode.
   */
  async exitFullscreen(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }

  // ── Private helpers ─────────────────────────────────────────

  private addListener(target: EventTarget, event: string, handler: EventListener): void {
    target.addEventListener(event, handler);
    this.listeners.push({ target, event, handler });
  }

  private startDevtoolsDetection(): void {
    // Heuristic: create an object with a custom getter. When devtools
    // inspects it (e.g. via console), the getter fires. We use a threshold
    // to detect repeated access patterns that indicate devtools is open.
    let devtoolsDetected = false;

    this.devtoolsCheckInterval = setInterval(() => {
      const threshold = 160; // ms — devtools console.log overhead
      const start = performance.now();
      // This trick works because devtools needs to evaluate the object
      // when the console panel is open
      // eslint-disable-next-line no-debugger
      const check = new Image();
      Object.defineProperty(check, 'id', {
        get: () => {
          // If this getter is called, devtools is likely open
          if (!devtoolsDetected) {
            devtoolsDetected = true;
            this.config?.onViolation('devtools_open', 'DevTools detected via object inspection');
          }
        },
      });
      // Attempt to trigger devtools object inspection
      console.debug('%c', check as unknown as string);
      const end = performance.now();

      // Additional timing-based check
      if (end - start > threshold && !devtoolsDetected) {
        devtoolsDetected = true;
        this.config?.onViolation('devtools_open', 'DevTools detected via timing heuristic');
      }

      // Reset detection flag after cooldown (only flag once per 30s)
      if (devtoolsDetected) {
        setTimeout(() => { devtoolsDetected = false; }, 30_000);
      }
    }, 5_000);
  }
}

export const monitoringService = new MonitoringService();
export default monitoringService;
