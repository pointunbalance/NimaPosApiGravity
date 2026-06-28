const fs = require('fs');

// 1. Update types.ts
let typesStr = fs.readFileSync('types.ts', 'utf8');

if (!typesStr.includes('export interface TicketBooking')) {
  const newTypes = `
export interface TicketBooking {
  id?: number;
  bookingRef: string;
  customerName: string;
  customerPhone?: string;
  destination: string;
  departureDate: string;
  departureTime?: string;
  ticketType: 'standard' | 'vip' | 'student' | 'child';
  passengers: number;
  pricePerTicket: number;
  totalAmount: number;
  paidAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
}
`;
  typesStr = typesStr + newTypes;
  fs.writeFileSync('types.ts', typesStr);
}

// 2. Update db.ts
let dbStr = fs.readFileSync('db.ts', 'utf8');
if (!dbStr.includes('ticketBookings!: Table<TicketBooking, number>;')) {
  // Add to import
  dbStr = dbStr.replace('  CustomerFeedback\n} from "./types";', '  CustomerFeedback,\n  TicketBooking\n} from "./types";');
  
  // Add to table
  dbStr = dbStr.replace('// Studio Tables', 'ticketBookings!: Table<TicketBooking, number>;\n\n  // Studio Tables');
  
  // Add to stores schema
  dbStr = dbStr.replace(
    /customerFeedbacks: '\+\+id, orderId, rating, createdAt',/,
    "customerFeedbacks: '++id, orderId, rating, createdAt',\n      ticketBookings: '++id, bookingRef, destination, departureDate, customerName, status',"
  );
  
  fs.writeFileSync('db.ts', dbStr);
}
console.log('Added TicketBooking to types.ts and db.ts');
