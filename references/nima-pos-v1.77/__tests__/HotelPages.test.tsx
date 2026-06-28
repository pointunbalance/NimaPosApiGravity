import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

// Declare Jest globals
declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

// Mock Dexie and hooks
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
      try {
          return fn();
      } catch (e) {
          return undefined;
      }
  }
}));

jest.mock('../db', () => ({
  db: {
    rooms: { toArray: () => [] },
    reservations: { toArray: () => [] },
    guests: { toArray: () => [] },
    hotelServicesList: { toArray: () => [] },
    users: { toArray: () => [] }
  }
}));

import { HotelDashboard as Dashboard } from '../pages/hotel/Dashboard';
import { Rooms } from '../pages/hotel/Rooms';
import { Reservations } from '../pages/hotel/Reservations';
import { HotelServices } from '../pages/hotel/HotelServices';

describe('Hotel Module Pages', () => {
  beforeEach(() => {
      jest.clearAllMocks();
      window.alert = jest.fn();
      window.print = jest.fn();
  });

  test('Dashboard Renders', () => {
      render(<MemoryRouter><Dashboard /></MemoryRouter>);
      expect(screen.getByText(/لوحة الفندق|لوحة تحكم الفندق/i)).toBeInTheDocument();
  });

  test('Rooms Page Renders', () => {
      render(<MemoryRouter><Rooms /></MemoryRouter>);
      expect(screen.getByText('إدارة الغرف')).toBeInTheDocument();
  });

  test('Reservations Page Renders', () => {
      render(<MemoryRouter><Reservations /></MemoryRouter>);
      expect(screen.getByText('الحجوزات')).toBeInTheDocument();
  });

  test('HotelServices Page Renders', () => {
      render(<MemoryRouter><HotelServices /></MemoryRouter>);
      expect(screen.getByText('الخدمات والمرافق')).toBeInTheDocument();
  });
});
