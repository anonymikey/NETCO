import { useEffect, useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CredentialsDisplay } from "@/components/credentials-display";
import { useCheckPaymentStatus, getCheckPaymentStatusQueryKey } from "@workspace/api-client-react";
import { CheckCircle, XCircle, Clock, Loader2, Download, Shield, Search, RefreshCw } from "lucide-react";
import { apiUrl } from "@/lib/api";

type TrackingState = "idle" | "polling" | "completed" | "failed" | "timeout";

interface OrderData {
  ref: string;
  orderId: string;
  phone: string;
  appType: string;
  deviceId: string;
  amount: string;
}

function getStoredOrder(): OrderData | null {
  try {
    const raw = sessionStorage.getItem("netco_pending_order");
    if (raw) return JSON.parse(raw) as OrderData;
  } catch {}
  return null;
}

export default function OrderStatus() {
  const [, navigate] = useLocation();

  const stored = getStoredOrder();
  const [ref, setRef] = useState(stored?.ref ?? "");
  const [manualRef, setManualRef] = useState("");
  const [trackingRef, setTrackingRef] = useState(stored?.ref ?? "");
  const [orderData, setOrderData] = useState<OrderData | null>(stored);
  const [state, setState] = useState<TrackingState>(stored?.ref ? "polling" : "idle");
  const [elapsed, setElapsed] = useState(0);

  const { data: paymentStatus, refetch } = useCheckPaymentStatus(
    trackingRef,
    {
      query: {
        enabled: !!trackingRef && state === "polling",
        queryKey: getCheckPaymentStatusQueryKey(trackingRef),
        refetchInterval: 4000,
      },
    }
  );

  useEffect(() => {
    if (!paymentStatus || state !== "polling") return;
    if (paymentStatus.status === "completed") {
      setState("completed");
      sessionStorage.removeItem("netco_pending_order");
    } else if (paymentStatus.status === "failed" || paymentStatus.status === "cancelled") {
      setState("failed");
    }
  }, [paymentStatus, state]);

  useEffect(() => {
    if (state !== "polling") return;
    const timeout = setTimeout(() => setState("timeout"), 120000);
    return () => clearTimeout(timeout);
  }, [state]);

  useEffect(() => {
    if (state !== "polling") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const handleManualTrack = () => {
    const r = manualRef.trim();
    if (!r) return;
    setTrackingRef(r);
    setRef(r);
    setState("polling");
    setElapsed(0);
    setOrderData(null);
  };

  const fileExt = orderData?.appType === "http_custom" ? ".hc" : ".ehi";
  const configUrl = (paymentStatus as unknown as { configUrl?: string | null })?.configUrl;

  const progress = Math.min((elapsed / 90) * 100, 95);

  if (state === "idle") {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 glow-primary mb-4">
              <Search className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-heading font-bold">Track Your Order</h1>
            <p className="text-muted-foreground text-sm">Enter your payment reference to check order status</p>
          </div>

          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ref">Payment Reference</Label>
              <Input
                id="ref"
                placeholder="e.g. WS7K3Q9X..."
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                className="bg-card border-border focus:border-primary h-11 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Found in your M-Pesa SMS confirmation</p>
            </div>
            <Button
              onClick={handleManualTrack}
              disabled={!manualRef.trim()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover h-11"
            >
              <Search className="w-4 h-4 mr-2" /> Track Order
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Purchased recently?{" "}
            <Link href="/dashboard" className="text-primary hover:underline font-medium">View your plans →</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-heading font-bold">
            Order <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Status</span>
          </h1>
          <p className="text-muted-foreground text-sm">Real-time payment tracking</p>
        </div>

        <div className="glass-card rounded-xl p-8 flex flex-col items-center text-center space-y-6">
          {state === "polling" && (
            <>
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary animate-ping opacity-75" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-heading font-bold">Waiting for Payment</h2>
                <p className="text-muted-foreground text-sm">
                  {orderData
                    ? <>Check your phone — an M-Pesa prompt was sent to <strong className="text-foreground">{orderData.phone}</strong>. Enter your PIN to complete.</>
                    : "Checking payment status..."}
                </p>
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Checking payment…</span>
                  <span>{elapsed}s</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-mono bg-muted/20 rounded-lg px-4 py-2 w-full">
                Ref: {ref}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setElapsed(0); refetch(); }}
                className="border-border text-muted-foreground"
              >
                <RefreshCw className="w-3 h-3 mr-2" /> Check now
              </Button>
            </>
          )}

          {state === "completed" && (
            <>
              <CheckCircle className="w-20 h-20 text-green-400" />
              <div className="space-y-2">
                <h2 className="text-2xl font-heading font-bold text-green-400">Payment Successful!</h2>
                <p className="text-muted-foreground text-sm">Your VPN config is ready. It has been delivered to your device.</p>
              </div>

              <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4 w-full text-left space-y-3">
                <p className="text-sm text-green-400 font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Order Confirmed
                </p>
                {orderData && (
                  <>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Phone: <span className="text-foreground font-medium">{orderData.phone}</span></p>
                      <p>App: <span className="text-foreground font-medium">{orderData.appType === "http_custom" ? "HTTP Custom" : "HTTP Injector"} ({fileExt})</span></p>
                      <p>Device: <span className="font-mono text-foreground">{orderData.deviceId}</span></p>
                      <p>Amount: <span className="text-foreground font-medium">Ksh {orderData.amount}</span></p>
                    </div>
                  </>
                )}
                <p className="text-xs font-mono text-muted-foreground break-all">Ref: {ref}</p>
              </div>

              {orderData && (
                <div className="w-full">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Credential Format Reference</p>
                  <CredentialsDisplay appType={orderData.appType as "http_custom" | "http_injector"} />
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                {configUrl ? (
                  <a href={apiUrl(configUrl)} download className="w-full">
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white h-11">
                      <Download className="w-4 h-4 mr-2" /> Download Config File
                    </Button>
                  </a>
                ) : (
                  <Button onClick={() => navigate("/dashboard")} className="w-full bg-primary text-primary-foreground h-11">
                    <Download className="w-4 h-4 mr-2" /> View & Download Plans
                  </Button>
                )}
                <Link href="/pricing">
                  <Button variant="outline" className="w-full border-border">Buy Another Plan</Button>
                </Link>
              </div>
            </>
          )}

          {state === "failed" && (
            <>
              <XCircle className="w-20 h-20 text-destructive" />
              <div className="space-y-2">
                <h2 className="text-xl font-heading font-bold text-destructive">Payment Failed</h2>
                <p className="text-muted-foreground text-sm">Your payment was not completed. No charges were made.</p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <Button onClick={() => navigate("/checkout")} className="w-full bg-primary text-primary-foreground h-11">
                  Try Again
                </Button>
                <Link href="/contact">
                  <Button variant="outline" className="w-full border-border">Contact Support</Button>
                </Link>
              </div>
            </>
          )}

          {state === "timeout" && (
            <>
              <Clock className="w-20 h-20 text-yellow-400" />
              <div className="space-y-2">
                <h2 className="text-xl font-heading font-bold text-yellow-400">Still Checking…</h2>
                <p className="text-muted-foreground text-sm">
                  Payment hasn't confirmed yet. If you completed the M-Pesa prompt, check your plans — it may have processed.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <Button onClick={() => navigate("/dashboard")} className="w-full bg-primary text-primary-foreground h-11">
                  Check My Plans
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setState("polling"); setElapsed(0); }}
                  className="w-full border-border"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Keep Checking
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Track a Different Order</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter payment reference"
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              className="bg-card border-border focus:border-primary h-9 font-mono text-xs"
            />
            <Button size="sm" onClick={handleManualTrack} disabled={!manualRef.trim()} className="bg-primary text-primary-foreground">
              Track
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
