# Stats Components

This directory contains components for displaying user statistics and health reminders.

## Components

### StatsDisplay.tsx

Main statistics display component that shows:

- Today's rotation count and duration
- Weekly statistics with average
- Monthly statistics with average
- Progress towards daily goal
- Visual charts for trends

**Requirements**: 8.2, 8.5

### StatsChart.tsx

Chart component using Recharts to visualize rotation data:

- Bar chart for weekly data
- Line chart for monthly data
- Responsive design
- Theme-aware colors
- Custom tooltips

**Requirements**: 8.5

### HealthReminder.tsx

Health reminder component that:

- Requests browser notification permissions
- Checks for inactivity (2+ hours without rotation)
- Sends browser notifications when needed
- Shows toast messages when daily goal is achieved
- Allows enabling/disabling notifications

**Requirements**: 8.3, 8.4

## Server Actions

### lib/actions/stats.ts

Server actions for statistics management:

- `recordRotation(angle, duration, count?)` - Records one rotation or a batched rotation payload
- `getStats(startDate, endDate)` - Gets stats for a date range
- `getTodayStats()` - Gets today's statistics
- `getWeekStats()` - Gets last 7 days statistics
- `getMonthStats()` - Gets last 30 days statistics
- `getSummaryStats()` - Gets aggregated summary data
- `checkHealthReminder()` - Checks if reminder should be sent
- `checkDailyGoal(dailyGoal)` - Checks goal achievement

**Requirements**: 8.1, 8.2, 8.3, 8.4

## Data Flow

1. **Recording Rotations**:
   - TiltWrapper component records rotations automatically
   - Batches recent rotations before calling `recordRotation()`
   - Data stored in Vercel Marketplace Storage with 90-day retention

2. **Displaying Statistics**:
   - Stats page fetches data via `getSummaryStats()`
   - Server component passes data to client components
   - Charts render with Recharts library

3. **Health Reminders**:
   - HealthReminder component checks every 30 minutes
   - Uses browser Notification API
   - Requires user permission
   - Sends notification if 2+ hours inactive

4. **Goal Achievement**:
   - Monitors current count vs daily goal
   - Shows toast notification when goal reached
   - Visual progress bar in stats cards

## Usage

### In a Page

```tsx
import { getSummaryStats } from '@/lib/actions/stats'
import { getUserSettings } from '@/lib/actions/settings'
import { StatsDisplay } from '@/components/stats/StatsDisplay'

export default async function StatsPage() {
  const settings = await getUserSettings()
  const stats = await getSummaryStats()

  return <StatsDisplay initialStats={stats} dailyGoal={settings.dailyGoal} />
}
```

### Recording Rotations

```tsx
import { recordRotation } from '@/lib/actions/stats'

// In TiltWrapper or similar component
const handleRotation = async (angle: number, duration: number, count = 1) => {
  await recordRotation(angle, duration, count)
}
```

## Translations

All text is internationalized using next-intl. Keys are in `messages/[locale].json` under the `stats` namespace:

- `title`, `today`, `week`, `month`
- `rotationCount`, `totalDuration`, `goal`
- `goalAchieved`, `goalAchievedMessage`
- `healthReminder`, `healthReminderTitle`, `healthReminderBody`
- `notificationsOn`, `notificationsOff`
- `enableNotifications`, `disableNotifications`
- And more...

## Browser Compatibility

### Notification API

- Supported in all modern browsers
- Requires user permission
- Gracefully degrades if not supported
- Shows appropriate error messages

### Recharts

- Works in all modern browsers
- Responsive design
- Theme-aware (light/dark mode)

## Performance

- Server components for initial data loading
- Client components only for interactive parts
- Efficient data storage (max 100 records per day)
- 90-day data retention
- Periodic checks (30 min intervals) for reminders

## Testing

Test coverage includes:

- Server action unit tests
- Component rendering tests
- Notification permission flow
- Goal achievement logic
- Chart data formatting

## Future Enhancements

- Export statistics as CSV/PDF
- More detailed analytics
- Comparison with previous periods
- Customizable reminder intervals
- Achievement badges
- Social sharing
