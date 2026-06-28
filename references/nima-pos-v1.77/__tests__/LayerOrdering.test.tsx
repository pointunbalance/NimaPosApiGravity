import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import Layout from '../components/Layout';

// Mock context and Dexie queries
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
    // Return mocked empty collections/objects to prevent DB queries during simple mounting structure test
    return undefined;
  }
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    showToast: vi.fn(),
    warning: vi.fn(),
  }),
  ToastProvider: ({ children }: any) => <>{children}</>,
}));

describe('Layout Layer Stacking & POS Stacking Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('Content Viewport should have lower z-index (z-10) by default on POS pages when no modals are open', () => {
    // Render Layout with a POS Page route path
    render(
      <MemoryRouter initialEntries={['/wholesale-pos']}>
        <Layout />
      </MemoryRouter>
    );

    const viewport = screen.getByTestId('content-viewport');
    expect(viewport).toBeInTheDocument();
    
    // POS Page without active full-screen modals should sit at z-10 
    // This allows default Sidebar (z-30) and Header (z-20/z-30) menus to float on top of POS layout
    expect(viewport.className).toContain('z-10');
    expect(viewport.className).not.toContain('z-40');
  });

  test('Content Viewport should dynamically escalate to z-40 when a modal backdrop exists in the DOM', async () => {
    // Render Layout with a POS Page route path
    render(
      <MemoryRouter initialEntries={['/pos']}>
        <Layout />
      </MemoryRouter>
    );

    const viewport = screen.getByTestId('content-viewport');
    expect(viewport).toBeInTheDocument();
    
    // Initially, count is zero modal backdrops, therefore viewport is at z-10
    expect(viewport.className).toContain('z-10');

    // Simulate modal window open event by appending a backdrop element into document body
    act(() => {
      const backdrop = document.createElement('div');
      backdrop.className = 'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm';
      document.body.appendChild(backdrop);
    });

    // Wait for the mutation observer to trigger react state update and apply high z-index
    await waitFor(() => {
      expect(viewport.className).toContain('z-40');
    });

    // Verify it is no longer containing z-10
    expect(viewport.className).not.toContain('z-10');
  });
});
