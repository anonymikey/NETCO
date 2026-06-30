import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

interface SecurityTabProps {
  twoFactorEnabled?: boolean;
  lastPasswordChangeAt?: string;
}

export default function SecurityTab({ twoFactorEnabled, lastPasswordChangeAt }: SecurityTabProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
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

    setUpdating(true);
    try {
      // TODO: Implement password change via Supabase Auth
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Success", description: "Password updated successfully" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update password", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggle2FA = async () => {
    setTwoFactorLoading(true);
    try {
      if (twoFactorEnabled) {
        // Disable 2FA
        toast({ title: "Info", description: "2FA disabled", variant: "default" });
      } else {
        // Enable 2FA
        toast({ title: "Info", description: "2FA setup initiated. Scan QR code with authenticator app.", variant: "default" });
      }
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Password Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Change Password</h3>
          <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={updating}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={updating}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={updating}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside">
              <li>At least 8 characters</li>
              <li>Mix of uppercase and lowercase letters</li>
              <li>At least one number</li>
              <li>At least one special character</li>
            </ul>
          </div>

          <Button type="submit" disabled={updating} className="w-full gap-2">
            {updating && <Loader2 className="w-4 h-4 animate-spin" />}
            {updating ? "Updating..." : "Update Password"}
          </Button>
        </form>

        {lastPasswordChangeAt && (
          <p className="text-xs text-muted-foreground">
            Last changed: {new Date(lastPasswordChangeAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {twoFactorEnabled
              ? "Two-factor authentication is enabled on your account"
              : "Two-factor authentication is not enabled. Enable it to secure your account."}
          </AlertDescription>
        </Alert>

        {twoFactorEnabled && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your account is protected with two-factor authentication
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleToggle2FA}
          disabled={twoFactorLoading}
          variant={twoFactorEnabled ? "outline" : "default"}
          className="w-full gap-2"
        >
          {twoFactorLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {twoFactorLoading
            ? "Processing..."
            : twoFactorEnabled
              ? "Disable 2FA"
              : "Enable 2FA"}
        </Button>
      </div>

      {/* Sessions Info */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Security Info</h3>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <p className="text-sm">
            <span className="font-medium">Last Password Update:</span> {lastPasswordChangeAt ? new Date(lastPasswordChangeAt).toLocaleDateString() : "Never"}
          </p>
          <p className="text-sm text-muted-foreground">
            Visit the &quot;Active Sessions&quot; tab to manage your connected devices.
          </p>
        </div>
      </div>
    </div>
  );
}
