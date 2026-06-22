import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";
import { Loader2, Send, Users } from "lucide-react";

type NotificationType = "info" | "success" | "warning" | "error" | "order" | "payment" | "plan";

export function AdminNotificationsPanel() {
  const { toast } = useToast();
  const {
    broadcastNotification,
    sendToUser,
    sendToUsers,
    isBroadcasting,
    isSendingToUser,
    isSendingToUsers,
  } = useAdminNotifications();

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<NotificationType>("info");

  // Send to user state
  const [userTitle, setUserTitle] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [userType, setUserType] = useState<NotificationType>("info");
  const [userId, setUserId] = useState("");

  // Send to multiple users state
  const [usersTitle, setUsersTitle] = useState("");
  const [usersMessage, setUsersMessage] = useState("");
  const [usersType, setUsersType] = useState<NotificationType>("info");
  const [userIds, setUserIds] = useState("");

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      await broadcastNotification(broadcastTitle, broadcastMessage, broadcastType);
      toast({ title: "Success", description: "Notification broadcast to all users" });
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastType("info");
    } catch (error) {
      toast({ title: "Error", description: "Failed to broadcast notification", variant: "destructive" });
    }
  };

  const handleSendToUser = async () => {
    if (!userId.trim() || !userTitle.trim() || !userMessage.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      await sendToUser(userId, userTitle, userMessage, userType);
      toast({ title: "Success", description: "Notification sent to user" });
      setUserId("");
      setUserTitle("");
      setUserMessage("");
      setUserType("info");
    } catch (error) {
      toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
    }
  };

  const handleSendToUsers = async () => {
    if (!userIds.trim() || !usersTitle.trim() || !usersMessage.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const ids = userIds.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      toast({ title: "Error", description: "Please enter valid user IDs", variant: "destructive" });
      return;
    }

    try {
      await sendToUsers(ids, usersTitle, usersMessage, usersType);
      toast({ title: "Success", description: `Notification sent to ${ids.length} users` });
      setUserIds("");
      setUsersTitle("");
      setUsersMessage("");
      setUsersType("info");
    } catch (error) {
      toast({ title: "Error", description: "Failed to send notifications", variant: "destructive" });
    }
  };

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="broadcast" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="single">Send to User</TabsTrigger>
          <TabsTrigger value="multiple">Send to Multiple</TabsTrigger>
        </TabsList>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast to All Users</CardTitle>
              <CardDescription>Send a notification to every user on the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="broadcast-title">Title</Label>
                <Input
                  id="broadcast-title"
                  placeholder="Notification title"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">{broadcastTitle.length}/200</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="broadcast-message">Message</Label>
                <Textarea
                  id="broadcast-message"
                  placeholder="Notification message"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  maxLength={1000}
                  rows={4}
                />
                <p className="text-xs text-gray-500">{broadcastMessage.length}/1000</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="broadcast-type">Type</Label>
                <Select value={broadcastType} onValueChange={(v) => setBroadcastType(v as NotificationType)}>
                  <SelectTrigger id="broadcast-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="plan">Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleBroadcast} disabled={isBroadcasting} className="w-full">
                {isBroadcasting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Broadcast to All Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send to User Tab */}
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Send to Specific User</CardTitle>
              <CardDescription>Send a notification to a single user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-id">User ID</Label>
                <Input
                  id="user-id"
                  placeholder="Enter user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-title">Title</Label>
                <Input
                  id="user-title"
                  placeholder="Notification title"
                  value={userTitle}
                  onChange={(e) => setUserTitle(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">{userTitle.length}/200</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-message">Message</Label>
                <Textarea
                  id="user-message"
                  placeholder="Notification message"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  maxLength={1000}
                  rows={4}
                />
                <p className="text-xs text-gray-500">{userMessage.length}/1000</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-type">Type</Label>
                <Select value={userType} onValueChange={(v) => setUserType(v as NotificationType)}>
                  <SelectTrigger id="user-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="plan">Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSendToUser} disabled={isSendingToUser} className="w-full">
                {isSendingToUser ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to User
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send to Multiple Users Tab */}
        <TabsContent value="multiple">
          <Card>
            <CardHeader>
              <CardTitle>Send to Multiple Users</CardTitle>
              <CardDescription>Send a notification to multiple users (comma-separated IDs)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="users-ids">User IDs (comma-separated)</Label>
                <Textarea
                  id="users-ids"
                  placeholder="user-id-1, user-id-2, user-id-3"
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="users-title">Title</Label>
                <Input
                  id="users-title"
                  placeholder="Notification title"
                  value={usersTitle}
                  onChange={(e) => setUsersTitle(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">{usersTitle.length}/200</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="users-message">Message</Label>
                <Textarea
                  id="users-message"
                  placeholder="Notification message"
                  value={usersMessage}
                  onChange={(e) => setUsersMessage(e.target.value)}
                  maxLength={1000}
                  rows={4}
                />
                <p className="text-xs text-gray-500">{usersMessage.length}/1000</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="users-type">Type</Label>
                <Select value={usersType} onValueChange={(v) => setUsersType(v as NotificationType)}>
                  <SelectTrigger id="users-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="plan">Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSendToUsers} disabled={isSendingToUsers} className="w-full">
                {isSendingToUsers ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Send to Multiple Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
