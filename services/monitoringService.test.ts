/**
 * Tests for monitoringService — client-side proctoring detector.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { monitoringService } from './monitoringService';
import type { ViolationType, ViolationHandler } from './monitoringService';

describe('MonitoringService', () => {
  let violations: Array<{ type: ViolationType; detail?: string }>;
  let onViolation: ViolationHandler;

  beforeEach(() => {
    violations = [];
    onViolation = (type, detail) => violations.push({ type, detail });
  });

  afterEach(() => {
    monitoringService.stop();
  });

  it('starts and stops without errors', () => {
    monitoringService.start({ onViolation });
    expect(monitoringService.getIsActive()).toBe(true);

    monitoringService.stop();
    expect(monitoringService.getIsActive()).toBe(false);
  });

  it('does not start twice', () => {
    monitoringService.start({ onViolation });
    monitoringService.start({ onViolation }); // second call should be no-op
    expect(monitoringService.getIsActive()).toBe(true);
  });

  it('stops cleanly even if not started', () => {
    monitoringService.stop();
    expect(monitoringService.getIsActive()).toBe(false);
  });

  it('reports tab switch on visibilitychange', () => {
    monitoringService.start({ onViolation });

    // Simulate hidden
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('tab_switch');

    // Restore
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
  });

  it('does not report tab switch when document is visible', () => {
    monitoringService.start({ onViolation });

    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(violations).toHaveLength(0);
  });

  it('reports paste detection', () => {
    monitoringService.start({ onViolation });

    const pasteEvent = new Event('paste') as any;
    pasteEvent.clipboardData = {
      getData: () => 'pasted text here',
    };
    document.dispatchEvent(pasteEvent);

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('paste_detected');
    expect(violations[0].detail).toContain('16 chars');
  });

  it('reports copy as clipboard access', () => {
    monitoringService.start({ onViolation });
    document.dispatchEvent(new Event('copy'));

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('clipboard_access');
    expect(violations[0].detail).toContain('Copy');
  });

  it('reports cut as clipboard access', () => {
    monitoringService.start({ onViolation });
    document.dispatchEvent(new Event('cut'));

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('clipboard_access');
    expect(violations[0].detail).toContain('Cut');
  });

  it('reports focus lost on window blur', () => {
    monitoringService.start({ onViolation });
    window.dispatchEvent(new Event('blur'));

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('focus_lost');
  });

  it('reports offline event', () => {
    const onOnlineChange = vi.fn();
    monitoringService.start({ onViolation, onOnlineChange });
    window.dispatchEvent(new Event('offline'));

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('offline');
    expect(onOnlineChange).toHaveBeenCalledWith(false);
  });

  it('calls onOnlineChange with true on online event', () => {
    const onOnlineChange = vi.fn();
    monitoringService.start({ onViolation, onOnlineChange });
    window.dispatchEvent(new Event('online'));

    // online event does not create a violation
    expect(violations).toHaveLength(0);
    expect(onOnlineChange).toHaveBeenCalledWith(true);
  });

  it('reports fullscreen exit', () => {
    const onFullscreenChange = vi.fn();
    monitoringService.start({ onViolation, onFullscreenChange });

    // Simulate fullscreen exit (document.fullscreenElement = null by default in jsdom)
    document.dispatchEvent(new Event('fullscreenchange'));

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('fullscreen_exit');
    expect(onFullscreenChange).toHaveBeenCalledWith(false);
  });

  it('removes all listeners on stop', () => {
    monitoringService.start({ onViolation });
    monitoringService.stop();

    // Events after stop should not trigger violations
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('blur'));

    expect(violations).toHaveLength(0);

    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
  });

  it('getIsOnline returns navigator.onLine', () => {
    expect(monitoringService.getIsOnline()).toBe(navigator.onLine);
  });

  it('getIsFullscreen returns false in test environment', () => {
    expect(monitoringService.getIsFullscreen()).toBe(false);
  });

  it('truncates long paste content in detail', () => {
    monitoringService.start({ onViolation });

    const longText = 'x'.repeat(200);
    const pasteEvent = new Event('paste') as any;
    pasteEvent.clipboardData = {
      getData: () => longText,
    };
    document.dispatchEvent(pasteEvent);

    expect(violations[0].detail).toContain('200 chars');
    expect(violations[0].detail).toContain('...');
  });
});

describe('ViolationType', () => {
  it('covers all 7 violation types', () => {
    const types: ViolationType[] = [
      'tab_switch',
      'paste_detected',
      'fullscreen_exit',
      'clipboard_access',
      'offline',
      'focus_lost',
      'devtools_open',
    ];
    expect(types).toHaveLength(7);
  });
});
