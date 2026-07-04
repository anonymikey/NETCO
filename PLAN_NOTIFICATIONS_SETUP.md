# Plan Expiry Notifications Implementation

## Overview
Automated notifications system that alerts users when their VPN plans are expiring, based on time thresholds:
- **7 Days Remaining**: "Your Safaricom VPN expires in 7 days."
- **24 Hours Remaining**: "Your VPN expires tomorrow."
- **1 Hour Remaining**: "Your VPN expires in 1 hour."
- **Expired**: "Your VPN configuration has expired."

## Architecture

### Backend Components

#### 1. Plan Notifications Service (`lib/plan-notifications.ts`)
- `getPlanExpiryNotifications()` - Queries database for plans at each expiry threshold
- `getNotificationMessage()` - Generates human-readable messages based on trigger
- `checkAndCreatePlanNotifications()` - Main function called periodically to create notifications

#### 2. Notifications API Endpoint
- `POST /api/notifications/check-plan-expiry` - Triggers notification generation
- Can be called by:
  - Frontend on app load (via NotificationsProvider)
  - Cron job running every 1-5 minutes
  - Client polling every 5 minutes

### Frontend Components

#### 1. Enhanced Notifications Context
- Automatically calls `check-plan-expiry` on mount
- Polls every 5 minutes for new plan expiry notifications
- Provides notification data to entire app

#### 2. Notification Card with Animations
- Slide-in animation (fade + translate) on appearance
- Pulsing animation on unread status indicator
- Beautiful gradient backgrounds for different notification types
- Smooth transition when marking as read

#### 3. Notifications Dropdown
- Smooth scale + fade animation on open/close
- AnimatePresence wrapper for smooth notification list updates
- Supports batch marking all notifications as read

## Notification Types

```typescript
// Notification Type Configuration
{
  plan: {
    icon: Gift,
    accent: "from-pink-500/20 to-pink-500/10",
    dot: "bg-pink-500"
  },
  warning: {
    icon: AlertTriangle,
    accent: "from-yellow-500/20 to-yellow-500/10",
    dot: "bg-yellow-500"
  },
  error: {
    icon: AlertCircle,
    accent: "from-red-500/20 to-red-500/10",
    dot: "bg-red-500"
  }
}
```

## Setup Instructions

### 1. Database
The `notifications` table already exists with the required schema:
- `id` - UUID primary key
- `userId` - Reference to user_profiles
- `title` - Notification title
- `message` - Notification body
- `type` - Notification type (info, success, warning, error, order, payment, plan)
- `isRead` - Boolean flag for read status
- `createdAt`, `updatedAt` - Timestamps

### 2. API Integration
The notification check endpoint is already integrated:
- Frontend automatically calls it on app load
- Polls every 5 minutes via NotificationsProvider
- No additional setup required

### 3. Cron Job (Optional but Recommended)
For more frequent updates, add a cron job:

```bash
# Run every minute
curl -X POST https://your-api.com/api/notifications/check-plan-expiry \
  -H "Content-Type: application/json"
```

Or use a service like:
- Vercel Cron Functions
- AWS CloudWatch Events
- External cron service (EasyCron, cron-job.org)

## How It Works

### Flow
1. User logs in → NotificationsProvider mounts
2. Automatically calls `POST /api/notifications/check-plan-expiry`
3. Backend queries `user_plans` table for expiring plans
4. Creates notifications in `notifications` table for each expiring plan
5. Frontend refetches notifications every 15 seconds (via useNotifications hook)
6. Notifications appear in dropdown with slide-in animation
7. Unread notifications have pulsing indicator
8. Clicking marks as read

### Time Thresholds
The system checks for plans expiring within:
1. **1 hour** - Red error notification "Expiring Now"
2. **24 hours** - Yellow warning notification "Expires Tomorrow"
3. **7 days** - Info notification "Expires Soon"
4. **Already expired** - Red error notification "Expired"

Each check excludes already-notified periods to avoid duplicates.

## Animations

### Notification Card
- **Entrance**: `opacity: 0, x: -20` → `opacity: 1, x: 0` (300ms)
- **Exit**: `opacity: 0, x: 20` (300ms)
- **Unread Dot**: Scale pulse `1 → 1.2 → 1` (2s infinite)

### Dropdown
- **Open**: `scale: 0.95, opacity: 0, y: -10` → `scale: 1, opacity: 1, y: 0` (200ms)
- **Close**: Reverse animation (200ms)

### List
- Uses `AnimatePresence` with `popLayout` mode for smooth reordering

## Testing

Test the system by:
1. Creating a test plan with expiry in 1 hour
2. Calling `POST /api/notifications/check-plan-expiry`
3. Checking notification dropdown for new notification
4. Verifying animation plays smoothly
5. Clicking notification to mark as read (dot disappears)

## Future Enhancements

- Email notifications as backup
- Push notifications via service worker
- Notification preferences (frequency, channels)
- Snooze notifications
- Notification history archive
- Analytics on notification interactions
