import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

interface PlanCountdownTimerProps {
  expiryDate: string;
  onExpire?: () => void;
}

export function PlanCountdownTimer({ expiryDate, onExpire }: PlanCountdownTimerProps) {
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        onExpire?.();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiryDate, onExpire]);

  const TimeUnit = ({ label, value }: { label: string; value: number }) => (
    <motion.div
      className="flex flex-col items-center"
      initial={{ scale: 1 }}
      animate={{ scale: 1 }}
      key={`${label}-${value}`}
    >
      <motion.div
        className="bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/30 rounded-lg px-3 py-2 mb-1 min-w-[60px] flex items-center justify-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <span className="text-xl font-bold text-primary font-mono">
          {String(value).padStart(2, "0")}
        </span>
      </motion.div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    </motion.div>
  );

  if (countdown.isExpired) {
    return (
      <div className="text-center">
        <motion.p
          className="text-lg font-bold text-red-400"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          EXPIRED
        </motion.p>
      </div>
    );
  }

  return (
    <div className="flex gap-2 justify-center">
      <TimeUnit label="Days" value={countdown.days} />
      <div className="flex items-end pb-2">
        <span className="text-muted-foreground">:</span>
      </div>
      <TimeUnit label="Hours" value={countdown.hours} />
      <div className="flex items-end pb-2">
        <span className="text-muted-foreground">:</span>
      </div>
      <TimeUnit label="Minutes" value={countdown.minutes} />
      <div className="flex items-end pb-2">
        <span className="text-muted-foreground">:</span>
      </div>
      <TimeUnit label="Seconds" value={countdown.seconds} />
    </div>
  );
}
