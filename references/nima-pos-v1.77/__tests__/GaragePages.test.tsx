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

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

vi.mock('../db', () => ({
  db: {
    garageJobsList: { toArray: () => [] },
    garageVehiclesList: { toArray: () => [] },
    garageSpareParts: { toArray: () => [] },
    garageInvoices: { toArray: () => [] },
    users: { toArray: () => [] }
  }
}));

import { GarageDashboard as Dashboard } from '../pages/garage/Dashboard';
import { Jobs } from '../pages/garage/Jobs';
import { Vehicles } from '../pages/garage/Vehicles';
import { SpareParts } from '../pages/garage/SpareParts';
import { GarageStaff } from '../pages/garage/GarageStaff';

describe('Garage Module Pages', () => {
  beforeEach(() => {
      jest.clearAllMocks();
      window.alert = jest.fn();
      window.print = jest.fn();
  });

  test('Dashboard Renders', () => {
      render(<MemoryRouter><Dashboard /></MemoryRouter>);
      expect(screen.getByText('لوحة الورشة')).toBeInTheDocument();
  });

  test('Jobs Page Renders', () => {
      render(<MemoryRouter><Jobs /></MemoryRouter>);
      expect(screen.getByText('أوامر الشغل')).toBeInTheDocument();
  });

  test('Vehicles Page Renders', () => {
      render(<MemoryRouter><Vehicles /></MemoryRouter>);
      expect(screen.getByText('سجل المركبات')).toBeInTheDocument();
  });

  test('SpareParts Page Renders', () => {
      render(<MemoryRouter><SpareParts /></MemoryRouter>);
      expect(screen.getByText('قطع الغيار')).toBeInTheDocument();
  });

  test('GarageStaff Page Renders', () => {
      render(<MemoryRouter><GarageStaff /></MemoryRouter>);
      expect(screen.getByText('إدارة موظفي الورشة')).toBeInTheDocument();
  });
});
