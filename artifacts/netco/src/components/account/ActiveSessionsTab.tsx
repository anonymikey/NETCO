import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, LogOut, Monitor, Smartphone, AlertCircle } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface Session {
  id: string;
  deviceName: string;
  deviceType: string;
  browserName?: string;
  osName?: string;
  ipAddress: string;
  country?: string;
  city?: string;
  isCurrentSession: boolean;
  lastActivityAt: string;
  createdAt: string;
}

interface ActiveSessionsTabProps {
  userId: string;
}

export default function ActiveSessionsTab({ userId }: ActiveSessionsTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [logoutingAllOther, setLogoutingAllOther] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`api/auth/active-sessions/${userId}`));
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error("[v0] Error loading sessions:", error);
      toast({ title: "Error", description: "Failed to load sessions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to logout from this device?")) return;

    setDeletingSessionId(sessionId);
    try {
      const res = await fetch(apiUrl(`api/auth/active-sessions/${userId}/${sessionId}`), {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete session");

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast({ title: "Success", description: "Device logged out successfully" });
    } catch (error) {
      console.error("[v0] Error deleting session:", error);
      toast({ title: "Error", description: "Failed to logout device", variant: "destructive" });
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleLogoutAllOther = async () => {
    if (!confirm("This will logout all other devices. Continue?")) return;

    setLogoutingAllOther(true);
    try {
      const res = await fetch(apiUrl(`api/auth/active-sessions/${userId}/logout-all-other`), {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to logout other sessions");

      await loadSessions();
      toast({ title: "Success", description: "Logged out from all other devices" });
    } catch (error) {
      console.error("[v0] Error logging out other sessions:", error);
      toast({ title: "Error", description: "Failed to logout other devices", variant: "destructive" });
    } finally {
      setLogoutingAllOther(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading sessions...</div>;
  }

  const currentSession = sessions.find((s) => s.isCurrentSession);
  const otherSessions = sessions.filter((s) => !s.isCurrentSession);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold">Active Devices</h3>
        <p className="text-sm text-muted-foreground">Manage devices signed into your account</p>
      </div>

      {/* Current Session */}
      {currentSession && (
        <div className="space-y-4">
          <h4 className="font-medium">Current Device</h4>
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              {currentSession.deviceType === "mobile" ? (
                <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Monitor className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium text-blue-900">{currentSession.deviceName}</p>
                <p className="text-sm text-blue-700">{currentSession.osName}</p>
                {currentSession.city && (
                  <p className="text-xs text-blue-600 mt-1">
                    {currentSession.city}
                    {currentSession.country && `, ${currentSession.country}`}
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  Last active: {new Date(currentSession.lastActivityAt).toLocaleString()}
                </p>
              </div>
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">This device</div>
            </div>
          </div>
        </div>
      )}

      {/* Other Sessions */}
      {otherSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Other Devices</h4>
            {otherSessions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogoutAllOther}
                disabled={logoutingAllOther}
                className="gap-2"
              >
                {logoutingAllOther && <Loader2 className="w-3 h-3 animate-spin" />}
                <LogOut className="w-3 h-3" />
                Logout All Other
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {otherSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {session.deviceType === "mobile" ? (
                    <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  ) : (
                    <Monitor className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{session.deviceName}</p>
                    <p className="text-sm text-muted-foreground">{session.osName}</p>
                    {session.city && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.city}
                        {session.country && `, ${session.country}`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      IP: {session.ipAddress}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {new Date(session.lastActivityAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSession(session.id)}
                    disabled={deletingSessionId === session.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {deletingSessionId === session.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No active sessions found</AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Sessions are automatically logged out after 30 days of inactivity. You can manually logout any device above.
        </AlertDescription>
      </Alert>
    </div>
  );
}
