import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    schoolStudents: { toArray: () => [] },
    schoolClassesList: { toArray: () => [] },
    schoolTeachers: { toArray: () => [] },
    schoolEvaluations: { toArray: () => [] },
    schoolSubjects: { toArray: () => [] },
    schoolAttendanceList: { toArray: () => [] },
    schoolGradesList: { toArray: () => [] },
    schoolFees: { toArray: () => [] },
    schoolFeeTypes: { toArray: () => [] },
    schoolTimetable: { toArray: () => [] },
    schoolTransport: { toArray: () => [] },
    schoolLibrary: { toArray: () => [] },
    schoolAdmissions: { toArray: () => [] },
    schoolParents: { toArray: () => [] },
    schoolBehavior: { toArray: () => [] },
    schoolHomework: { toArray: () => [] },
    schoolCertificates: { toArray: () => [] },
    schoolClinic: { toArray: () => [] },
    schoolEvents: { toArray: () => [] },
    schoolTrips: { toArray: () => [] },
    schoolActivities: { toArray: () => [] },
    schoolMealsSchedule: { toArray: () => [] },
    schoolStudentMeals: { toArray: () => [] },
    schoolStudentSleep: { toArray: () => [] },
    schoolDailyReports: { toArray: () => [] },
    schoolAlbums: { toArray: () => [] },
    schoolPhotos: { toArray: () => [] },
    schoolComplaints: { toArray: () => [] },
    schoolDiscounts: { toArray: () => [] },
    schoolWithdrawals: { toArray: () => [] },
    schoolBehavioralTracking: { toArray: () => [] },
    schoolPickupLogs: { toArray: () => [] },
    schoolAdmissionRequests: { toArray: () => [] },
    schoolCrmLogs: { toArray: () => [] },
    schoolHostel: { toArray: () => [] },
    schoolInventory: { toArray: () => [] },
    schoolAlumni: { toArray: () => [] },
    schoolContracts: { toArray: () => [] },
    schoolExpenses: { toArray: () => [] },
    schoolExams: { toArray: () => [{ id: 1, title: 'Exam 1', date: '2023-10-10', totalMarks: 100, classId: 1, subject: 'Math' }] },
    schoolExamResults: { toArray: () => [] },
    academicYears: { toArray: () => [] },
    users: { toArray: () => [] }
  }
}));

// Mock Jodit React
vi.mock('jodit-react', () => {
    return {
        __esModule: true,
        default: () => <textarea data-testid="jodit-mock" />
    };
});

import { SchoolDashboard } from '../pages/school/Dashboard';
import { SchoolExams } from '../pages/school/SchoolExams';
import { Students } from '../pages/school/Students';
import { Classes } from '../pages/school/Classes';
import { Attendance } from '../pages/school/Attendance';
import { SchoolFees } from '../pages/school/SchoolFees';
import { SchoolClinic } from '../pages/school/SchoolClinic';
import { SchoolEvents } from '../pages/school/SchoolEvents';
import { SchoolCashier } from '../pages/school/SchoolCashier';
import { SchoolParents } from '../pages/school/SchoolParents';
import { SchoolAcademicYear } from '../pages/school/SchoolAcademicYear';
import { SchoolActivities } from '../pages/school/SchoolActivities';

describe('School Module Pages', () => {
  beforeEach(() => {
      vi.clearAllMocks();
      window.alert = vi.fn();
      window.print = vi.fn();
  });

  test('School Dashboard Renders', () => {
      render(<MemoryRouter><SchoolDashboard /></MemoryRouter>);
      expect(screen.getByText(/لوحة تحكم الحضانات/i)).toBeInTheDocument();
  });

  test('School Exams Page Renders', () => {
      render(<MemoryRouter><SchoolExams /></MemoryRouter>);
      expect(screen.getByText(/الاختبارات والتقييمات/i)).toBeInTheDocument();
      expect(screen.getByText('Exam 1')).toBeInTheDocument();
  });

  test('School Exams Add Modal Opens', () => {
      render(<MemoryRouter><SchoolExams /></MemoryRouter>);
      const addButton = screen.getByText('إضافة اختبار');
      fireEvent.click(addButton);
      expect(screen.getByText('إضافة اختبار جديد')).toBeInTheDocument();
  });

  test('School Students Page Renders', () => {
      render(<MemoryRouter><Students /></MemoryRouter>);
      expect(screen.getByText('إدارة الأطفال')).toBeInTheDocument();
  });

  test('School Classes Page Renders', () => {
      render(<MemoryRouter><Classes /></MemoryRouter>);
      expect(screen.getByText('إدارة الفصول')).toBeInTheDocument();
  });

  test('School Attendance Page Renders', () => {
      render(<MemoryRouter><Attendance /></MemoryRouter>);
      expect(screen.getByText(/الحضور والانصراف/i)).toBeInTheDocument();
  });

  test('School Fees Page Renders', () => {
      render(<MemoryRouter><SchoolFees /></MemoryRouter>);
      expect(screen.getByText('إدارة الرسوم والاشتراكات')).toBeInTheDocument();
  });

  test('School Clinic Page Renders', () => {
      render(<MemoryRouter><SchoolClinic /></MemoryRouter>);
      expect(screen.getByText('العيادة والسجل الطبي')).toBeInTheDocument();
  });

  test('School Events Page Renders', () => {
      render(<MemoryRouter><SchoolEvents /></MemoryRouter>);
      expect(screen.getByText('الأحداث والفعاليات')).toBeInTheDocument();
  });

  test('School Cashier Page Renders', () => {
      render(<MemoryRouter><SchoolCashier /></MemoryRouter>);
      expect(screen.getByText('الخزينة المدرسية')).toBeInTheDocument();
  });

  test('School Parents Page Renders', () => {
      render(<MemoryRouter><SchoolParents /></MemoryRouter>);
      expect(screen.getByText('إدارة أولياء الأمور')).toBeInTheDocument();
  });

  test('School Academic Year Page Renders', () => {
      render(<MemoryRouter><SchoolAcademicYear /></MemoryRouter>);
      expect(screen.getByText('السنوات الأكاديمية')).toBeInTheDocument();
  });

  test('School Activities Page Renders', () => {
      render(<MemoryRouter><SchoolActivities /></MemoryRouter>);
      expect(screen.getByText('الأنشطة والرحلات')).toBeInTheDocument();
  });
});
