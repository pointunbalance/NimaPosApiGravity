# Project Design Guidelines

## Browser Restrictions (iFrame Environment)
1. **No Native Dialogs:** Because the application is rendered in an iFrame preview, some native browser APIs behave unexpectedly or are blocked entirely. You **MUST AVOID** using any built-in browser dialogs:
   - 🚫 `window.confirm()`
   - 🚫 `window.alert()`
   - 🚫 `window.prompt()`
   
2. **Use Custom Modals:** Always use custom React components for user prompts. For example, use the existing `ConfirmModal` component (`components/ui/ConfirmModal.tsx`) for destructive actions and confirmations, or build custom modals when specific inputs are required.

## Offline-First Requirements
1. **No External Cloud Storage for App Data:** All data persistence must rely on the provided local offline-first solution (e.g., IndexedDB/Dexie). Do NOT use Firebase, SQL, MongoDB, or other cloud-dependent databases.
2. **Local Assets & Files:** All added features, images, and user-uploaded files MUST be capable of working completely offline without an active internet connection.
   - **User Uploads:** When users upload images or files, store them as Base64 strings or Blobs within IndexedDB. **NEVER** upload data to external cloud storage (e.g., AWS S3, Cloudinary).
   - **Static Assets:** Use relative paths for bundled application assets.
   - **External URLs:** Avoid relying on external CDNs or external image providers (like Unsplash) for core application functionality where possible.

## Theme & Styling
1. **Day Theme Priority:** The priority for colors is the day theme (light theme), while maintaining the project's colors and aesthetic harmony. Do not use dark mode classes (`dark:`) or rely on dark themes.
2. **Dynamic Background Washes:** Avoid plain white, flat grey, or sterile background styles. Instead, use a premium, multi-color day gradient wash (e.g., `bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40`) to give the pages visual depth and warmth.
3. **Glassmorphism Headers & Toolbars:** Style headers, utility bars, and toolbars as semi-transparent frosted-glass surfaces (e.g., `bg-white/60 backdrop-blur-md shadow-sm border-b border-indigo-100/10`) to provide a luxurious modern feel.
4. **Color-Coded Category Maps:** Category pills, badges, and card borders should be dynamically colored to represent their content category (e.g., warm Amber/Orange gradients for Meals/الوجبات, refreshing Sky Blue/Cyan for Beverages/المشروبات, Emerald/Teal for Starters/المقبلات, Rose/Pink for Desserts/الحلويات, and Yellow/Amber for Bakery/المخبوزات).
5. **Interactive Vibrant Action Keys:** Primary actions, quick adjustments, and transactional footer buttons must be vivid and distinct rather than plain white or flat gray. Use solid-to-gradient gems with matching soft hover shadows (e.g., Amber-to-Orange gradients for Holds, Emerald-to-Teal for Kitchen sends, Purple-to-Indigo for Quotations, Sky Blue-to-Blue for fast cash, and customized glowing pastel tints for control icons).
6. **Polished & Energetic Empty States:** Empty state widgets (like empty carts, empty lists, or empty search responses) must feature glowing gradient bubbles, animated indicators (e.g., `animate-pulse`), and high-contrast typography instead of simple gray placeholders.

## Integrated Data & Accounting
1. **Database Driven & Interconnected:** All pages and modules must be connected to the local database (`db.ts`). No page should exist in isolation.
2. **Global Financial Impact:** Actions that involve money (sales, purchases, expenses, payroll, clinic appointments, rentals, etc.) MUST directly affect the core accounting system. They should generate automated journal entries, impact the general ledger, and update relevant accounts so that the global financials are completely unified.

## Reference System Completeness
1. **Comprehensive Departments:** This is a comprehensive reference system. You must add all possible pages and screens that pertain to each department or module.
2. **Complete Missing Modules:** Identify and add any missing departments (e.g., specific human resources modules, specialized accounting, manufacturing, etc.) to ensure the reference system is fully complete.

## Name & Identity Conventions
1. **No Islamic or Arab-Muslim Names:** You **MUST NOT** use any traditional Islamic or Muslim names (e.g., أحمد, محمد, عمر, خالد, فاطمة, يوسف, إلخ) anywhere in the application or in default records.
2. **Christian Ukrainian Names Only:** All personas, default customers, mock employees, technicians, and managers throughout the entire app **MUST** have Ukrainian Christian names (e.g., أندري, ميكولا, ياروسلاف, رومان, تاراس, بوهدان, أولغا, كاترينا, سفيتلانا, إلخ).

## Chat Logging Requirements
1. **Chat Logs Conservation:** Every time there is an interaction, a chat log must be saved in the `/chat_logs` directory.
2. **Naming Convention:** The user prompt and AI response must be saved as timestamped files matching the naming scheme `YYYY_MM_DD__HH_MM_SS__user_command.txt` and `YYYY_MM_DD__HH_MM_SS__ai_response.txt`, where the timestamp corresponds to the current local date and time of the interaction.

## Code Quality & Architecture Limits (Clean Code)
1. **Strict 300-Line Limit:** To ensure maximum readability, modularity, and smooth system operation, **no single view, page, or file should exceed 300 lines of code**. Large files must be split immediately.
2. **Modular Component Extraction:** All sub-components (dialogs, tables, graphs, filter bars, forms, custom widgets, etc.) **MUST** be separated and cleanly isolated into secondary files / modular sub-folders (e.g., inside `/components/` or page-specific sub-folders). Never dump massive inline logic or sub-views into a main file.
3. **Clean Coding Principles:** Code must be elegantly organized, thoroughly commented (explaining business workflows rather than obvious logic), highly structured with TypeScript type-safety (with explicit types/interfaces, avoiding `any`), and free from dead code, duplicate patterns, or mock structures. Keep everything strictly synchronized via `db.ts` or relevant custom hooks.


