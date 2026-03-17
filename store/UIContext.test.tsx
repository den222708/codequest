import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { UIProvider, useUI } from './UIContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(UIProvider, null, children);
}

describe('UIContext', () => {
  describe('useUI hook', () => {
    it('throws when used outside provider', () => {
      expect(() => {
        renderHook(() => useUI());
      }).toThrow('useUI must be used within UIProvider');
    });

    it('provides default values', () => {
      const { result } = renderHook(() => useUI(), { wrapper });
      expect(result.current.darkMode).toBe(false);
      expect(result.current.sidebarCollapsed).toBe(false);
    });

    it('toggleDarkMode toggles dark mode', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.toggleDarkMode();
      });
      expect(result.current.darkMode).toBe(true);

      act(() => {
        result.current.toggleDarkMode();
      });
      expect(result.current.darkMode).toBe(false);
    });

    it('toggleSidebar toggles sidebar collapsed', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.toggleSidebar();
      });
      expect(result.current.sidebarCollapsed).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });
      expect(result.current.sidebarCollapsed).toBe(false);
    });

    it('dark mode adds/removes class on documentElement', () => {
      const { result } = renderHook(() => useUI(), { wrapper });

      act(() => {
        result.current.toggleDarkMode();
      });
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      act(() => {
        result.current.toggleDarkMode();
      });
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
