# Design System Documentation
## Streamline Dumpsters Ltd.

**Purpose**: Documentation of existing design patterns and styles
**Last Updated**: 2025-10-12
**Note**: This documents the current design system as-is. No changes or improvements are suggested.

---

## Table of Contents

1. [Colors](#colors)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Breakpoints](#breakpoints)
5. [Shadows](#shadows)
6. [Border Radius](#border-radius)
7. [Transitions](#transitions)

---

## Colors

### Primary Brand Colors (Teal/Cyan)

The main brand identity colors based on teal/cyan palette.

| Variable | Hex Value | Usage |
|----------|-----------|-------|
| `--color-primary-50` | `#f0fdfe` | Lightest tint - backgrounds |
| `--color-primary-100` | `#ccfbf1` | Very light tint |
| `--color-primary-200` | `#99f6e4` | Light tint |
| `--color-primary-300` | `#5eedd8` | Medium-light tint |
| `--color-primary-400` | `#2dd4bf` | Medium tint |
| `--color-primary-500` | `#00828a` | **Main brand color** - WCAG AA compliant (4.61:1) |
| `--color-primary-600` | `#067893` | Darker shade - WCAG AA compliant (4.88:1) |
| `--color-primary-700` | `#0e7490` | Darkest shade - hover states |

**Primary Color Notes:**
- Primary-500 (`#00828a`) is the main brand color
- Primary-600 (`#067893`) used for links and hover states
- Both meet WCAG AA contrast requirements on light backgrounds

### Accent Colors (Orange/Coral)

Warm accent colors for CTAs and highlights.

| Variable | Hex Value | Usage |
|----------|-----------|-------|
| `--color-accent-200` | `#fed7aa` | Light accent |
| `--color-accent-400` | `#fb923c` | Medium accent |
| `--color-accent-500` | `#f97316` | Main accent for CTAs |
| `--color-accent-600` | `#ea580c` | Darker accent |
| `--color-accent-700` | `#c2410c` | Darkest accent |

### Gray Scale (Cool-tinted)

Neutral grays with cool tint to complement teal brand colors.

| Variable | Hex Value | Usage |
|----------|-----------|-------|
| `--color-gray-50` | `#f8fafc` | Lightest gray - backgrounds |
| `--color-gray-100` | `#f1f5f9` | Very light gray |
| `--color-gray-200` | `#e2e8f0` | Light gray - borders |
| `--color-gray-300` | `#cbd5e1` | Medium-light gray |
| `--color-gray-500` | `#64748b` | Medium gray - muted text |
| `--color-gray-600` | `#475569` | Dark gray - secondary text |
| `--color-gray-700` | `#334155` | Darker gray |
| `--color-gray-900` | `#0f172a` | Darkest gray - primary text |

### Semantic Color Aliases

Simplified color variables for common use cases.

| Variable | Maps To | Hex Value | Usage |
|----------|---------|-----------|-------|
| `--color-primary` | `--color-primary-500` | `#00828a` | Main brand color |
| `--color-primary-dark` | `--color-primary-700` | `#0e7490` | Hover states |
| `--color-text` | `--color-gray-900` | `#0f172a` | Primary text |
| `--color-white` | - | `#ffffff` | White |
| `--color-section-bg` | `--color-gray-50` | `#f8fafc` | Section backgrounds |

### Text Colors

| Variable | Maps To | Usage |
|----------|---------|-------|
| `--text-primary` | `--color-gray-900` | Main body text |
| `--text-secondary` | `--color-gray-600` | Secondary text |
| `--text-muted` | `--color-gray-500` | Muted/disabled text |
| `--text-inverse` | `white` | Text on dark backgrounds |

### Background Colors

| Variable | Maps To | Usage |
|----------|---------|-------|
| `--bg-primary` | `white` | Main backgrounds |
| `--bg-secondary` | `--color-gray-50` | Alternate backgrounds |

### Special Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--hero-overlay` | `rgba(15, 23, 42, 0.7)` | Dark overlay on hero images |
| `--focus-ring` | `rgba(1, 176, 187, 0.3)` | Focus outline color |

---

## Typography

### Font Families

| Variable | Value | Usage |
|----------|-------|-------|
| `--font-family-primary` | `'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif` | Body text |
| `--font-family-heading` | `'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif` | Headings |

**Font Stack**: Inter (preferred) → Segoe UI → System UI → Apple System → Generic Sans-serif

### Fluid Font Sizes

Uses `clamp()` for responsive typography that scales between min and max values.

| Variable | Min → Max | Usage |
|----------|-----------|-------|
| `--fs-xs` | `0.75rem` → `0.875rem` (12px → 14px) | Extra small text |
| `--fs-sm` | `0.875rem` → `1rem` (14px → 16px) | Small text |
| `--fs-base` | `1rem` → `1.125rem` (16px → 18px) | Body text |
| `--fs-lg` | `1.125rem` → `1.375rem` (18px → 22px) | Large text |
| `--fs-xl` | `1.25rem` → `1.625rem` (20px → 26px) | Extra large |
| `--fs-2xl` | `1.5rem` → `2rem` (24px → 32px) | 2X large |
| `--fs-3xl` | `1.875rem` → `2.5rem` (30px → 40px) | 3X large |
| `--fs-4xl` | `2.25rem` → `3.125rem` (36px → 50px) | 4X large (hero) |

**Full clamp() Values:**
```css
--fs-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--fs-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
--fs-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
--fs-lg: clamp(1.125rem, 1rem + 0.625vw, 1.375rem);
--fs-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.625rem);
--fs-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
--fs-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem);
--fs-4xl: clamp(2.25rem, 1.9rem + 1.75vw, 3.125rem);
```

### Font Weights

| Variable | Value | Usage |
|----------|-------|-------|
| `--fw-normal` | `400` | Normal text |
| `--fw-medium` | `500` | Medium emphasis |
| `--fw-semibold` | `600` | Semi-bold emphasis |
| `--fw-bold` | `700` | Bold text/headings |
| `--fw-extrabold` | `800` | Extra bold (rare use) |

### Line Heights

| Variable | Value | Usage |
|----------|-------|-------|
| `--lh-tight` | `1.25` | Tight spacing (headings) |
| `--lh-normal` | `1.5` | Normal spacing (body) |
| `--lh-relaxed` | `1.625` | Relaxed spacing (long form) |

### Legacy Typography Aliases

| Variable | Maps To | Usage |
|----------|---------|-------|
| `--fz-base` | `--fs-base` | Legacy base font size |
| `--fz-sm` | `--fs-sm` | Legacy small font size |

---

## Spacing

### Modern Spacing Scale

Consistent spacing system based on 4px base unit.

| Variable | Value | Pixels | Usage |
|----------|-------|--------|-------|
| `--space-1` | `0.25rem` | 4px | Minimal spacing |
| `--space-2` | `0.5rem` | 8px | Tight spacing |
| `--space-3` | `0.75rem` | 12px | Small spacing |
| `--space-4` | `1rem` | 16px | Base spacing |
| `--space-5` | `1.25rem` | 20px | Medium spacing |
| `--space-6` | `1.5rem` | 24px | Large spacing |
| `--space-8` | `2rem` | 32px | Extra large spacing |
| `--space-10` | `2.5rem` | 40px | 2X spacing |
| `--space-12` | `3rem` | 48px | 3X spacing |
| `--space-16` | `4rem` | 64px | 4X spacing (sections) |

**Note**: Variables `--space-20`, `--space-24`, `--space-32` are referenced in variables.css line 107 but values appear to be missing in the current implementation.

### Container Spacing

| Variable | Maps To | Usage |
|----------|---------|-------|
| `--container-pad` | `--space-4` (1rem) | Mobile container padding |
| `--container-pad-lg` | `--space-8` (2rem) | Tablet+ container padding |
| `--max-width` | `1200px` | Maximum container width |

---

## Breakpoints

**Mobile-First Approach**: Base styles target mobile (320px+), media queries enhance for larger screens.

### Breakpoint System

| Breakpoint | Min Width | Target Devices |
|------------|-----------|----------------|
| **Mobile** (default) | `0px` - `767px` | Phones |
| **Tablet** (`md`) | `768px` | Tablets, small laptops |
| **Desktop** (`lg`) | `1024px` | Large laptops, desktops |

### Media Query Usage

```css
/* Tablet and up */
@media (min-width: 768px) {
  /* Enhanced layouts for medium screens */
}

/* Desktop and up */
@media (min-width: 1024px) {
  /* Full desktop layouts */
}
```

### Special Media Queries

**Hover Detection:**
```css
@media (hover: hover) {
  /* Enhanced hover effects for devices with hover capability */
}
```

**Print Styles:**
```css
@media print {
  /* Optimized styles for printing */
}
```

**High Contrast Mode:**
```css
@media (prefers-contrast: high) {
  /* Enhanced visibility for users with contrast preferences */
}
```

### Responsive Changes by Breakpoint

**Tablet (768px+):**
- Container padding: `1rem` → `2rem`
- Header height: `auto` → `72px`
- Logo height: `auto` → `85px`
- Navigation: Vertical → Horizontal
- Mobile toggle: Hidden

**Desktop (1024px+):**
- Header height: `72px` → `80px`
- Logo height: `85px` → `95px`
- Navigation gap: `1rem` → `1.5rem`
- Enhanced hover effects enabled

---

## Shadows

Layered shadow system for depth and hierarchy.

| Variable | Value | Usage |
|----------|-------|-------|
| `--shadow-sm` | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)` | Small elevation |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` | Medium elevation |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | Large elevation |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` | Extra large |
| `--shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` | Maximum elevation |

---

## Border Radius

Consistent border radius scale.

| Variable | Value | Pixels | Usage |
|----------|-------|--------|-------|
| `--radius-sm` | `0.25rem` | 4px | Small corners |
| `--radius-md` | `0.375rem` | 6px | Medium corners |
| `--radius-lg` | `0.5rem` | 8px | Large corners (default) |
| `--radius-xl` | `0.75rem` | 12px | Extra large |
| `--radius-2xl` | `1rem` | 16px | 2X large |
| `--radius-full` | `9999px` | Full | Circular/pill shapes |

### Legacy Alias

| Variable | Maps To | Usage |
|----------|---------|-------|
| `--radius` | `--radius-lg` | Default radius |

---

## Borders

### Border Widths

| Variable | Value | Usage |
|----------|-------|-------|
| `--border-width` | `1px` | Default border |
| `--border-width-2` | `2px` | Thicker border |

### Border Colors

| Variable | Maps To | Usage |
|----------|---------|-------|
| `--border-color` | `--color-gray-200` | Default border color |

---

## Transitions

Smooth animations with easing functions.

| Variable | Value | Usage |
|----------|-------|-------|
| `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | Quick transitions |
| `--transition-base` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` | Standard transitions |

**Easing Function**: `cubic-bezier(0.4, 0, 0.2, 1)` - Standard ease-in-out

---

## Design Principles

### Current Implementation Notes

1. **Mobile-First**: All base styles target mobile devices, progressively enhanced
2. **Fluid Typography**: Uses `clamp()` for responsive font sizes
3. **Consistent Spacing**: Based on 4px grid system
4. **WCAG AA Compliant**: Primary colors meet accessibility contrast requirements
5. **Cool Color Palette**: Gray scale has cool tint to complement teal brand
6. **System Fonts**: Uses Inter with fallback to system fonts for performance

---

## File Locations

Design system values defined in:
- **[css/variables.css](css/variables.css)** - All CSS custom properties
- **[css/responsive.css](css/responsive.css)** - Media query breakpoints
- **[css/typography.css](css/typography.css)** - Typography styles
- **[css/utilities.css](css/utilities.css)** - Utility classes

---

## Usage Examples

### Using Colors
```css
.element {
  color: var(--text-primary);
  background-color: var(--color-primary-500);
  border-color: var(--border-color);
}
```

### Using Spacing
```css
.element {
  padding: var(--space-4);
  margin-bottom: var(--space-8);
  gap: var(--space-6);
}
```

### Using Typography
```css
.heading {
  font-size: var(--fs-3xl);
  font-weight: var(--fw-bold);
  line-height: var(--lh-tight);
}
```

### Using Shadows
```css
.card {
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-lg);
}
```

---

**End of Design System Documentation**
