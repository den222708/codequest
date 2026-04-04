/**
 * DevTools Protection — integrates `disable-devtool` with the existing
 * MonitoringService proctoring pipeline.
 *
 * Behaviour:
 *   - Production only (skipped when `import.meta.env.DEV` is true)
 *   - Replaces the page with an "Exam Paused" overlay when DevTools open
 *   - Fires a `devtools_open` violation through the configured callback
 *   - Developer bypass via `?ddtk=<key>` (MD5 hash stored in VITE_DEVTOOL_BYPASS_HASH)
 *   - Uses detectors [1, 3, 4, 5, 6, 7] (skips Size to avoid mobile false positives)
 */

import DisableDevtool from 'disable-devtool';

export interface DevtoolProtectionConfig {
  /** Called when DevTools are detected */
  onDetected?: (detectorType: number) => void;
  /** MD5 hash of the bypass key (from env) */
  bypassHash?: string;
  /** URL param name for bypass token */
  bypassParam?: string;
  /** Polling interval in ms */
  interval?: number;
}

let initialized = false;

/**
 * Initialize disable-devtool protection. Safe to call multiple times;
 * subsequent calls are no-ops.
 */
export function initDevtoolProtection(config: DevtoolProtectionConfig = {}): void {
  if (initialized) return;

  // Only activate in production builds
  if (import.meta.env.DEV) return;

  initialized = true;

  const {
    onDetected,
    bypassHash,
    bypassParam = 'ddtk',
    interval = 500,
  } = config;

  DisableDevtool({
    rewriteHTML: `
      <div style="display:flex;align-items:center;justify-content:center;
                  height:100vh;font-family:system-ui,sans-serif;text-align:center;
                  background:#0f172a;color:#e2e8f0">
        <div>
          <h2 style="font-size:1.5rem;margin-bottom:0.75rem">Exam Paused</h2>
          <p style="max-width:400px;line-height:1.6;color:#94a3b8">
            Developer tools are not allowed during the assessment.<br>
            Please close them and refresh this page to continue.
          </p>
        </div>
      </div>
    `,
    interval,
    disableMenu: true,
    disableCopy: true,
    disableCut: true,
    detectors: [1, 3, 4, 5, 6, 7],
    clearLog: false,
    clearIntervalWhenDevOpenTrigger: false,
    ...(bypassHash ? { md5: bypassHash, tkName: bypassParam } : {}),
    ondevtoolopen: (type: number, next: () => void) => {
      onDetected?.(type);
      next();
    },
  });
}

/**
 * Check whether disable-devtool is currently running.
 */
export function isDevtoolProtectionActive(): boolean {
  return initialized;
}
