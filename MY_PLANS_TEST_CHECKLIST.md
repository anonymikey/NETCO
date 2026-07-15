# My Plans System - Testing Checklist

## Phase 1: Authentication & Authorization

### Frontend Authentication
- [ ] User logs in to application
- [ ] My Plans page loads and fetches plans with JWT token (no x-user-id header)
- [ ] Check browser Network tab - Authorization header contains `Bearer <token>`
- [ ] Invalid/expired tokens show "Your session has expired" message
- [ ] User can view only their own plans (not other users' plans)

### Backend JWT Verification
- [ ] API endpoints reject requests without Authorization header (401 Unauthorized)
- [ ] API endpoints reject requests with invalid tokens (401 Unauthorized)
- [ ] API endpoints reject requests with expired tokens (401 Unauthorized)
- [ ] Valid JWT tokens are properly decoded and user ID extracted
- [ ] User cannot access plans belonging to other users (403 Forbidden)

## Phase 2: Plan Management

### Get User Plans
- [ ] `/api/plans/user-plans` returns only authenticated user's plans
- [ ] Returned plans include all required fields (id, status, expiryDate, etc.)
- [ ] Expired plans show correct status (expired, cancelled, or refunded)
- [ ] Active plans show correct status (active)

### Delete Plan
- [ ] User cannot delete active plans (shows 403 error)
- [ ] User can delete expired plans (older than expiry date)
- [ ] User can delete cancelled plans
- [ ] User can delete refunded plans
- [ ] Delete updates UI immediately
- [ ] Delete triggers realtime subscription update
- [ ] Non-owner cannot delete other users' plans (403 error)

### Download Config
- [ ] `/api/plans/{planId}/config` returns config data for active plans
- [ ] `/api/plans/{planId}/config` rejects downloads for expired plans
- [ ] Config URL is valid and accessible
- [ ] Download opens file in new tab

### Renew Plan
- [ ] `/api/plans/{planId}/renew` endpoint responds successfully
- [ ] Renew button shows renewal info for expired plans
- [ ] Renew redirects to checkout page (when integrated)

### View Instructions
- [ ] `/api/plans/{planId}/config` returns instructions field
- [ ] Instructions display correctly in UI
- [ ] Instructions are only available for active plans

## Phase 3: Realtime Updates

### Plan Approval (INSERT)
- [ ] When new plan is added by admin, page updates without refresh
- [ ] New plan appears in correct tab (Active/Expiring/Expired)
- [ ] Statistics are updated immediately

### Plan Renewal (UPDATE expiryDate)
- [ ] When plan is renewed (expiryDate extended), countdown resets
- [ ] Plan moves from Expiring to Active tab if needed
- [ ] Color state updates from red/orange to green
- [ ] Statistics refresh automatically

### Plan Expiry (UPDATE status)
- [ ] When plan expires (expiryDate passes), it moves to Expired tab
- [ ] Color state changes to grey
- [ ] Delete button becomes available
- [ ] Countdown stops at 0

### Plan Deletion (DELETE)
- [ ] When plan is deleted, it disappears from UI immediately
- [ ] Statistics are updated (count decreases)
- [ ] No page refresh required

## Phase 4: Countdown & Status Colors

### Live Countdown
- [ ] Countdown updates every 1 second without page refresh
- [ ] Countdown displays Days, Hours, Minutes, Seconds
- [ ] When countdown reaches 0, plan moves to Expired tab

### Color State Transitions
- [ ] Green: > 3 days remaining
- [ ] Yellow: 1-3 days remaining
- [ ] Orange: 6-24 hours remaining
- [ ] Red: < 6 hours remaining
- [ ] Grey: Expired

### Warning Messages
- [ ] Green: No warning
- [ ] Yellow: "Plan expiring soon - consider renewing"
- [ ] Orange: "Plan expiring in less than 24 hours"
- [ ] Red: "Plan expiring very soon - renew immediately"
- [ ] Grey: "Plan will auto-delete in X days"

## Phase 5: Session Management

### Session Expiry
- [ ] When session expires, toast notification appears: "Session Expired"
- [ ] User is automatically logged out
- [ ] Attempting to access My Plans redirects to Login page
- [ ] Session timer starts on login and expires after token lifetime

### Session Refresh
- [ ] New API requests get fresh JWT tokens
- [ ] No manual re-login needed if app is active
- [ ] Browser storage cleared on logout

## Phase 6: Backend Cleanup

### Cleanup Endpoint
- [ ] `POST /api/cleanup` responds with 200 status
- [ ] With valid `x-cron-secret` header, cleanup succeeds
- [ ] With invalid `x-cron-secret` header, cleanup returns 401
- [ ] Response includes `deletedCount` and `deletedPlanIds`

### Cleanup Logic
- [ ] Plans expired > 2 days ago are removed
- [ ] Plans expired < 2 days ago are NOT removed
- [ ] Only affected plans are deleted (all statuses: active, expired, cancelled, refunded)
- [ ] Realtime subscriptions notify about deleted plans

### Cron Scheduling
- [ ] EasyCron or similar service triggers cleanup daily
- [ ] Cleanup runs at scheduled time
- [ ] Logs confirm cleanup execution

## Phase 7: Data Integrity

### User Isolation
- [ ] User A cannot see User B's plans
- [ ] User A cannot delete User B's plans
- [ ] User A cannot download User B's config
- [ ] User A cannot view User B's instructions

### Data Consistency
- [ ] All plans have valid IDs and user IDs
- [ ] Expiry dates are valid dates
- [ ] Status values are one of: active, expired, cancelled, refunded
- [ ] No orphaned plans without user_id

### Error Handling
- [ ] Network errors show appropriate error messages
- [ ] 401 errors redirect to login
- [ ] 403 errors show "unauthorized" message
- [ ] 500 errors show generic error with retry option
- [ ] Invalid plan IDs return 404

## Phase 8: UI/UX

### Tabs & Filtering
- [ ] Active tab shows only active plans
- [ ] Expiring tab shows only plans expiring in < 3 days
- [ ] Expired tab shows only expired plans
- [ ] Tab counts are accurate
- [ ] Switching tabs is smooth

### Statistics
- [ ] Active Plans count is accurate
- [ ] Expiring Soon count is accurate
- [ ] Expired count is accurate
- [ ] Total Plans count equals sum of all plans

### Buttons & Interactions
- [ ] Download Config button works on active plans only
- [ ] Download button disabled/hidden on expired plans
- [ ] Setup button works on active plans only
- [ ] Delete button works on expired/cancelled/refunded only
- [ ] Renew button works on expired plans only
- [ ] All buttons have hover states
- [ ] All buttons have loading states during action

### Modals & Dialogs
- [ ] Delete confirmation modal appears on delete click
- [ ] Modal shows plan name correctly
- [ ] Cancel button closes modal without deleting
- [ ] Confirm button deletes plan
- [ ] Modal auto-closes on successful delete

## Manual Testing Steps

### Test Plan Access
1. Log in as User A
2. Note down their plan IDs
3. Log in as User B
4. Verify User B does NOT see User A's plans
5. Attempt to access User A's plan endpoints with User B's token
6. Verify 403 error is returned

### Test Countdown
1. Go to My Plans page
2. Observe countdown updating every second
3. Leave page open for 5+ minutes
4. Verify countdown continues updating
5. Verify color states change as time decreases

### Test Realtime
1. Open My Plans in Browser A
2. Open admin panel in Browser B
3. Update a plan in admin (approve, renew, expire, delete)
4. Verify change appears in Browser A without refresh

### Test Session Expiry
1. Log in to My Plans page
2. Wait for session to expire (or manually expire via dev tools)
3. Verify toast notification appears
4. Verify redirected to login on next action
5. Verify can log back in

### Test Delete Restrictions
1. Attempt to delete active plan - should show error
2. Attempt to delete expired plan > 2 days - should succeed
3. Attempt to delete expired plan < 2 days - should succeed
4. Attempt to delete cancelled plan - should succeed
5. Attempt to delete refunded plan - should succeed

## Performance Checks

- [ ] Page loads in < 2 seconds with 10+ plans
- [ ] Countdown updates don't cause layout shifts
- [ ] Realtime updates are received within < 1 second
- [ ] No memory leaks with open page for 1+ hour
- [ ] API responses are < 200ms for typical cases

## Security Checks

- [ ] XSS: No inline scripts in plan data
- [ ] CSRF: All state-changing requests use POST/DELETE
- [ ] SQL Injection: All queries use parameterized statements
- [ ] Authentication: All protected endpoints verify JWT
- [ ] Authorization: User can only access own data
