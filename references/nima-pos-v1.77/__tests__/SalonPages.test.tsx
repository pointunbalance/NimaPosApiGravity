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

// Mock ToastContext
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    addToast: vi.fn(),
  })
}));

// Mock Database
vi.mock('../db', () => ({
  db: {
    salonAppointments: { toArray: () => [] },
    salonServices: { toArray: () => [] },
    salonChairs: { toArray: () => [] },
    salonStaff: { toArray: () => [] },
    salonCommissions: { toArray: () => [] },
    users: { toArray: () => [] },
    syncQueue: {
      where: () => ({
        equals: () => ({ toArray: () => [] })
      }),
      update: () => Promise.resolve()
    }
  }
}));

// Setup ResizeObserver mock
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Imports of Salon components
import { SalonDashboard } from '../pages/salon/SalonDashboard';
import { SalonAppointments } from '../pages/salon/SalonAppointments';
import { SalonServices } from '../pages/salon/SalonServices';
import { SalonChairs } from '../pages/salon/SalonChairs';
import { SalonStaff } from '../pages/salon/SalonStaff';
import { SalonCommissions } from '../pages/salon/SalonCommissions';

describe('Salon Module Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    window.print = jest.fn();
  });

  const checkHasAnyOf = (regexes: RegExp[]) => {
    const found = regexes.some(regex => screen.queryAllByText(regex).length > 0);
    expect(found).toBe(true);
  };

  test('Salon Dashboard Renders', () => {
    render(
      <MemoryRouter>
        <SalonDashboard />
      </MemoryRouter>
    );
    checkHasAnyOf([/لوحة/i, /الصالون/i, /التجميلي/i, /إيرادات/i]);
  });

  test('Salon Appointments Page Renders', () => {
    render(
      <MemoryRouter>
        <SalonAppointments />
      </MemoryRouter>
    );
    checkHasAnyOf([/المواعيد/i, /موعِد/i, /حجز/i, /إضافة/i]);
  });

  test('Salon Services Page Renders', () => {
    render(
      <MemoryRouter>
        <SalonServices />
      </MemoryRouter>
    );
    checkHasAnyOf([/الخدمات/i, /خدمة/i, /سعر/i, /إضافة/i]);
  });

  test('Salon Chairs Page Renders', () => {
    render(
      <MemoryRouter>
        <SalonChairs />
      </MemoryRouter>
    );
    checkHasAnyOf([/الكراسي/i, /كرسي/i, /حالة/i, /إضافة/i]);
  });

  test('Salon Staff Page Renders', () => {
    render(
      <MemoryRouter>
        <SalonStaff />
      </MemoryRouter>
    );
    checkHasAnyOf([/الموظفين/i, /طاقم/i, /موظف/i, /إضافة/i]);
  });

  test('Salon Commissions Page Renders', () => {
    render(
      <MemoryRouter>
        <SalonCommissions />
      </MemoryRouter>
    );
    checkHasAnyOf([/العمولات/i, /عمولة/i, /نسبة/i, /إضافة/i]);
  });
});
