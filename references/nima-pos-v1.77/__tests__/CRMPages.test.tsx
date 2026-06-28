import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Declare globals
declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

// Mock context
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), addToast: vi.fn() })
}));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Mock Dexie and hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
      try {
          return fn();
      } catch (e) {
          return [];
      }
  }
}));

vi.mock('../db', () => ({
  db: {
    // Add any necessary DB mocks for CRM models
    customers: { toArray: () => [] }
  }
}));

import CustomerTimeline from '../pages/crm/CustomerTimeline';
import Helpdesk from '../pages/crm/Helpdesk';
import LeadsPipeline from '../pages/crm/LeadsPipeline';
import MarketingCampaigns from '../pages/crm/MarketingCampaigns';

describe('CRM Module Pages', () => {
  beforeEach(() => {
      vi.clearAllMocks();
  });

  test('CustomerTimeline Page Renders', () => {
      render(<MemoryRouter><CustomerTimeline /></MemoryRouter>);
      expect(screen.getByText('سجل تفاعل العملاء (Timeline)')).toBeInTheDocument();
  });

  test('Helpdesk Page Renders', () => {
      render(<MemoryRouter><Helpdesk /></MemoryRouter>);
      expect(screen.getByText('الدعم الفني والتذاكر')).toBeInTheDocument();
  });

  test('LeadsPipeline Page Renders', () => {
      render(<MemoryRouter><LeadsPipeline /></MemoryRouter>);
      expect(screen.getByText('إدارة الفرص والمبيعات (Pipeline)')).toBeInTheDocument();
  });

  test('MarketingCampaigns Page Renders', () => {
      render(<MemoryRouter><MarketingCampaigns /></MemoryRouter>);
      expect(screen.getByText('الحملات التسويقية')).toBeInTheDocument();
  });
});
