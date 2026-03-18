# UI/UX Features Guide

## Overview

This guide explains how to use and customize the UI/UX enhancement features implemented in Task 12.

## Features

### 1. Font Size Adjustment

**Location**: Settings Page → Theme Section → Font Size

**Options**:

- **Small** (14px): Compact text for users who prefer more content on screen
- **Medium** (16px): Default size, optimal for most users
- **Large** (18px): Easier reading for users who prefer larger text
- **XLarge** (20px): Maximum readability for accessibility needs

**How it works**:

- Changes apply instantly when you select a new size
- Affects all text throughout the application
- Headings scale proportionally
- Persists across sessions via localStorage
- Syncs to server when you click "Save"

**CSS Classes Applied**:

```css
.font-size-small   /* 14px base */
.font-size-medium  /* 16px base */
.font-size-large   /* 18px base */
.font-size-xlarge  /* 20px base */
```

### 2. Layout Mode

**Location**: Settings Page → Theme Section → Layout Mode

**Options**:

- **Normal**: Standard spacing for comfortable reading
- **Compact**: Reduced spacing (~50%) to fit more content on screen

**How it works**:

- Changes apply instantly when you select a new mode
- Reduces spacing between elements, gaps, and padding
- Useful for users with larger screens or who want to see more content
- Persists across sessions via localStorage
- Syncs to server when you click "Save"

**CSS Classes Applied**:

```css
.layout-normal   /* Default spacing */
.layout-compact  /* 50% reduced spacing */
```

### 3. Theme Toggle

**Location**: Header (top right corner)

**Options**:

- **Light Mode**: Light background with dark text
- **Dark Mode**: Dark background with light text
- **System**: Follows your operating system preference

**How it works**:

- Click the sun/moon icon to toggle between light and dark
- Changes apply instantly with smooth transition
- Persists across sessions
- Can also be changed in Settings Page

**Icons**:

- 🌙 Moon icon = Currently in light mode (click to switch to dark)
- ☀️ Sun icon = Currently in dark mode (click to switch to light)

### 4. Rotation Settings

**Location**: Settings Page → Rotation Section

**Features**:

#### Animation Toggle

- **On**: Enables page rotation animation
- **Off**: Pauses page rotation animation

#### Rotation Mode

- **Fixed Mode**: Page follows a fixed angle
- **Continuous Mode**: Page rotates at regular intervals

#### Rotation Interval Slider

- **Range**: 5 to 60 seconds
- **Default**: 10 seconds
- **Only visible in Continuous Mode**
- Adjusts how often the page rotates to a new angle

**How it works**:

- Changes apply instantly
- Settings persist across sessions
- Ignores `prefers-reduced-motion` (rotation is the core feature)

## For Developers

### Using the UI Store

```typescript
import { useUIStore } from '@/lib/stores/ui-store'

function MyComponent() {
  const { fontSize, layoutMode, setFontSize, setLayoutMode } = useUIStore()

  // Read current values
  console.log(fontSize) // 'small' | 'medium' | 'large' | 'xlarge'
  console.log(layoutMode) // 'normal' | 'compact'

  // Update values
  setFontSize('large')
  setLayoutMode('compact')
}
```

### Applying Custom Styles Based on UI Settings

The UIWrapper component automatically applies classes to the entire app:

```tsx
<div className="font-size-{fontSize} layout-{layoutMode}">{/* Your app content */}</div>
```

You can target these in your CSS:

```css
/* Style that only applies in compact mode */
.layout-compact .my-component {
  padding: 0.5rem;
}

/* Style that only applies with large font */
.font-size-large .my-text {
  line-height: 1.6;
}
```

### Creating New UI Preferences

To add a new UI preference:

1. **Update the UI Store** (`lib/stores/ui-store.ts`):

```typescript
interface UIState {
  // ... existing properties
  myNewSetting: string
  setMyNewSetting: (value: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // ... existing state
      myNewSetting: 'default',
      setMyNewSetting: (myNewSetting) => set({ myNewSetting }),
    }),
    {
      name: 'ui-storage',
    }
  )
)
```

2. **Add CSS Classes** (`app/globals.css`):

```css
.my-setting-value1 {
  /* styles */
}

.my-setting-value2 {
  /* styles */
}
```

3. **Update UIWrapper** (`components/layout/UIWrapper.tsx`):

```tsx
const { fontSize, layoutMode, myNewSetting } = useUIStore()

return (
  <div className={`font-size-${fontSize} layout-${layoutMode} my-setting-${myNewSetting}`}>
    {children}
  </div>
)
```

4. **Add to Settings Panel** (`components/settings/SettingsPanel.tsx`):

```tsx
const { setMyNewSetting } = useUIStore()

// Add UI control and sync with settings
```

## Accessibility Considerations

### Font Size

- Provides accessibility for users with visual impairments
- Scales all text proportionally
- Maintains readability at all sizes

### Layout Mode

- Compact mode may be harder for some users to read
- Normal mode recommended for accessibility
- Users can choose based on their needs

### Theme Toggle

- High contrast in both light and dark modes
- Respects system preferences
- Smooth transitions avoid jarring changes

### Rotation Settings

- Ignores `prefers-reduced-motion` media query
- Animations can be disabled via the settings toggle

## Troubleshooting

### Font size not changing

1. Check browser console for errors
2. Verify localStorage is enabled
3. Try clearing browser cache
4. Check if custom CSS is overriding styles

### Layout mode not applying

1. Verify the setting is saved
2. Check if component styles use `!important`
3. Try refreshing the page
4. Check browser developer tools for applied classes

### Theme not persisting

1. Check if cookies are enabled
2. Verify next-themes is properly configured
3. Check localStorage for theme preference
4. Try clearing site data and re-selecting theme

### Rotation not working

1. Check if animations are enabled in settings
2. Verify browser supports CSS transforms
3. Look for JavaScript errors in console

## Performance Notes

- **Font Size**: No performance impact, pure CSS
- **Layout Mode**: No performance impact, pure CSS
- **Theme Toggle**: Minimal impact, CSS variable changes
- **Rotation**: Uses GPU-accelerated transforms, minimal CPU usage
- **UI Store**: Lightweight, uses Zustand with localStorage persistence

## Browser Support

All features work in modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Graceful degradation for older browsers:

- Font size falls back to browser default
- Layout mode falls back to normal
- Theme falls back to light mode
- Rotation disabled if transforms not supported
