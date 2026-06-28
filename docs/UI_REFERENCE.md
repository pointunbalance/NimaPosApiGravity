# NimaPOS UI Design Reference (v1.15)

> Superseded by the newer master reference:
> [NIMA_UI_MASTER_REFERENCE.md](E:\NimaTechVibeCoding\NimaPosApiGravity\docs\NIMA_UI_MASTER_REFERENCE.md)
>
> This file is kept as a historical reference derived from v1.15, but new UI decisions should use the master reference based on v1.54.

This document serves as a high-fidelity reference for the NimaPOS user interface design, captured from the original React source code. It outlines the design system, colors, components, and layout structures for implementation and maintenance.

## 🎨 Global Design System

### 1. Typography & RTL

- **Primary Font:** `Tajawal` or `Inter`.
- **Secondary Font:** `Outfit` (for numbers and headers).
- **Direction:** Standard Arabic (Right-to-Left - RTL).
- **Alignment:** Consistent right-alignment for text and labels.

### 2. Color Palette (Modern Premium)

- **Primary:** `Brand-600` (`#4f46e5` - Indigo/Deep Blue) - used for primary actions, active states.
- **Background:** `bg-[#f3f4f6]` (Light Gray/Slate) - core application background.
- **Surface:** `bg-white` with `backdrop-blur-md` (Glassmorphism effect).
- **Accents:**
  - **Success:** `Emerald-500/600` (Sales, Profits).
  - **Warning:** `Orange-500/600` (Low Stock, Expiry).
  - **Danger:** `Red-500/600` (Refunds, Deletions, Void).
  - **Premium:** `Indigo-950` (Dashboard Hero, Enterprise cards).

### 3. Visual Style (Atomic Design)

- **Borders:** `rounded-[2.5rem]` (Extra large) for hero sections, `rounded-3xl` for cards, `rounded-xl` for buttons/inputs.
- **Shadows:** `shadow-sm` for cards, `shadow-xl` / `shadow-glow` for active objects.
- **Micro-Animations:** `hover:scale-105`, `transition-all duration-300`, `hover:-translate-y-1`.

---

## 🏗️ Page Layout References

### 1. Dashboard (The Command Center)

- **Hero Section:** Dark gradient (`slate-900` to `indigo-950`) with abstract blur circles.
- **Stats Grid:** 4-column layout showing Sales, Profit, Average Order Value (AOV), and Customer count.
- **Charts:**
  - **AreaChart:** Income analysis (Indigo stroke).
  - **PieChart:** Payment source breakdown (Cash, Card, Wallet).
- **Alerts:** Vertical lists with status-colored badges (Expiry, Low Stock).

### 2. POS (Point of Sale)

- **Main Area:**
  - Search Header (Scanner-optimized).
  - Scrollable Category Bar (Horizontal pill buttons).
  - Product Grid: Cards with pricing, favorite stars, and stock badges.
- **Cart Sidebar (Fixed Left/Right):**
  - Customer selection (Dropdown).
  - Cart Item list: Line item control (Qty +/-, Delete).
  - Totaling Area: Subtotal, Discount, Tax, and "Finalize" button (Large Brand button).
- **Special Mode:** "Refund Mode" turns the entire UI background to `bg-red-50` and border accents to Red.

### 3. Data Tables (Customers, Suppliers, Products)

- **Structure:**
  - Top bar with Search + Add New button.
  - Responsive Table: High contrast rows (`hover:bg-gray-50`).
  - Action column: `Edit`, `View`, `Delete` (Icon-only buttons).
- **RTL Context:** Sliders and side-modals open from the right side.

### 4. Accounting & Reports

- **Cards:** White background, thin gray borders (`border-slate-100`).
- **Typography:** Bold headers, light-colored subtext.
- **Status Badges:** Rounded pills with light-colored backgrounds (e.g., `bg-emerald-50 text-emerald-600`).

---

## 🛠️ Common UI Components

### Button System

| Type | Styling |
| :--- | :--- |
| **Primary** | `bg-brand-600 text-white rounded-xl shadow-lg hover:scale-[1.02]` |
| **Secondary** | `bg-white text-gray-500 border border-slate-200 hover:bg-gray-50` |
| **Danger** | `bg-red-600 text-white rounded-xl hover:bg-red-700` |
| **Pill (Category)** | `px-5 py-2.5 rounded-xl font-bold whitespace-nowrap` |

### Input Styling

- **Search Bar:** `pr-12 pl-4 py-3.5 bg-white border-2 rounded-2xl focus:ring-4 focus:ring-brand-100`.
- **Form Input:** `bg-slate-50 border-none rounded-xl px-4 py-3 text-sm`.

---

## 📱 Responsiveness

- **Desktop (Main):** 3-panel layout (Sidebar, Main, Cart).
- **Tablet/Small Laptop:** Cart sidebar collapses or overlaps. Grid adjusts from 5 to 2 columns.
- **Mobile:** Fixed Bottom Navigation Bar + Full-screen Modals.
