import { useState, useEffect } from "react";
import { Users, Smartphone, Server, ShoppingCart, Activity } from "lucide-react";

interface ActivityFeed {
  id: string;
  type: "connection" | "order" | "config" | "login";
  message: string;
  timestamp: Date;
  icon?: React.ReactNode;
}

const MOCK_ACTIVITIES: ActivityFeed[] = [
  { id: "1", type: "connection", message: "User connected to Safaricom server", timestamp: new Date() },
  { id: "2", type: "order", message: "New order received - Ksh 500", timestamp: new Date(Date.now() - 2000) },
  { id: "3", type: "config", message: "Config delivered to user", timestamp: new Date(Date.now() - 5000) },
  { id: "4", type: "login", message: "User login detected", timestamp: new Date(Date.now() - 8000) },
  { id: "5", type: "connection", message: "User connected to Airtel server", timestamp: new Date(Date.now() - 12000) },
];

interface DataPacket {
  id: string;
  x: number;
  y: number;
  progress: number;
  network: "safaricom" | "airtel" | "telkom";
}

export function LiveNetworkActivity() {
  const [activities, setActivities] = useState<ActivityFeed[]>(MOCK_ACTIVITIES);
  const [packets, setPackets] = useState<DataPacket[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(12450);
  const [activeDevices, setActiveDevices] = useState(9820);
  const [connectedServers, setConnectedServers] = useState(14);
  const [ordersToday, setOrdersToday] = useState(248);

  // Animate data packets flowing through network
  useEffect(() => {
    const packetInterval = setInterval(() => {
      setPackets((prev) => {
        const updated = prev
          .map((p) => ({
            ...p,
            progress: p.progress + 2,
          }))
          .filter((p) => p.progress < 100);

        // Add new packets randomly
        if (Math.random() < 0.3) {
          const networks = ["safaricom", "airtel", "telkom"] as const;
          updated.push({
            id: `packet-${Date.now()}`,
            x: Math.random() * 80 + 10,
            y: Math.random() * 60 + 20,
            progress: 0,
            network: networks[Math.floor(Math.random() * networks.length)],
          });
        }

        return updated;
      });
    }, 50);

    return () => clearInterval(packetInterval);
  }, []);

  // Update mock stats periodically
  useEffect(() => {
    const statsInterval = setInterval(() => {
      setOnlineUsers((prev) => prev + Math.floor(Math.random() * 11 - 5));
      setActiveDevices((prev) => prev + Math.floor(Math.random() * 7 - 3));
      setOrdersToday((prev) => prev + Math.floor(Math.random() * 3));
    }, 3000);

    return () => clearInterval(statsInterval);
  }, []);

  // Add new activities periodically
  useEffect(() => {
    const activityInterval = setInterval(() => {
      const newActivityTypes: ActivityFeed["type"][] = ["connection", "order", "config", "login"];
      const newMessages: Record<ActivityFeed["type"], string[]> = {
        connection: [
          "User connected to Safaricom server",
          "User connected to Airtel server",
          "User connected to Telkom server",
        ],
        order: [
          "New order received - Ksh 500",
          "New order received - Ksh 800",
          "New order received - Ksh 300",
        ],
        config: [
          "Config delivered to user",
          "Configuration updated",
          "Server config synced",
        ],
        login: [
          "User login detected",
          "Admin login detected",
          "Session established",
        ],
      };

      const type = newActivityTypes[Math.floor(Math.random() * newActivityTypes.length)];
      const message = newMessages[type][Math.floor(Math.random() * newMessages[type].length)];

      const newActivity: ActivityFeed = {
        id: `activity-${Date.now()}`,
        type,
        message,
        timestamp: new Date(),
      };

      setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
    }, 4000);

    return () => clearInterval(activityInterval);
  }, []);

  const getPacketColor = (network: string) => {
    if (network === "safaricom") return "bg-green-400";
    if (network === "airtel") return "bg-red-400";
    return "bg-blue-400";
  };

  const getActivityIcon = (type: ActivityFeed["type"]) => {
    switch (type) {
      case "connection":
        return <Users className="w-4 h-4" />;
      case "order":
        return <ShoppingCart className="w-4 h-4" />;
      case "config":
        return <Server className="w-4 h-4" />;
      case "login":
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: ActivityFeed["type"]) => {
    switch (type) {
      case "connection":
        return "text-cyan-400";
      case "order":
        return "text-green-400";
      case "config":
        return "text-blue-400";
      case "login":
        return "text-yellow-400";
    }
  };

  return (
    <div className="glass-card rounded-lg border border-card-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <h3 className="font-heading font-bold text-lg">Live Network Activity</h3>
        </div>
        <span className="text-xs text-muted-foreground">Real-time ISP Control Center</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Stats */}
        <div className="space-y-1 p-3 bg-muted/20 border border-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <p className="text-xs text-muted-foreground">Online Users</p>
          </div>
          <p className="text-xl font-bold text-cyan-400">{onlineUsers.toLocaleString()}</p>
        </div>

        <div className="space-y-1 p-3 bg-muted/20 border border-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-green-400" />
            <p className="text-xs text-muted-foreground">Active Devices</p>
          </div>
          <p className="text-xl font-bold text-green-400">{activeDevices.toLocaleString()}</p>
        </div>

        <div className="space-y-1 p-3 bg-muted/20 border border-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-muted-foreground">Connected Servers</p>
          </div>
          <p className="text-xl font-bold text-blue-400">{connectedServers}</p>
        </div>

        <div className="space-y-1 p-3 bg-muted/20 border border-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-muted-foreground">Orders Today</p>
          </div>
          <p className="text-xl font-bold text-yellow-400">{ordersToday}</p>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="relative h-48 bg-muted/10 border border-muted/20 rounded-lg overflow-hidden">
        {/* Flowing connection lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Static network lines */}
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#00F5FF", stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: "#7B61FF", stopOpacity: 0 }} />
            </linearGradient>
            <linearGradient id="lineGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#0057A8", stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: "#00F5FF", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          
          {/* Connection lines */}
          <line x1="20" y1="50" x2="80" y2="30" stroke="url(#lineGradient1)" strokeWidth="0.5" />
          <line x1="20" y1="50" x2="80" y2="70" stroke="url(#lineGradient2)" strokeWidth="0.5" />
          <line x1="20" y1="50" x2="50" y2="20" stroke="url(#lineGradient1)" strokeWidth="0.3" opacity="0.5" />

          {/* Network nodes */}
          <circle cx="20" cy="50" r="2" fill="#00F5FF" />
          <circle cx="80" cy="30" r="2" fill="#7B61FF" />
          <circle cx="80" cy="70" r="2" fill="#0057A8" />
          <circle cx="50" cy="20" r="1.5" fill="#00F5FF" opacity="0.6" />
        </svg>

        {/* Animated data packets */}
        <div className="absolute inset-0">
          {packets.map((packet) => (
            <div
              key={packet.id}
              className={`absolute w-1.5 h-1.5 rounded-full ${getPacketColor(packet.network)} shadow-lg`}
              style={{
                left: `${packet.x + packet.progress * 0.6}%`,
                top: `${packet.y + Math.sin(packet.progress) * 5}%`,
                opacity: 1 - packet.progress / 100,
                boxShadow: `0 0 ${8 - packet.progress / 12.5}px currentColor`,
              }}
            />
          ))}
        </div>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Network Status</p>
            <p className="text-sm font-bold text-cyan-400">ACTIVE</p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Live Activity</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/10 border border-muted/20 hover:border-primary/20 transition-all text-xs">
              <div className={`mt-0.5 flex-shrink-0 ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate">{activity.message}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {activity.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
