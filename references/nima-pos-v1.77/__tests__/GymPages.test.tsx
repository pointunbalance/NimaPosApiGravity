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
    gymMembershipsList: { toArray: () => [] },
    gymClassesList: { toArray: () => [] },
    gymTrainersList: { toArray: () => [] },
    gymEquipmentList: { toArray: () => [] },
    gymStoreList: { toArray: () => [] },
    gymAccessControlLogs: { toArray: () => [] },
    gymStaffList: { toArray: () => [] },
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

// Imports of Gym components
import { GymDashboard } from '../pages/gym/Dashboard';
import { Memberships } from '../pages/gym/Memberships';
import { Classes } from '../pages/gym/Classes';
import { Trainers } from '../pages/gym/Trainers';
import { Equipment } from '../pages/gym/Equipment';
import { GymStore } from '../pages/gym/GymStore';
import { AccessControl } from '../pages/gym/AccessControl';
import { GymStaff } from '../pages/gym/GymStaff';

describe('Gym Module Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    window.print = jest.fn();
  });

  const checkHasAnyOf = (regexes: RegExp[]) => {
    const found = regexes.some(regex => screen.queryAllByText(regex).length > 0);
    expect(found).toBe(true);
  };

  test('Gym Dashboard Renders', () => {
    render(
      <MemoryRouter>
        <GymDashboard />
      </MemoryRouter>
    );
    checkHasAnyOf([/لوحة/i, /النادي/i, /الأعضاء/i, /ملخص/i]);
  });

  test('Gym Memberships Page Renders', () => {
    render(
      <MemoryRouter>
        <Memberships />
      </MemoryRouter>
    );
    checkHasAnyOf([/الاشتراكات/i, /عضوية/i, /مشترك/i, /جديد/i]);
  });

  test('Gym Classes Page Renders', () => {
    render(
      <MemoryRouter>
        <Classes />
      </MemoryRouter>
    );
    checkHasAnyOf([/حصص/i, /تدريب/i, /الحصص/i, /التدريبية/i]);
  });

  test('Gym Trainers Page Renders', () => {
    render(
      <MemoryRouter>
        <Trainers />
      </MemoryRouter>
    );
    checkHasAnyOf([/المدرب/i, /مدربين/i, /المدربون/i, /الرياضي/i]);
  });

  test('Gym Equipment Page Renders', () => {
    render(
      <MemoryRouter>
        <Equipment />
      </MemoryRouter>
    );
    checkHasAnyOf([/صيانة/i, /أجهزة/i, /الأجهزة/i, /المعدات/i]);
  });

  test('Gym Store Page Renders', () => {
    render(
      <MemoryRouter>
        <GymStore />
      </MemoryRouter>
    );
    checkHasAnyOf([/متجر/i, /مبيعات/i, /منتجات/i, /جديد/i]);
  });

  test('Gym Access Control Page Renders', () => {
    render(
      <MemoryRouter>
        <AccessControl />
      </MemoryRouter>
    );
    checkHasAnyOf([/بوابات/i, /دخول/i, /بوابة/i, /الأعضاء/i]);
  });

  test('Gym Staff Page Renders', () => {
    render(
      <MemoryRouter>
        <GymStaff />
      </MemoryRouter>
    );
    checkHasAnyOf([/موظف/i, /موظفين/i, /طاقم/i, /رواتب/i]);
  });
});
