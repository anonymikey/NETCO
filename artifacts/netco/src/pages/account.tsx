import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";
import { Loader2, LogOut, Save, AlertCircle, Mail, Shield, Smartphone, Globe, Moon, Download, Trash2, Eye, EyeOff, Plus } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  username?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  bio?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  newsletterSubscribed: boolean;
  preferredTheme?: string;
  preferredLanguage?: string;
  notificationPreferences?: {
    email: boolean;
    orders: boolean;
    payments: boolean;
    promotional: boolean;
    securityAlerts: boolean;
  };
}

export default function AccountPage() {
  const [, navigate] = useLocation();
  const { user, session, signOut } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");
  const [bio, setBio] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(true);
  const [preferredTheme, setPreferredTheme] = useState("system");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    orders: true,
    payments: true,
    promotional: false,
    securityAlerts: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !session) {
      navigate("/login");
    }
  }, [user, session]);

  // Load profile
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const res = await fetch(apiUrl(`api/auth/profile/${user.id}`));
        if (!res.ok) throw new Error("Failed to load profile");

        const data = await res.json();
        setProfile(data);
        setFullName(data.fullName || "");
        setUsername(data.username || "");
        setPhone(data.phone || "");
        setCountry(data.country || "");
        setTimezone(data.timezone || "");
        setBio(data.bio || "");
        setNewsletterSubscribed(data.newsletterSubscribed ?? true);
        setPreferredTheme(data.preferredTheme || "system");
        setPreferredLanguage(data.preferredLanguage || "en");
        setNotificationPreferences(data.notificationPreferences || {
          email: true,
          orders: true,
          payments: true,
          promotional: false,
          securityAlerts: true,
        });
      } catch (err) {
        console.error("[v0] Failed to load profile:", err);
        toast({
          title: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const res = await fetch(apiUrl(`api/auth/profile/${user.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName || undefined,
          username: username || undefined,
          phone: phone || undefined,
          country: country || undefined,
          timezone: timezone || undefined,
          bio: bio || undefined,
          newsletterSubscribed,
          preferredTheme,
          preferredLanguage,
          notificationPreferences,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      const updated = await res.json();
      setProfile(updated);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (err) {
      console.error("[v0] Profile save error:", err);
      toast({
        title: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading account settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">My Account</h1>
          <p className="text-lg text-muted-foreground">Manage your profile, security, and preferences</p>
        </div>

        {/* Email Verification Alert */}
        {profile && !profile.isEmailVerified && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Email not verified</p>
              <p className="text-sm text-amber-800 mt-1">Check your inbox for a verification email from Supabase.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile details and personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="bg-muted border-border opacity-60 cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">
                        {profile?.isEmailVerified ? "✓ Verified" : "Awaiting verification"}
                      </p>
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

                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="johndoe"
                        className="bg-card border-border focus:border-primary"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0712345678"
                        className="bg-card border-border focus:border-primary"
                      />
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

                    {/* Timezone */}
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="bg-card border-border">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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

                  {/* Newsletter */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                    <Checkbox
                      id="newsletter"
                      checked={newsletterSubscribed}
                      onCheckedChange={(checked) => setNewsletterSubscribed(checked === true)}
                    />
                    <Label htmlFor="newsletter" className="flex-1 cursor-pointer mb-0">
                      Subscribe to newsletter and product updates
                    </Label>
                  </div>

                  {/* Save Button */}
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your password and two-factor authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Section */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Password
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">Change your password to keep your account secure</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                      Update Password
                    </Button>
                  </div>
                </div>

                {/* 2FA Section */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {profile?.twoFactorEnabled ? "Enabled - Your account is protected" : "Disabled - Add an extra layer of security"}
                      </p>
                    </div>
                    <Button variant={profile?.twoFactorEnabled ? "outline" : "default"} className="gap-2">
                      {profile?.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                    </Button>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Active Sessions</h4>
                  <p className="text-sm text-muted-foreground">Manage your active sessions on different devices</p>
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-xs text-muted-foreground mt-1">This browser • Last active now</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                </div>

                {/* Sign Out All */}
                <Button variant="destructive" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out From All Devices
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "email", label: "Email Notifications", desc: "Receive important updates via email" },
                  { key: "orders", label: "Order Updates", desc: "Get notified about your orders" },
                  { key: "payments", label: "Payment Notifications", desc: "Alerts about payment status" },
                  { key: "securityAlerts", label: "Security Alerts", desc: "Critical security notifications" },
                  { key: "promotional", label: "Promotional Offers", desc: "Special deals and promotions" },
                ].map((notif) => (
                  <div key={notif.key} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex-1">
                      <p className="font-medium">{notif.label}</p>
                      <p className="text-sm text-muted-foreground">{notif.desc}</p>
                    </div>
                    <Checkbox
                      checked={notificationPreferences[notif.key as keyof typeof notificationPreferences]}
                      onCheckedChange={(checked) => setNotificationPreferences({
                        ...notificationPreferences,
                        [notif.key]: checked === true,
                      })}
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 mt-6"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Save Preferences</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance & Preferences</CardTitle>
                <CardDescription>Customize how NETCO looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div className="space-y-3">
                  <Label htmlFor="theme" className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Theme
                  </Label>
                  <Select value={preferredTheme} onValueChange={setPreferredTheme}>
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-3">
                  <Label htmlFor="language">Language</Label>
                  <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="sw">Kiswahili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Save Preferences</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export your data or permanently delete your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Export Data */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Your Data
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">Download all your personal information in a portable format</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export Data
                    </Button>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-red-600 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </h4>
                      <p className="text-sm text-red-600/80 mt-1">Permanently delete your account and all associated data</p>
                    </div>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sign Out Button */}
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-red-500/30 text-red-600 hover:bg-red-500/10 h-11"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
