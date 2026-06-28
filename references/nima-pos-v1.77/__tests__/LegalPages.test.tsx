import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Declare Jest globals
declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

// Mock Dexie and hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
      try {
          return fn();
      } catch (e) {
          return undefined;
      }
  }
}));

vi.mock('../db', () => ({
  db: {
    legalClients: { toArray: () => [] },
    legalCases: { toArray: () => [] },
    legalDocuments: { toArray: () => [] },
    legalAgenda: { toArray: () => [] },
    users: { toArray: () => [] }
  }
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), addToast: vi.fn() })
}));

import { LegalClients } from '../pages/legal/LegalClients';
import { LegalAgenda } from '../pages/legal/LegalAgenda';
import LegalDocuments from '../pages/legal/LegalDocuments';

describe('Legal Module Pages', () => {
  beforeEach(() => {
      jest.clearAllMocks();
      window.alert = jest.fn();
      window.print = jest.fn();
  });

  test('LegalClients Page Renders', () => {
      render(<MemoryRouter><LegalClients /></MemoryRouter>);
      expect(screen.getByText('سجل الموكلين والخصوم')).toBeInTheDocument();
  });

  test('LegalAgenda Page Renders', () => {
      render(<MemoryRouter><LegalAgenda /></MemoryRouter>);
      expect(screen.getByText(/الأجندة/i)).toBeInTheDocument();
  });

  test('LegalDocuments Page Renders', () => {
      render(<MemoryRouter><LegalDocuments /></MemoryRouter>);
      expect(screen.getByText('الإدارة القانونية والمستندات')).toBeInTheDocument();
  });
});
