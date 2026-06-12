import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

interface FreeConfigDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: {
    id: string;
    serverName: string;
    network: string;
    appType: string;
    duration: string;
    originalName: string;
  };
}

type State = "form" | "downloading" | "success" | "error";

export function FreeConfigDownloadModal({ isOpen, onClose, server }: FreeConfigDownloadModalProps) {
  const { toast } = useToast();
  const [deviceId, setDeviceId] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<State>("form");
  const [error, setError] = useState("");

  const handleDownload = async () => {
    if (!deviceId.trim()) {
      setError("Device ID is required");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }

    setState("downloading");
    setError("");

    try {
      const response = await fetch(apiUrl("/orders/free"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: server.id,
          network: server.network,
          duration: server.duration,
          appType: server.appType,
          deviceId: deviceId.trim(),
          phone: phone.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create free order");
        setState("error");
        return;
      }

      const order = await response.json();

      // Trigger download
      if (order.configUrl) {
        const downloadUrl = apiUrl(order.configUrl);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = server.originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setState("success");
        toast({
          title: "Config downloaded!",
          description: `Your ${server.originalName} has been downloaded. Import it into your app.`,
        });

        setTimeout(() => {
          onClose();
          setState("form");
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      setState("error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-xl max-w-md w-full p-6 space-y-6 border border-border">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Get Free Config</h2>
            <p className="text-sm text-muted-foreground">{server.serverName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        {state === "form" && (
          <div className="space-y-4">
            {/* Device ID */}
            <div className="space-y-2">
              <Label htmlFor="device-id">Device ID / HWID</Label>
              <Input
                id="device-id"
                placeholder="Paste your Device ID or HWID"
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  setError("");
                }}
                className="bg-card border-border focus:border-primary font-mono text-sm"
                disabled={state !== "form"}
              />
              <p className="text-xs text-muted-foreground">
                Find your Device ID in the app settings or device info
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 0712345678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                className="bg-card border-border focus:border-primary"
                disabled={state !== "form"}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={state !== "form"}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDownload}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={state !== "form" || !deviceId.trim() || !phone.trim()}
              >
                {state === "downloading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  "Download Free Config"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Success */}
        {state === "success" && (
          <div className="py-8 space-y-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-success/10">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-foreground">Download Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Your config has been downloaded. Import it into your app to get started.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="py-8 space-y-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-red-500/10">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-foreground">Download Failed</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              onClick={() => {
                setState("form");
                setError("");
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
