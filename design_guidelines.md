# ComplianceWorxs Executive Command Dashboard - Design Guidelines

## Design Approach
**System**: Carbon Design System (IBM) - optimized for enterprise data dashboards with information density and clarity
**Visual Reference**: Linear (for clean aesthetics) + Datadog (for dashboard patterns)
**Principle**: Maximum information density without cognitive overload, professional audit-grade presentation

## Core Design Elements

### Typography
- **Primary Font**: Inter (Google Fonts) - exceptional legibility at small sizes
- **Hierarchy**:
  - Dashboard Title: 24px, weight 600
  - Section Headers: 16px, weight 600, uppercase tracking
  - Data Labels: 13px, weight 500
  - Metrics/Numbers: 28px, weight 700 (for primary KPIs), 16px weight 600 (for table data)
  - Body Text: 14px, weight 400
  - Small Labels: 12px, weight 400

### Layout System
**Spacing Units**: Use Tailwind units of 2, 4, 6, 8, 12, 16 consistently
- Component padding: p-4 to p-6
- Section gaps: gap-4 to gap-6
- Card margins: m-4
- Dense tables: py-2 px-4

**Grid Structure**: 
- Main container: 12-column grid with 16px gaps
- Dashboard cards span 3-4 columns on desktop
- Single column stack on mobile (lg: breakpoint)

### Dashboard Layout Architecture

**Top Command Bar** (h-16, fixed):
- Left: ComplianceWorxs logo + "Executive Command" title
- Center: Real-time status indicator (Live pulse animation + timestamp)
- Right: User profile, notifications bell (with badge count), settings gear

**Main Content Grid** (6 key sections):

1. **KPI Metrics Strip** (full-width, 4 cards):
   - Total Active Agents | Revenue Velocity ($/hr) | Critical Alerts | Compliance Score
   - Each: Large number + trend indicator (↑↓) + sparkline micro-chart

2. **Risk Matrix Heatmap** (8 columns):
   - 5x5 grid visualization with severity levels
   - Color-coded cells with incident counts
   - Axes: Impact (Y) vs Probability (X)

3. **Agent Performance Table** (8 columns):
   - Columns: Agent ID | Status Badge | Tasks/hr | Accuracy % | Revenue | Uptime | Last Action
   - 12-15 visible rows with virtual scrolling
   - Sortable headers, status badges (Active/Idle/Error)

4. **Revenue Velocity Chart** (4 columns):
   - Area chart showing hourly revenue trends (24h view)
   - Annotations for peak/low periods

5. **Real-time Activity Stream** (4 columns):
   - Live feed of agent actions with timestamps
   - Categorized icons (compliance check, document processed, alert triggered)
   - Infinite scroll with 50 recent items

6. **Compliance Alerts Panel** (4 columns):
   - Priority-sorted list (Critical/High/Medium)
   - Alert type icon + description + timestamp + "Review" action

### Component Specifications

**Cards**: 
- Rounded corners (rounded-lg)
- Border treatment (1px subtle border)
- Header with icon + title + action menu (3 dots)
- Content padding: p-6

**Data Tables**:
- Zebra striping for rows
- Hover state on rows
- Fixed header on scroll
- Right-aligned numeric columns
- Badge components for status (pill-shaped, 6px padding)

**Charts** (use Chart.js or Recharts):
- Line/Area charts: smooth curves, gradient fills
- Minimal gridlines (horizontal only)
- Tooltips on hover with precise values
- Time axis at bottom, value axis left

**Status Indicators**:
- Live Pulse: 8px dot with concentric ring animation
- Badges: Small caps text, 4px border-radius
- Progress Bars: 4px height, rounded ends

**Icons**: 
Use Heroicons (outline style for UI, solid for status indicators)

### Animations
- Pulse animation for "Live" indicator (1.5s interval)
- Smooth transitions on hover states (150ms)
- No scroll animations - immediate data visibility priority

### Accessibility
- WCAG AAA contrast ratios on dark theme
- Focus indicators on all interactive elements (2px outline)
- Aria labels for all status indicators and charts
- Keyboard navigation support for tables and cards

## Images Section
**No hero image** - this is an operational dashboard requiring immediate data access. All visual elements are data visualizations, charts, and UI components. No decorative imagery needed.

## Critical Implementation Notes
- All data must be visible without scrolling on 1440px+ displays (single-screen requirement)
- Real-time updates via WebSocket - smooth data transitions, no jarring reloads
- Responsive breakpoints: Mobile stack vertically, Desktop maintains grid
- Export functionality for tables/charts (top-right corner icons)
- Dark theme is mandatory - ensure sufficient contrast for extended viewing sessions