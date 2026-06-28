const fs = require('fs');

let s = fs.readFileSync('App.tsx', 'utf8');

// Insert import
if (!s.includes('const TicketBookings = lazy')) {
  s = s.replace(
    'const POSTerminals = lazy(() =>',
    `const TicketBookings = lazy(() => import("./pages/TicketBookings"));\nconst POSTerminals = lazy(() =>`
  );
}

// Insert route
if (!s.includes('<Route path="tickets" element={<TicketBookings />} />')) {
  s = s.replace(
    '<Route path="events" element={<EventManagement />} />',
    '<Route path="events" element={<EventManagement />} />\n                        <Route path="tickets" element={<TicketBookings />} />'
  );
}
fs.writeFileSync('App.tsx', s);
