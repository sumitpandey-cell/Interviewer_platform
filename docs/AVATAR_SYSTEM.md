# Avatar System Documentation

## Overview
The application now has a complete avatar system that prioritizes user-uploaded profile images and falls back to auto-generated cartoonish avatars when no profile image exists.

## How It Works

### 1. **Priority Order**
The system follows this priority order for displaying avatars:
1. **User's uploaded profile image** (stored in Supabase Storage)
2. **Auto-generated cartoonish avatar** (using DiceBear API)
3. **Initials fallback** (if image fails to load)

### 2. **Data Flow**

#### Profile Image Upload (Manual)
```
User uploads image → Compressed → Stored in Supabase Storage (avatars bucket)
                                          ↓
                              Public URL generated
                                          ↓
                    Saved to auth.users.raw_user_meta_data.avatar_url
                                          ↓
                    Auto-synced to profiles.avatar_url (via trigger)
```

#### Google OAuth Sign-In
```
User signs in with Google → Google profile picture URL received
                                          ↓
                    Saved to auth.users.raw_user_meta_data.picture
                                          ↓
                    Auto-synced to profiles.avatar_url (via trigger)
                                          ↓
                    Leaderboard displays Google profile picture
```

#### Avatar Display Priority
```
Component requests avatar → getAvatarUrl() checks avatar sources in order:
                                          ↓
                    1. User's uploaded avatar (avatar_url)
                                          ↓
                    2. OAuth profile picture (picture) 
                                          ↓
                    3. Generated cartoonish avatar (DiceBear)
                                          ↓
                          Avatar component displays image
                                          ↓
                          If load fails: Show initials in colored circle
```

**Note**: The database sync trigger automatically merges both `avatar_url` and `picture` into the `profiles.avatar_url` field, prioritizing manually uploaded avatars over OAuth pictures. This means the leaderboard automatically displays Google profile pictures for users who signed in with Google and haven't uploaded a custom avatar.

### 3. **Database Schema**

#### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,  -- Stores the public URL of uploaded avatar
  ...
);
```

#### Storage Bucket
- **Bucket Name**: `avatars`
- **Public Access**: Yes (read-only)
- **File Path**: `{user_id}/avatar.{ext}`
- **Policies**: 
  - Public can read
  - Authenticated users can upload/update/delete their own avatars

### 4. **Auto-Sync Trigger**
When a user updates their profile in `auth.users`, the `handle_user_update()` trigger automatically syncs:
- `full_name` from `raw_user_meta_data.full_name`
- `avatar_url` from `raw_user_meta_data.avatar_url` or `raw_user_meta_data.picture`

### 5. **Utility Functions**

#### `getAvatarUrl(avatarUrl, fallbackSeed, style)`
- **Purpose**: Returns the appropriate avatar URL
- **Parameters**:
  - `avatarUrl`: User's uploaded avatar URL (can be null/undefined)
  - `fallbackSeed`: Unique identifier (user ID or name) for consistent avatar generation
  - `style`: Avatar style (default: 'avataaars')
- **Returns**: URL string for the avatar to display

#### `generateAvatar(seed, style)`
- **Purpose**: Generates a cartoonish avatar URL using DiceBear API
- **Parameters**:
  - `seed`: Unique identifier for consistent avatar generation
  - `style`: Avatar style options:
    - `avataaars` - Cartoonish, Bitmoji-style (default)
    - `bottts` - Robot avatars
    - `fun-emoji` - Emoji-based avatars
    - `lorelei` - Illustrated portraits
    - `notionists` - Notion-style avatars
    - `personas` - Diverse character avatars
- **Returns**: URL string pointing to DiceBear API

#### `getInitials(name)`
- **Purpose**: Extracts initials from a full name
- **Parameters**: `name` - Full name of the user
- **Returns**: Initials (max 2 characters, first + last name)

### 6. **Implementation Locations**

#### Files Updated:
1. **`/src/lib/avatar-utils.ts`** - Core utility functions
2. **`/src/pages/Leaderboard.tsx`** - Leaderboard avatars (podium + table)
3. **`/src/components/DashboardLayout.tsx`** - User profile dropdown avatar
4. **`/src/pages/Settings.tsx`** - Settings page avatar preview

#### Example Usage:
```tsx
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";

<Avatar>
  <AvatarImage src={getAvatarUrl(
    user.avatarUrl,
    user.userId || user.fullName || 'user'
  )} />
  <AvatarFallback>
    {getInitials(user.fullName)}
  </AvatarFallback>
</Avatar>
```

### 7. **DiceBear API**
- **Service**: Free avatar generation API
- **Version**: 7.x
- **Base URL**: `https://api.dicebear.com/7.x/{style}/svg`
- **No API Key Required**: Completely free and open
- **Consistent**: Same seed always generates the same avatar
- **Format**: SVG (scalable, lightweight)

### 8. **Benefits**

✅ **User Experience**
- Every user has a unique, recognizable avatar
- No blank or generic placeholders
- Consistent avatar across all sessions

✅ **Performance**
- SVG format is lightweight
- No database storage needed for generated avatars
- Generated on-the-fly via URL

✅ **Privacy**
- Users can choose to upload their own photo
- Or use auto-generated avatar (no personal photo required)

✅ **Customization**
- Multiple avatar styles available
- Easy to change style globally by updating default parameter

### 9. **Future Enhancements**

Possible improvements:
- Allow users to choose their preferred avatar style
- Add avatar customization options (colors, accessories)
- Cache generated avatar URLs in localStorage
- Add avatar upload validation (file size, dimensions)
- Implement avatar cropping tool
