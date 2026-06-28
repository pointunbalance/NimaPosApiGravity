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
    employees: { toArray: () => [] },
    payroll: { toArray: () => [] },
    attendance: { toArray: () => [] },
    workShifts: { toArray: () => [] },
    rosterAssignments: {
      toArray: () => [],
      where: () => ({ between: () => ({ toArray: () => [] }) })
    },
    users: { toArray: () => [] }
  }
}));

import { EmployeeAnalytics } from '../pages/hr/EmployeeAnalytics';
import EmployeeSurveys from '../pages/hr/EmployeeSurveys';
import { WorkShifts } from '../pages/hr/WorkShifts';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

describe('HR Module Pages', () => {
  beforeEach(() => {
      jest.clearAllMocks();
      window.alert = jest.fn();
      window.print = jest.fn();
  });

  test('EmployeeAnalytics Page Renders', () => {
      render(<MemoryRouter><EmployeeAnalytics /></MemoryRouter>);
      expect(screen.getByText(/تحليلات/i)).toBeInTheDocument();
  });

  test('EmployeeSurveys Page Renders', () => {
      render(<MemoryRouter><EmployeeSurveys /></MemoryRouter>);
      expect(screen.getByText(/الاستبيانات/i)).toBeInTheDocument();
  });

  test('WorkShifts Page Renders', () => {
      render(<MemoryRouter><WorkShifts /></MemoryRouter>);
      expect(screen.getByText('إدارة الورديات وجداول العمل')).toBeInTheDocument();
  });
});
