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
    doctors: { toArray: () => [] },
    customers: { toArray: () => [] },
    appointments: {
      toArray: () => [],
      filter: () => ({ toArray: () => [] }),
      where: () => ({
        equals: () => ({ toArray: () => [] }),
        anyOf: () => ({ toArray: () => [] }),
      })
    },
    medicalRecords: { toArray: () => [] },
    clinicInventoryItems: { toArray: () => [] },
    clinicInvoices: { toArray: () => [] },
    auditLogs: {
      orderBy: () => ({
        reverse: () => ({
          limit: () => ({ toArray: () => [] })
        })
      })
    },
    recycleBin: {
      orderBy: () => ({
        reverse: () => ({ toArray: () => [] })
      })
    },
    assets: {
      where: () => ({
        equals: () => ({ toArray: () => [] })
      })
    },
    clinicStaffList: { toArray: () => [] },
    clinicServicesList: { toArray: () => [] },
    clinicInsuranceList: { toArray: () => [] },
    clinicBranches: { toArray: () => [] },
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

// Mock speech recognition support to avoid webkitSpeechRecognition crashes in test
if (typeof window !== 'undefined') {
  window.SpeechRecognition = function() {
    return {
      start: vi.fn(),
      stop: vi.fn(),
    };
  };
  window.webkitSpeechRecognition = window.SpeechRecognition;
}

// Imports of Clinic components
import ClinicDashboard from '../pages/clinics/ClinicDashboard';
import ClinicDoctors from '../pages/clinics/ClinicDoctors';
import ClinicPatients from '../pages/clinics/ClinicPatients';
import ClinicReception from '../pages/clinics/ClinicReception';
import { ClinicReports } from '../pages/clinics/ClinicReports';
import { PhysicianCockpit } from '../pages/clinics/PhysicianCockpit';

describe('Clinic Module Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    window.print = jest.fn();
  });

  const checkHasAnyOf = (regexes: RegExp[]) => {
    const found = regexes.some(regex => screen.queryAllByText(regex).length > 0);
    expect(found).toBe(true);
  };

  test('Clinic Dashboard Page Renders', () => {
    render(
      <MemoryRouter>
        <ClinicDashboard />
      </MemoryRouter>
    );
    checkHasAnyOf([/العياد/i, /لوحة/i, /طبيب/i, /مستند/i, /ملخص/i]);
  });

  test('Clinic Doctors Page Renders', () => {
    render(
      <MemoryRouter>
        <ClinicDoctors />
      </MemoryRouter>
    );
    checkHasAnyOf([/الأطباء/i, /طبيب/i, /دكتور/i, /إضافة/i]);
  });

  test('Clinic Patients Page Renders', () => {
    render(
      <MemoryRouter>
        <ClinicPatients />
      </MemoryRouter>
    );
    checkHasAnyOf([/المرضى/i, /مريض/i, /سجل/i, /إضافة/i]);
  });

  test('Clinic Reception Page Renders', () => {
    render(
      <MemoryRouter>
        <ClinicReception />
      </MemoryRouter>
    );
    checkHasAnyOf([/الاستقبال/i, /حجز/i, /موعد/i, /المواعيد/i]);
  });

  test('Clinic Reports Page Renders', () => {
    render(
      <MemoryRouter>
        <ClinicReports />
      </MemoryRouter>
    );
    checkHasAnyOf([/المتقدمة/i, /التقارير/i, /تحليل/i, /إنتاجية/i]);
  });

  test('Physician Cockpit Page Renders', () => {
    render(
      <MemoryRouter>
        <PhysicianCockpit />
      </MemoryRouter>
    );
    checkHasAnyOf([/الطبيب/i, /صالة/i, /انتظار/i, /الحالات/i]);
  });
});
