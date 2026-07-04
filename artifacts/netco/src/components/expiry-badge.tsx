import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Clock, Shield, CheckCircle2 } from "lucide-react";

interface ExpiryBadgeProps {
  expiryDate: string;
  showIcon?: boolean;
}

export function ExpiryBadge({ expiryDate, showIcon = true }: ExpiryBadgeProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
    isExpired: boolean;
    status: "protected" | "expires_soon" | "renew_today" | "expiring_now" | "expired";
  } | null>(null);

  // Update countdown every second
  useEffect(() => {
    const updateTimer = () => {
      const expiry = new Date(expiryDate).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalMs: 0,
          isExpired: true,
          status: "expired",
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      let status: "protected" | "expires_soon" | "renew_today" | "expiring_now" | "expired";
      if (days > 7) {
        status = "protected";
      } else if (days >= 7) {
        status = "expires_soon";
      } else if (hours >= 1) {
        status = "renew_today";
      } else {
        status = "expiring_now";
      }

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        totalMs: diff,
        isExpired: false,
        status,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  if (!timeRemaining) return null;

  const badgeConfig = {
    protected: {
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      label: "Protected",
      icon: Shield,
      pulse: false,
    },
    expires_soon: {
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/30",
      text: "text-yellow-400",
      label: "Expires Soon",
      icon: Clock,
      pulse: false,
    },
    renew_today: {
      bg: "bg-orange-500/20",
      border: "border-orange-500/30",
      text: "text-orange-400",
      label: "Renew Today",
      icon: AlertCircle,
      pulse: false,
    },
    expiring_now: {
      bg: "bg-red-500/20",
      border: "border-red-500/30",
      text: "text-red-400",
      label: "Expiring Now",
      icon: AlertCircle,
      pulse: true,
    },
    expired: {
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
      text: "text-gray-400",
      label: "Expired",
      icon: AlertCircle,
      pulse: false,
    },
  };

  const config = badgeConfig[timeRemaining.status];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bg} ${config.border} ${config.text} text-xs font-medium whitespace-nowrap`}
    >
      {config.pulse && (
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <IconComponent className="w-4 h-4" />
        </motion.div>
      )}
      {!config.pulse && showIcon && <IconComponent className="w-4 h-4" />}
      
      <span>
        {config.label}
        {timeRemaining.status !== "protected" && timeRemaining.status !== "expired" && (
          <span className="ml-1 opacity-70">
            ({timeRemaining.days}d {timeRemaining.hours}h)
          </span>
        )}
      </span>
    </motion.div>
  );
}
