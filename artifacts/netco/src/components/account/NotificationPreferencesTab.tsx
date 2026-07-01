import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Bell, MessageSquare } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface NotificationPreferencesTabProps {
  userId: string;
}

interface NotificationSettings {
  emailOffersAndDeals: boolean;
  emailNewFeatures: boolean;
  emailProductUpdates: boolean;
  emailSystemNotifications: boolean;
  emailWeeklyDigest: boolean;
  pushOffersAndDeals: boolean;
  pushOrderUpdates: boolean;
  pushAccountNotifications: boolean;
  smsEnabled: boolean;
  smsOffersAndDeals: boolean;
  smsOrderUpdates: boolean;
  unsubscribedFromAll: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  emailOffersAndDeals: true,
  emailNewFeatures: true,
  emailProductUpdates: true,
  emailSystemNotifications: true,
  emailWeeklyDigest: false,
  pushOffersAndDeals: true,
  pushOrderUpdates: true,
  pushAccountNotifications: true,
  smsEnabled: false,
  smsOffersAndDeals: false,
  smsOrderUpdates: false,
  unsubscribedFromAll: false,
};

export default function NotificationPreferencesTab({ userId }: NotificationPreferencesTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await fetch(apiUrl(`api/auth/notification-preferences/${userId}`));
        if (!res.ok) throw new Error("Failed to load preferences");
        const data = await res.json();
        setSettings(data);
      } catch (error) {
        console.error("[v0] Error loading notification preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(apiUrl(`api/auth/notification-preferences/${userId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save preferences");

      toast({ title: "Success", description: "Notification preferences saved" });
    } catch (error) {
      console.error("[v0] Error saving notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading preferences...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="push" className="gap-2">
            <Bell className="w-4 h-4" />
            Push
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Choose which email notifications you&apos;d like to receive. Admin will send promotional offers and updates through Resend email service.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailOffersAndDeals"
                checked={settings.emailOffersAndDeals}
                onCheckedChange={() => handleToggle("emailOffersAndDeals")}
              />
              <Label htmlFor="emailOffersAndDeals" className="cursor-pointer">
                <div className="font-medium">Offers & Deals</div>
                <p className="text-xs text-muted-foreground">Receive special promotions and discounts</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailNewFeatures"
                checked={settings.emailNewFeatures}
                onCheckedChange={() => handleToggle("emailNewFeatures")}
              />
              <Label htmlFor="emailNewFeatures" className="cursor-pointer">
                <div className="font-medium">New Features</div>
                <p className="text-xs text-muted-foreground">Learn about new features</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailProductUpdates"
                checked={settings.emailProductUpdates}
                onCheckedChange={() => handleToggle("emailProductUpdates")}
              />
              <Label htmlFor="emailProductUpdates" className="cursor-pointer">
                <div className="font-medium">Product Updates</div>
                <p className="text-xs text-muted-foreground">Get updates on products you&apos;re interested in</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailSystemNotifications"
                checked={settings.emailSystemNotifications}
                onCheckedChange={() => handleToggle("emailSystemNotifications")}
              />
              <Label htmlFor="emailSystemNotifications" className="cursor-pointer">
                <div className="font-medium">System Notifications</div>
                <p className="text-xs text-muted-foreground">Important account and system updates</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailWeeklyDigest"
                checked={settings.emailWeeklyDigest}
                onCheckedChange={() => handleToggle("emailWeeklyDigest")}
              />
              <Label htmlFor="emailWeeklyDigest" className="cursor-pointer">
                <div className="font-medium">Weekly Digest</div>
                <p className="text-xs text-muted-foreground">Summary of activities every Sunday</p>
              </Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="push" className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Enable push notifications for real-time updates.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pushOffersAndDeals"
                checked={settings.pushOffersAndDeals}
                onCheckedChange={() => handleToggle("pushOffersAndDeals")}
              />
              <Label htmlFor="pushOffersAndDeals" className="cursor-pointer">
                <div className="font-medium">Offers & Deals</div>
                <p className="text-xs text-muted-foreground">Push notifications for special offers</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pushOrderUpdates"
                checked={settings.pushOrderUpdates}
                onCheckedChange={() => handleToggle("pushOrderUpdates")}
              />
              <Label htmlFor="pushOrderUpdates" className="cursor-pointer">
                <div className="font-medium">Order Updates</div>
                <p className="text-xs text-muted-foreground">Get notified about your orders</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pushAccountNotifications"
                checked={settings.pushAccountNotifications}
                onCheckedChange={() => handleToggle("pushAccountNotifications")}
              />
              <Label htmlFor="pushAccountNotifications" className="cursor-pointer">
                <div className="font-medium">Account Notifications</div>
                <p className="text-xs text-muted-foreground">Security and account updates</p>
              </Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Enable SMS notifications for urgent alerts.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="smsEnabled"
                checked={settings.smsEnabled}
                onCheckedChange={() => handleToggle("smsEnabled")}
              />
              <Label htmlFor="smsEnabled" className="cursor-pointer">
                <div className="font-medium">Enable SMS Notifications</div>
                <p className="text-xs text-muted-foreground">Allow us to send you SMS messages</p>
              </Label>
            </div>

            {settings.smsEnabled && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smsOffersAndDeals"
                    checked={settings.smsOffersAndDeals}
                    onCheckedChange={() => handleToggle("smsOffersAndDeals")}
                  />
                  <Label htmlFor="smsOffersAndDeals" className="cursor-pointer">
                    <div className="font-medium">SMS Offers</div>
                    <p className="text-xs text-muted-foreground">Receive SMS about offers</p>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smsOrderUpdates"
                    checked={settings.smsOrderUpdates}
                    onCheckedChange={() => handleToggle("smsOrderUpdates")}
                  />
                  <Label htmlFor="smsOrderUpdates" className="cursor-pointer">
                    <div className="font-medium">SMS Order Updates</div>
                    <p className="text-xs text-muted-foreground">Get SMS alerts for orders</p>
                  </Label>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4 space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="unsubscribedFromAll"
            checked={settings.unsubscribedFromAll}
            onCheckedChange={() => handleToggle("unsubscribedFromAll")}
          />
          <Label htmlFor="unsubscribedFromAll" className="cursor-pointer text-red-600">
            Unsubscribe from all communications
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={saving} className="w-full gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? "Saving..." : "Save Notification Preferences"}
      </Button>
    </form>
  );
}
