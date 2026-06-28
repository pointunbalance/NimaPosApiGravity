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
    products: { toArray: () => [] },
    categories: { toArray: () => [] },
    settings: {
      toCollection: () => ({
        first: () => ({ id: 1, storeName: 'Nima Restaurant', currency: 'IQD', currencyCode: 'IQD' })
      })
    },
    orders: {
      toArray: () => [],
      orderBy: () => ({
        reverse: () => ({
          limit: () => ({ toArray: () => [] })
        })
      })
    },
    restaurantTablesList: { toArray: () => [] },
    restaurantStaffList: { toArray: () => [] },
    users: {
      toArray: () => [],
      filter: () => ({
        toArray: () => []
      })
    },
    expenses: { toArray: () => [] },
    shifts: { toArray: () => [] },
    suppliers: { toArray: () => [] },
    voidLogs: { toArray: () => [] },
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

// Imports of Restaurant components (Named vs Default exports verified)
import CustomerMenu from '../pages/restaurant/CustomerMenu';
import RestaurantMenu from '../pages/restaurant/RestaurantMenu';
import RestaurantPOS from '../pages/restaurant/RestaurantPOS';
import { RestaurantReports } from '../pages/restaurant/RestaurantReports';
import { RestaurantStaff } from '../pages/restaurant/RestaurantStaff';

describe('Restaurant Module Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    window.print = jest.fn();
  });

  const checkHasAnyOf = (regexes: RegExp[]) => {
    const found = regexes.some(regex => screen.queryAllByText(regex).length > 0);
    expect(found).toBe(true);
  };

  test('CustomerMenu Page Renders', () => {
    render(
      <MemoryRouter>
        <CustomerMenu />
      </MemoryRouter>
    );
    checkHasAnyOf([/الطاولة/i, /Restaurant/i, /قائمة/i, /ابحث/i, /أطباق/i]);
  });

  test('RestaurantMenu Page Renders', () => {
    render(
      <MemoryRouter>
        <RestaurantMenu />
      </MemoryRouter>
    );
    checkHasAnyOf([/طباعة/i, /تصميم/i, /المنيو/i, /الطعام/i]);
  });

  test('RestaurantPOS Page Renders', () => {
    render(
      <MemoryRouter>
        <RestaurantPOS />
      </MemoryRouter>
    );
    checkHasAnyOf([/صالة/i, /مبيعات/i, /طاولات/i, /المطعم/i, /طاولة/i]);
  });

  test('RestaurantReports Page Renders', () => {
    render(
      <MemoryRouter>
        <RestaurantReports />
      </MemoryRouter>
    );
    checkHasAnyOf([/تقارير/i, /مبيعات/i, /التحليلات/i, /المطعم/i, /الأكثر مبيعاً/i]);
  });

  test('RestaurantStaff Page Renders', () => {
    render(
      <MemoryRouter>
        <RestaurantStaff />
      </MemoryRouter>
    );
    checkHasAnyOf([/طاقم/i, /العمل/i, /موظف/i, /موظفين/i, /إضافة/i]);
  });
});
