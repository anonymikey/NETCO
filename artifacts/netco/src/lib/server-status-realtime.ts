// Real-time server status updates using polling
// This service tracks server availability and status changes

let statusCache: Map<string, { status: string; isFree: boolean; lastUpdated: number }> = new Map();
let subscribers: ((status: Record<string, any>) => void)[] = [];
let pollInterval: NodeJS.Timeout | null = null;

export async function initServerStatusUpdates() {
  if (pollInterval) return; // Already initialized

  // Poll every 10 seconds for server status updates
  pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/servers`);
      if (!response.ok) return;

      const servers = await response.json();
      
      // Check for changes and notify subscribers
      let hasChanges = false;
      const newStatus: Record<string, any> = {};

      for (const server of servers) {
        newStatus[server.id] = {
          status: server.status,
          isFree: server.isFree,
          serverName: server.serverName,
          network: server.network,
          lastUpdated: Date.now(),
        };

        const cached = statusCache.get(server.id);
        if (!cached || cached.status !== server.status || cached.isFree !== server.isFree) {
          hasChanges = true;
        }
      }

      if (hasChanges) {
        statusCache = new Map(Object.entries(newStatus));
        notifySubscribers(newStatus);
      }
    } catch (error) {
      console.error("[v0] Failed to fetch server status:", error);
    }
  }, 10000); // Poll every 10 seconds
}

export function subscribeToServerStatus(callback: (status: Record<string, any>) => void) {
  subscribers.push(callback);
  
  // Return unsubscribe function
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
  };
}

function notifySubscribers(status: Record<string, any>) {
  subscribers.forEach(callback => {
    try {
      callback(status);
    } catch (error) {
      console.error("[v0] Error in status subscriber:", error);
    }
  });
}

export function getServerStatus(serverId: string) {
  return statusCache.get(serverId);
}

export function getAllServerStatus() {
  return Object.fromEntries(statusCache);
}

export function stopServerStatusUpdates() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  subscribers = [];
  statusCache.clear();
}
