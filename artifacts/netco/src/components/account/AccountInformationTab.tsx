import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  phone?: string;
  country?: string;
  bio?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
}

interface AccountInformationTabProps {
  profile: UserProfile | null;
  saving: boolean;
  uploadingAvatar: boolean;
  avatarUrl: string;
  fullName: string;
  username: string;
  phone: string;
  country: string;
  bio: string;
  onFullNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSave: (e: React.FormEvent) => Promise<void>;
}

export default function AccountInformationTab({
  profile,
  saving,
  uploadingAvatar,
  avatarUrl,
  fullName,
  username,
  phone,
  country,
  bio,
  onFullNameChange,
  onUsernameChange,
  onPhoneChange,
  onCountryChange,
  onBioChange,
  onAvatarUpload,
  onSave,
}: AccountInformationTabProps) {
  const { toast } = useToast();

  return (
    <form onSubmit={onSave} className="space-y-8">
      {/* Avatar Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Profile Picture</h3>
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatarUrl} alt={fullName || "User"} />
            <AvatarFallback>{fullName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={onAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={uploadingAvatar}
                asChild
              >
                <span>
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploadingAvatar ? "Uploading..." : "Upload Picture"}
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground">Max 5MB. JPG, PNG, GIF</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Personal Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Choose your username"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ""}
              disabled
              className="bg-muted/50 opacity-70 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              {profile?.isEmailVerified ? "✓ Verified" : "Pending verification"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="Your country"
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell us about yourself..."
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
      </div>

      {/* Save Button */}
      <Button type="submit" disabled={saving} className="w-full gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
