import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CredentialsDisplayProps {
  appType: "http_custom" | "http_injector";
  compact?: boolean;
}

export function CredentialsDisplay({ appType, compact = false }: CredentialsDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const deviceId = "C4E61860CA87C6CB24C9C56BE3312E6J";
  const hwid = "0979c85da5eef2f998334156cb53edf6";

  const credentials = appType === "http_custom"
    ? { label: "Device ID Format", value: deviceId, type: "HTTP Custom" }
    : { label: "HWID Format", value: hwid, type: "HTTP Injector" };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
        <code className="text-xs font-mono text-primary flex-1 truncate">{credentials.value}</code>
        <button
          onClick={() => handleCopy(credentials.value, credentials.label)}
          className="p-1 hover:bg-primary/10 rounded transition-colors"
          title="Copy"
        >
          {copiedField === credentials.label ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3 text-primary/60" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-4 space-y-3 border-primary/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{credentials.label}</p>
          <p className="text-sm text-primary font-medium mt-1">{credentials.type}</p>
        </div>
      </div>

      <div className="bg-card/50 rounded-md p-3 border border-border/50 flex items-center gap-2 group">
        <code className="text-xs font-mono text-foreground/80 flex-1 break-all">{credentials.value}</code>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleCopy(credentials.value, credentials.label)}
          className="h-8 px-2 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copiedField === credentials.label ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Use this {credentials.label.toLowerCase()} when configuring your {credentials.type} app.
      </p>
    </div>
  );
}
