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
    manufacturingOrders: { toArray: () => [] },
    manufacturingBOMs: { toArray: () => [] },
    manufacturingWorkCenters: { toArray: () => [] },
    users: { toArray: () => [] }
  }
}));

import BillOfMaterials from '../pages/manufacturing/BillOfMaterials';
import QualityControl from '../pages/manufacturing/QualityControl';
import WorkCenters from '../pages/manufacturing/WorkCenters';

describe('Manufacturing Module Pages', () => {
  beforeEach(() => {
      jest.clearAllMocks();
      window.alert = jest.fn();
      window.print = jest.fn();
  });

  test('BillOfMaterials Page Renders', () => {
      render(<MemoryRouter><BillOfMaterials /></MemoryRouter>);
      expect(screen.getByText(/قائمة المواد/i)).toBeInTheDocument();
  });

  test('QualityControl Page Renders', () => {
      render(<MemoryRouter><QualityControl /></MemoryRouter>);
      expect(screen.getByText('مراقبة الجودة')).toBeInTheDocument();
  });

  test('WorkCenters Page Renders', () => {
      render(<MemoryRouter><WorkCenters /></MemoryRouter>);
      expect(screen.getByText('مراكز العمل')).toBeInTheDocument();
  });
});
