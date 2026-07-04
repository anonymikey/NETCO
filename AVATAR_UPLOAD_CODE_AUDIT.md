# Avatar Upload Code Audit

## Complete Upload Function (account.tsx lines 255-312)

```typescript
const [uploadingAvatar, setUploadingAvatar] = useState(false);

const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !user) return;

  // Validate file type and size
  if (!file.type.startsWith("image/")) {
    toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
    return;
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    toast({ title: "Error", description: "Image must be smaller than 5MB", variant: "destructive" });
    return;
  }

  setUploadingAvatar(true);
  try {
    // Get authenticated user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    console.log("[v0] Auth UID:", authUser?.id);
    console.log("[v0] Auth Email:", authUser?.email);

    // Upload to Supabase storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log("[v0] Bucket:", "user-avatars");
    console.log("[v0] Path:", filePath);
    console.log("[v0] User ID from context:", user.id);
    console.log("[v0] File type:", file.type);
    console.log("[v0] File size:", file.size);

    const result = await supabase.storage
      .from("user-avatars")
      .upload(filePath, file, { upsert: true });

    console.log("[v0] Upload result:", result);

    const { error: uploadError } = result;

    if (uploadError) {
      console.error("[v0] Avatar upload error:", uploadError);
      console.error("[v0] Error message:", uploadError.message);
      console.error("[v0] Error status:", uploadError.status);
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from("user-avatars")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;
    console.log("[v0] Avatar uploaded successfully, public URL:", publicUrl);

    setAvatarUrl(publicUrl);
    
    toast({
      title: "Success",
      description: "Avatar uploaded successfully. Click 'Save Profile' to apply changes.",
    });
  } catch (err) {
    console.error("[v0] Avatar upload failed:", err);
    toast({
      title: "Failed to upload avatar",
      description: err instanceof Error ? err.message : "An error occurred",
      variant: "destructive",
    });
  } finally {
    setUploadingAvatar(false);
  }
};
```

## Storage Call Details

```typescript
const result = await supabase.storage
  .from("user-avatars")
  .upload(filePath, file, { upsert: true });
```

**Upload Path Format:**
```
avatars/${user.id}-${Date.now()}.${fileExt}
```

**Example:**
```
avatars/761ee941-969d-4e90-98aa-36d046f8585f-1704067200000.png
```

## Authentication Check

The function retrieves the authenticated user:
```typescript
const {
  data: { user: authUser },
} = await supabase.auth.getUser();
```

This confirms `auth.uid()` is available and valid before upload.

## Supabase Client Initialization

From `lib/supabase.ts`:
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder",
);
```

**This is the official Supabase client used throughout the app.**

## RLS Policy Issue Analysis

The 403 error occurs because:

1. The storage bucket `user-avatars` has RLS enabled
2. The RLS policies were too restrictive or missing INSERT/UPDATE permissions
3. `upsert: true` requires both INSERT and UPDATE permissions
4. Storage policies must allow `auth.role() = 'authenticated'`

## Solution: FIX_RLS_POLICIES_V2.sql

Run this script in Supabase SQL Editor:
- Drops old problematic policies
- Creates simple policies based on `auth.role() = 'authenticated'`
- Allows INSERT (for new uploads)
- Allows UPDATE (for upsert)
- Allows SELECT (public read)
- Allows DELETE (user delete their own)

After running the script:
1. Hard refresh the app (Ctrl+Shift+R)
2. Test avatar upload
3. Check browser console for debug logs
4. Upload should succeed with 200 status
