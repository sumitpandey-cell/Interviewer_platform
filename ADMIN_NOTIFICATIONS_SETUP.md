# Admin Notifications Setup

## Overview
The Admin Notifications feature allows designated admin users to send notifications to all users or specific users through a dedicated admin panel.

## Configuration

### Setting Up Admin Emails

To enable the Admin Notifications feature for specific users, you need to configure admin emails in your environment variables.

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following variable:

```env
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com,admin3@example.com
```

**Note:** 
- Separate multiple admin emails with commas (no spaces)
- Only users with emails listed in this variable will see the "Admin Notifications" menu item in the sidebar
- The admin notifications page will show an "Access Denied" message to non-admin users

### Example Configuration

```env
# Admin Configuration
VITE_ADMIN_EMAILS=sumit@example.com,admin@yourcompany.com

# Other environment variables...
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Features

### Admin Notifications Page (`/admin/notifications`)

The admin panel provides the following features:

1. **Send to All Users**: Broadcast notifications to all platform users
2. **Send to Specific User**: Target individual users by their User ID
3. **Notification Types**:
   - ℹ️ **Info**: General information and updates
   - ✅ **Success**: Positive achievements or confirmations
   - ⚠️ **Warning**: Important notices requiring attention
   - ❌ **Error**: Critical issues or urgent alerts
4. **Live Preview**: See how the notification will appear before sending
5. **Access Control**: Only users with admin emails can access this page

### Sidebar Integration

- The "Admin Notifications" menu item appears in the sidebar between "Templates" and "Settings"
- It uses a bell icon (BellRing) for easy identification
- Only visible to users whose email is in the `VITE_ADMIN_EMAILS` list
- Fully responsive and works with the collapsible sidebar

## Usage

1. Log in with an admin email account
2. Navigate to "Admin Notifications" from the sidebar
3. Choose to send to all users or a specific user
4. Select the notification type
5. Enter a title and message
6. Review the preview
7. Click "Send Notification"

## Finding User IDs

To send notifications to specific users, you'll need their User ID:

1. Go to your Supabase dashboard
2. Navigate to Authentication → Users
3. Find the user and copy their UUID
4. Paste it into the "User ID" field in the admin panel

## Security

- Admin access is controlled via environment variables
- Non-admin users cannot access the admin notifications page
- The page displays an "Access Denied" message to unauthorized users
- All admin emails are checked against the configured list

## Troubleshooting

### "Admin Notifications" not showing in sidebar
- Verify your email is added to `VITE_ADMIN_EMAILS` in `.env.local`
- Restart the development server after adding environment variables
- Check that there are no spaces in the comma-separated email list

### Cannot send notifications
- Ensure you have the proper Supabase permissions
- Check that the `use-notifications` hook is properly configured
- Verify your Supabase connection is working

## Technical Details

### Files Modified
- `/src/components/DashboardLayout.tsx`: Added admin check and menu item
- `/src/pages/AdminNotifications.tsx`: Admin notifications page (already existed)
- `/src/App.tsx`: Route configuration (already existed)

### Dependencies
- Uses the `use-notifications` hook for sending notifications
- Integrates with Supabase for user management
- Uses the existing authentication context for user verification
