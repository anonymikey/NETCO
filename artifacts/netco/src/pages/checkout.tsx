import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CredentialsDisplay } from "@/components/credentials-display";
import { validateCredential } from "@/lib/credential-validation";
import {
  useCreateOrder,
  useInitiatePayment,
  useCheckPaymentStatus,
  getCheckPaymentStatusQueryKey,
  OrderInputDuration,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Check, Smartphone, CreditCard, Loader2, CheckCircle, XCircle, Clock, ChevronRight, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

type PaymentState = "idle" | "initiating" | "prompt_sent" | "polling" | "completed" | "failed" | "timeout" | "error";

const STEPS = ["Plan Summary", "App & Device", "M-Pesa", "Payment"];

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  // Redirect non-authenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      toast({ title: "Please log in", description: "You need an account to checkout", variant: "destructive" });
      navigate("/login");
    }
  }, [user, loading, navigate, toast]);
  const queryClient = useQueryClient();

  // Read plan state passed from pricing page
  const state = (window.history.state as Record<string, unknown>) ?? {};
  const plan = state.plan as Record<string, unknown> | undefined;
  const network = state.network as string | undefined;
  const duration = state.duration as string | undefined;
  const amount = state.amount as number | undefined;

  const [step, setStep] = useState(plan ? 0 : 0);
  const [appType, setAppType] = useState<"http_custom" | "http_injector">("http_custom");
  const [deviceId, setDeviceId] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createOrder = useCreateOrder();
  const initiatePayment = useInitiatePayment();
  const pollKey = checkoutRequestId || paymentRef;
  const { data: paymentStatus } = useCheckPaymentStatus(
    pollKey,
    { query: { enabled: !!pollKey && paymentState === "polling", queryKey: getCheckPaymentStatusQueryKey(pollKey), refetchInterval: 5000 } }
  );

  useEffect(() => {
    if (!paymentStatus || paymentState !== "polling") return;
    if (paymentStatus.status === "completed") {
      setPaymentState("completed");
      clearPolling();
    } else if (paymentStatus.status === "failed" || paymentStatus.status === "cancelled") {
      setPaymentState("failed");
      clearPolling();
    }
  }, [paymentStatus, paymentState]);

  const clearPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (paymentState === "polling") {
      const timeout = setTimeout(() => {
        if (paymentState === "polling") {
          setPaymentState("timeout");
          clearPolling();
        }
      }, 90000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [paymentState, clearPolling]);

  const handleProceedToApp = () => {
    if (!plan) {
      toast({ title: "No plan selected", description: "Please select a plan from the pricing page.", variant: "destructive" });
      navigate("/pricing");
      return;
    }
    setStep(1);
  };

  const handleProceedToPhone = () => {
    if (!deviceId.trim()) {
      toast({ title: "Credential required", description: "Enter your Device ID or HWID to continue.", variant: "destructive" });
      return;
    }

    // Validate credential format
    const validation = validateCredential(deviceId.trim(), appType);
    if (!validation.isValid) {
      toast({
        title: "Invalid credential format",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleInitiatePayment = async () => {
    if (!phone.trim() || phone.length < 10) {
      toast({ title: "Invalid phone", description: "Enter a valid M-Pesa phone number (e.g. 0712345678).", variant: "destructive" });
      return;
    }

    setPaymentState("initiating");
    setStep(3);

    try {
      const orderRes = await createOrder.mutateAsync({
        data: {
          packageId: (plan?.id as string) ?? "unknown",
          network: network ?? "safaricom",
          duration: (duration ?? "daily") as OrderInputDuration,
          appType,
          deviceId: deviceId.trim(),
          phone: phone.trim(),
          amount: amount ?? 0,
        },
      });
      setOrderId(orderRes.id);

      setPaymentState("prompt_sent");

      const payRes = await initiatePayment.mutateAsync({
        data: {
          phone: phone.trim(),
          amount: amount ?? 0,
          orderId: orderRes.id,
        },
      });

      const ref = payRes.reference;
      setPaymentRef(ref);
      if (payRes.checkoutRequestId) setCheckoutRequestId(payRes.checkoutRequestId);
      setPaymentState("polling");

      sessionStorage.setItem("netco_pending_order", JSON.stringify({
        ref,
        orderId: orderRes.id,
        phone: phone.trim(),
        appType,
        deviceId: deviceId.trim(),
        amount: String(amount ?? 0),
      }));
      navigate(`/order-status`);
    } catch {
      setPaymentState("error");
      toast({ title: "Payment failed", description: "Could not initiate payment. Please try again.", variant: "destructive" });
    }
  };

  const fileExt = appType === "http_custom" ? ".hc" : ".ehi";

  const StatusIcon = () => {
    if (paymentState === "completed") return <CheckCircle className="w-16 h-16 text-success" />;
    if (paymentState === "failed" || paymentState === "error") return <XCircle className="w-16 h-16 text-destructive" />;
    if (paymentState === "timeout") return <Clock className="w-16 h-16 text-warning" />;
    return <Loader2 className="w-16 h-16 text-primary animate-spin" />;
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-center mb-2">
          Secure <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Checkout</span>
        </h1>
        <p className="text-center text-muted-foreground mb-8">Complete your order to get your VPN config</p>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary/20 text-primary border border-primary" :
                "bg-card text-muted-foreground border border-border"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`ml-1.5 text-xs font-medium hidden sm:block ${i === step ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-border mx-1 sm:mx-2 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step 0: Plan Summary */}
        {step === 0 && (
          <div className="glass-card rounded-xl p-6 space-y-6" data-testid="step-plan-summary">
            {plan ? (
              <>
                <h2 className="text-xl font-heading font-bold">Your Selected Plan</h2>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{plan.name as string}</p>
                      <p className="text-sm text-muted-foreground">{network} Network</p>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30 capitalize">{duration}</Badge>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-3">
                    <span className="text-muted-foreground text-sm">Total Amount</span>
                    <span className="text-2xl font-heading font-bold text-primary">Ksh {(amount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/10 rounded-lg p-3 border border-border">
                  Payment is processed securely via M-Pesa STK Push. Your config will be delivered instantly after payment confirmation.
                </div>
                <Button onClick={handleProceedToApp} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover h-12" data-testid="button-proceed-app">
                  Continue <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">No plan selected. Please choose a plan first.</p>
                <Button onClick={() => navigate("/pricing")} className="bg-primary text-primary-foreground">Browse Plans</Button>
              </div>
            )}
          </div>
        )}

        {/* Step 1: App type + Device ID */}
        {step === 1 && (
          <div className="glass-card rounded-xl p-6 space-y-6" data-testid="step-app-device">
            <h2 className="text-xl font-heading font-bold">Select App & Enter Device ID</h2>

            <div className="grid grid-cols-2 gap-4">
              {(["http_custom", "http_injector"] as const).map((app) => (
                <button
                  key={app}
                  onClick={() => setAppType(app)}
                  data-testid={`button-app-${app}`}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    appType === app
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Smartphone className="w-6 h-6 mb-2" />
                  <div className="font-bold text-sm">{app === "http_custom" ? "HTTP Custom" : "HTTP Injector"}</div>
                  <div className="text-xs mt-1 opacity-70">{app === "http_custom" ? ".hc file" : ".ehi file"}</div>
                </button>
              ))}
            </div>

            <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 text-sm text-muted-foreground">
              <strong className="text-secondary">{appType === "http_custom" ? "HTTP Custom" : "HTTP Injector"}</strong> —{" "}
              {appType === "http_custom"
                ? "Open the app → Menu → Find your HWID (32 lowercase hex characters)"
                : "Open app → Config → Export → find your Device ID at the top (33 uppercase alphanumeric)"}
            </div>

            <CredentialsDisplay appType={appType} />

            <div className="space-y-2">
              <Label htmlFor="deviceId">Your {appType === "http_custom" ? "HWID" : "Device ID"}</Label>
              <Input
                id="deviceId"
                placeholder={`Paste your ${appType === "http_custom" ? "HWID" : "Device ID"} here`}
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="bg-card border-border focus:border-primary h-12 font-mono text-sm"
                data-testid="input-device-id"
              />
              {deviceId && (() => {
                const validation = validateCredential(deviceId.trim(), appType);
                return (
                  <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    validation.isValid
                      ? "bg-green-500/10 border border-green-500/20 text-green-700"
                      : "bg-destructive/10 border border-destructive/20 text-destructive"
                  }`}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{validation.isValid ? "Format is valid" : validation.error}</span>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1 border-border">Back</Button>
              <Button onClick={handleProceedToPhone} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover" data-testid="button-proceed-phone">
                Continue <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Phone number */}
        {step === 2 && (
          <div className="glass-card rounded-xl p-6 space-y-6" data-testid="step-phone">
            <h2 className="text-xl font-heading font-bold">Enter M-Pesa Number</h2>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Amount to pay</p>
                <p className="text-2xl font-heading font-bold text-primary">Ksh {(amount ?? 0).toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-primary opacity-50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-card border-border focus:border-primary h-12 text-lg"
                data-testid="input-phone"
              />
              <p className="text-xs text-muted-foreground">Enter the number registered on M-Pesa. You will receive an STK Push prompt.</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-border">Back</Button>
              <Button
                onClick={handleInitiatePayment}
                disabled={createOrder.isPending || initiatePayment.isPending}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover h-12"
                data-testid="button-pay"
              >
                {createOrder.isPending || initiatePayment.isPending ? (
                  <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>Pay Ksh {(amount ?? 0).toLocaleString()} via M-Pesa</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment status */}
        {step === 3 && (
          <div className="glass-card rounded-xl p-8 flex flex-col items-center text-center space-y-6" data-testid="step-payment">
            <StatusIcon />

            {paymentState === "initiating" && (
              <>
                <h2 className="text-xl font-heading font-bold">Creating Your Order</h2>
                <p className="text-muted-foreground">Setting up your order and initiating payment...</p>
              </>
            )}
            {paymentState === "prompt_sent" && (
              <>
                <h2 className="text-xl font-heading font-bold">STK Push Sent</h2>
                <p className="text-muted-foreground">Check your phone. An M-Pesa prompt has been sent to <strong className="text-foreground">{phone}</strong>. Enter your PIN to complete payment.</p>
              </>
            )}
            {paymentState === "polling" && (
              <>
                <h2 className="text-xl font-heading font-bold">Waiting for Payment</h2>
                <p className="text-muted-foreground">Enter your M-Pesa PIN on your phone. We're confirming your payment...</p>
                <div className="w-full bg-border rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full animate-pulse w-2/3" />
                </div>
              </>
            )}
            {paymentState === "completed" && (
              <>
                <h2 className="text-2xl font-heading font-bold text-success">Payment Successful!</h2>
                <p className="text-muted-foreground">Your <strong className="text-foreground">{fileExt}</strong> config file has been processed and will be delivered to your device.</p>
                <div className="bg-success/10 border border-success/30 rounded-lg p-4 w-full text-left space-y-2">
                  <p className="text-sm text-success font-medium">Order Confirmation</p>
                  <p className="text-xs text-muted-foreground">Reference: <span className="font-mono text-foreground">{paymentRef}</span></p>
                  <p className="text-xs text-muted-foreground">App: {appType === "http_custom" ? "HTTP Custom" : "HTTP Injector"}</p>
                  <p className="text-xs text-muted-foreground">Device: <span className="font-mono">{deviceId}</span></p>
                </div>
                <Button onClick={() => navigate("/dashboard")} className="bg-primary text-primary-foreground w-full">
                  View My Plans
                </Button>
              </>
            )}
            {(paymentState === "failed" || paymentState === "error") && (
              <>
                <h2 className="text-xl font-heading font-bold text-destructive">Payment Failed</h2>
                <p className="text-muted-foreground">Your payment could not be processed. No charges were made.</p>
                <div className="flex gap-3 w-full">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-border">Try Again</Button>
                  <Button onClick={() => navigate("/contact")} variant="outline" className="flex-1 border-border">Contact Support</Button>
                </div>
              </>
            )}
            {paymentState === "timeout" && (
              <>
                <h2 className="text-xl font-heading font-bold text-warning">Payment Timed Out</h2>
                <p className="text-muted-foreground">You did not complete the M-Pesa prompt in time. No payment was taken.</p>
                <Button onClick={() => { setStep(2); setPaymentState("idle"); }} className="w-full bg-primary text-primary-foreground">
                  Try Again
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
