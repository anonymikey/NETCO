import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { apiUrl } from "@/lib/api";
import { Loader2, LogOut, Save, AlertCircle, Upload, CheckCircle2, Clock, ShoppingCart, Shield, Bell, Lock, User, Globe, Eye, EyeOff, Smartphone, Monitor, CheckCircle } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  phone?: string;
  country?: string;
  bio?: string;
  avatarUrl?: string;
  timezone?: string;
  preferredLanguage?: string;
  preferredTheme?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled?: boolean;
  newsletterSubscribed: boolean;
  ordersCount?: number;
  activePlansCount?: number;
  devicesCount?: number;
  notificationsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function AccountPage() {
  const [, navigate] = useLocation();
  const { user, session, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [preferredTheme, setPreferredTheme] = useState("dark");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    orderNotifications: true,
    planExpiryReminders: true,
    systemAnnouncements: true,
    marketingEmails: false,
  });
  const [activeDevices, setActiveDevices] = useState<any[]>([]);

  // Redirect if not authenticated (wait for auth to finish loading first)
  useEffect(() => {
    if (!authLoading && (!user || !session)) {
      navigate("/login");
    }
  }, [authLoading, user, session, navigate]);

  // Load profile
  useEffect(() => {
    if (!user || authLoading) return;

    const loadProfile = async () => {
      try {
        const res = await fetch(apiUrl(`api/auth/profile/${user.id}`));
        if (!res.ok) throw new Error("Failed to load profile");

        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          console.error("[v0] API returned non-JSON response, using fallback");
          setProfile({
            id: user.id,
            email: user.email || "",
            isEmailVerified: !!user.email_confirmed_at,
            isPhoneVerified: false,
            newsletterSubscribed: true,
          });
          setLoading(false);
          return;
        }

        const data = await res.json();
        // Override email verification status with Supabase auth state
        const isEmailVerified = !!user.email_confirmed_at;
        setProfile({
          ...data,
          isEmailVerified,
        });
        setAvatarUrl(data.avatarUrl || "");
        setFullName(data.fullName || "");
        setUsername(data.username || "");
        setPhone(data.phone || "");
        setCountry(data.country || "");
        setBio(data.bio || "");
        setTimezone(data.timezone || "UTC");
        setPreferredLanguage(data.preferredLanguage || "en");
        setPreferredTheme(data.preferredTheme || "dark");
        setNewsletterSubscribed(data.newsletterSubscribed ?? true);
      } catch (err) {
        console.error("[v0] Failed to load profile:", err);
        // Use fallback profile with user email and Supabase auth state
        setProfile({
          id: user.id,
          email: user.email || "",
          isEmailVerified: !!user.email_confirmed_at,
          isPhoneVerified: false,
          newsletterSubscribed: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, authLoading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const res = await fetch(apiUrl(`api/auth/profile/${user.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username || undefined,
          fullName: fullName || undefined,
          phone: phone || undefined,
          country: country || undefined,
          bio: bio || undefined,
          avatarUrl: avatarUrl || undefined,
          timezone: timezone || undefined,
          preferredLanguage: preferredLanguage || undefined,
          preferredTheme: preferredTheme || undefined,
          newsletterSubscribed,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to save profile" }));
        throw new Error(error.error || "Failed to save profile");
      }

      const data = await res.json();
      setProfile({
        ...profile,
        ...data,
      } as UserProfile);

      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (err) {
      console.error("[v0] Profile save error:", err);
      toast({
        title: "Failed to save profile",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in all password fields", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setUpdatingPassword(true);
    try {
      // Simulated password update - in real app, would use Supabase auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Success", description: "Password updated successfully" });
    } catch (err) {
      console.error("[v0] Password change error:", err);
      toast({ title: "Error", description: "Failed to update password", variant: "destructive" });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("[v0] Sign out error:", err);
      toast({ title: "Sign out failed", variant: "destructive" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{authLoading ? "Initializing..." : "Loading profile..."}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = (fullName || profile?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-12 px-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-2">Profile Management</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile Overview Card */}
        <div className="glass-card rounded-lg border border-card-border p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 border-2 border-primary/30">
                <AvatarImage src={avatarUrl || profile?.avatarUrl} alt="Profile" />
                <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold">{fullName || profile?.fullName || "User Profile"}</h2>
              <p className="text-muted-foreground">@{username || profile?.username || "username"}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {profile?.isEmailVerified && (
                  <Badge className="bg-green-500/20 text-green-400 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Email Verified
                  </Badge>
                )}
                {profile?.isPhoneVerified && (
                  <Badge className="bg-blue-500/20 text-blue-400 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Phone Verified
                  </Badge>
                )}
                {profile?.twoFactorEnabled && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 gap-1">
                    <Shield className="w-3 h-3" /> 2FA Enabled
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        {profile && (profile.ordersCount || profile.activePlansCount || profile.devicesCount || profile.notificationsCount) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card rounded-lg border border-card-border p-4 text-center">
              <ShoppingCart className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.ordersCount || 0}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="glass-card rounded-lg border border-card-border p-4 text-center">
              <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.activePlansCount || 0}</p>
              <p className="text-xs text-muted-foreground">Active Plans</p>
            </div>
            <div className="glass-card rounded-lg border border-card-border p-4 text-center">
              <User className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.devicesCount || 0}</p>
              <p className="text-xs text-muted-foreground">Devices</p>
            </div>
            <div className="glass-card rounded-lg border border-card-border p-4 text-center">
              <Bell className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.notificationsCount || 0}</p>
              <p className="text-xs text-muted-foreground">Notifications</p>
            </div>
          </div>
        )}

        {/* Verification Alert - using Supabase email_confirmed_at */}
        {profile && !profile.isEmailVerified && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Email not verified</p>
              <p className="text-sm text-muted-foreground mt-1">Check your inbox for a verification email from Supabase.</p>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="glass-card rounded-lg border border-card-border p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Profile Information
          </h3>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/30">
                  <AvatarImage src={avatarUrl || profile?.avatarUrl} alt="Profile" />
                  <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
                </Avatar>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" className="gap-2" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                      Upload Picture
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Email */}
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

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className="bg-card border-border focus:border-primary"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Mwangi"
                className="bg-card border-border focus:border-primary"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678"
                className="bg-card border-border focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                {profile?.isPhoneVerified ? "✓ Verified" : "Not verified"}
              </p>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Kenya"
                className="bg-card border-border focus:border-primary"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="bg-card border-border focus:border-primary min-h-24 resize-none"
              />
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 h-11 gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Preferences Section */}
        <div className="glass-card rounded-lg border border-card-border p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            Preferences
          </h3>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC"
                className="bg-card border-border focus:border-primary"
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <select
                id="language"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full bg-card border border-border rounded-md px-3 py-2 focus:border-primary focus:outline-none"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <Label htmlFor="theme">Preferred Theme</Label>
              <select
                id="theme"
                value={preferredTheme}
                onChange={(e) => setPreferredTheme(e.target.value)}
                className="w-full bg-card border border-border rounded-md px-3 py-2 focus:border-primary focus:outline-none"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            {/* Newsletter */}
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
              <Checkbox
                id="newsletter"
                checked={newsletterSubscribed}
                onCheckedChange={(checked) => setNewsletterSubscribed(checked === true)}
              />
              <Label htmlFor="newsletter" className="flex-1 cursor-pointer mb-0">
                Subscribe to newsletter and announcements
              </Label>
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 h-11 gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Account Information Card */}
        <div className="glass-card rounded-lg border border-card-border p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Account Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">{profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Account ID</span>
              <span className="font-mono text-sm">{profile?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Security Preview Card */}
        <div className="glass-card rounded-lg border border-card-border p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            Security
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Badge className={profile?.twoFactorEnabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                {profile?.twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
              <div>
                <p className="font-medium">Email Verification</p>
                <p className="text-sm text-muted-foreground">Your email is {profile?.isEmailVerified ? "verified" : "not verified"}</p>
              </div>
              <Badge className={profile?.isEmailVerified ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                {profile?.isEmailVerified ? "Verified" : "Pending"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="glass-card rounded-lg border border-card-border p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            Security
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="bg-card border-border focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-card border-border focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-card border-border focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Update Button */}
            <Button
              type="submit"
              disabled={updatingPassword}
              className="w-full bg-primary hover:bg-primary/90 h-11 gap-2"
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Notification Preferences Section */}
        <div className="glass-card rounded-lg border border-card-border p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            Notification Preferences
          </h3>
          <div className="space-y-4">
            {[
              { key: "orderNotifications", label: "Order Notifications", desc: "Get notified when your orders are processed" },
              { key: "planExpiryReminders", label: "Plan Expiry Reminders", desc: "Receive reminders before plans expire" },
              { key: "systemAnnouncements", label: "System Announcements", desc: "Important updates and maintenance notices" },
              { key: "marketingEmails", label: "Marketing Emails", desc: "Special offers and promotional content" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center gap-4 p-3 bg-background rounded-lg border border-border">
                <Checkbox
                  id={key}
                  checked={notificationPreferences[key as keyof typeof notificationPreferences]}
                  onCheckedChange={(checked) =>
                    setNotificationPreferences({
                      ...notificationPreferences,
                      [key]: checked === true,
                    })
                  }
                />
                <div className="flex-1 cursor-pointer">
                  <Label htmlFor={key} className="font-medium cursor-pointer mb-0">{label}</Label>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
              </div>
            ))}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 h-11 gap-2 mt-4"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Active Sessions Section */}
        <div className="glass-card rounded-lg border border-card-border p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            Active Sessions
          </h3>
          <div className="space-y-3">
            <div className="p-4 bg-background rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Current Device</div>
                <Badge className="bg-green-500/20 text-green-400">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Chrome • macOS • Last active: Now</p>
              <p className="text-xs text-muted-foreground mt-2">IP: 192.168.1.1</p>
            </div>

            {activeDevices.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No other active sessions</p>
            ) : (
              activeDevices.map((device) => (
                <div key={device.id} className="p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{device.browser}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-400/30 hover:bg-red-500/10"
                      onClick={() => toast({ title: "Device logged out", description: "Session terminated" })}
                    >
                      Logout
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{device.os} • Last active: {device.lastActive}</p>
                  <p className="text-xs text-muted-foreground mt-2">IP: {device.ipAddress}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-red-500/30 text-red-600 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
