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

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), addToast: vi.fn() })
}));

vi.mock('../db', () => ({
  db: {
    products: { toArray: () => [] },
    stockAdjustments: { toArray: () => [] },
    users: { toArray: () => [] }
  }
}));

import Consignments from '../pages/inventory/Consignments';
import MeasurementUnits from '../pages/inventory/MeasurementUnits';
import { DemandForecasting } from '../pages/inventory/DemandForecasting';

describe('Inventory Module Pages', () => {
  beforeEach(() => {
      jest.clearAllMocks();
      window.alert = jest.fn();
      window.print = jest.fn();
  });

  test('Consignments Page Renders', () => {
      render(<MemoryRouter><Consignments /></MemoryRouter>);
      expect(screen.getByText(/بضاعة الأمانة/i)).toBeInTheDocument();
  });

  test('MeasurementUnits Page Renders', () => {
      render(<MemoryRouter><MeasurementUnits /></MemoryRouter>);
      expect(screen.getByText('إدارة الوحدات القياسية العالمية (Global UoM)')).toBeInTheDocument();
  });

  test('DemandForecasting Page Renders', () => {
      render(<MemoryRouter><DemandForecasting /></MemoryRouter>);
      expect(screen.getByText('توقعات الطلب (AI)')).toBeInTheDocument();
  });
});
