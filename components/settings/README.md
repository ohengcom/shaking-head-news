# Settings Components

This directory contains components related to user settings management.

## Components

### SettingsPanel

A comprehensive settings panel that allows users to customize their experience.

**Features:**

- Language selection (Chinese/English)
- Theme selection (Light/Dark/System)
- Font size adjustment
- Layout mode (Normal/Compact)
- Rotation mode configuration
- Rotation interval slider
- Animation toggle
- Daily goal setting
- Notification preferences

**Usage:**

```tsx
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { getUserSettings } from '@/lib/actions/settings'

const settings = await getUserSettings()

<SettingsPanel initialSettings={settings} />
```

**Props:**

- `initialSettings`: UserSettings - The initial settings to display

**State Management:**

- Uses local state for form values
- Uses local pending state during save/reset
- Syncs with Vercel Marketplace Storage via Server Actions

**Server Actions:**

- `updateSettings()` - Saves settings to storage
- `resetSettings()` - Resets settings to defaults

## Server Actions

Located in `lib/actions/settings.ts`:

### getUserSettings()

Retrieves user settings from Vercel Marketplace Storage. Returns default settings for unauthenticated users.

### updateSettings(settings)

Updates user settings in storage. Requires authentication.

### resetSettings()

Resets user settings to default values. Requires authentication.

## Requirements Satisfied

- **2.2**: User settings stored in Vercel Marketplace Storage
- **2.3**: Settings loaded from storage on new device login
- **2.4**: Settings synced via Server Actions within 3 seconds
- **5.1**: Font size adjustment (small, medium, large, xlarge)
- **5.2**: Compact layout mode toggle
- **5.4**: Rotation speed slider (5-60 seconds)

## UI Components Used

- Shadcn/ui Button
- Shadcn/ui Slider
- Shadcn/ui Switch
- Shadcn/ui Select
- Shadcn/ui Card
- Shadcn/ui Label
- Toast notifications for feedback
