import { motion } from "framer-motion";

interface SubscriptionProgressProps {
  expiryDate: string;
  createdDate: string;
}

export function SubscriptionProgress({ expiryDate, createdDate }: SubscriptionProgressProps) {
  const created = new Date(createdDate);
  const expiry = new Date(expiryDate);
  const now = new Date();

  const totalDuration = expiry.getTime() - created.getTime();
  const remaining = expiry.getTime() - now.getTime();
  const elapsed = now.getTime() - created.getTime();

  const percentageRemaining = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
  const percentageUsed = 100 - percentageRemaining;

  let barColor = "from-green-400 to-green-500";
  let textColor = "text-green-400";

  if (percentageRemaining <= 0) {
    barColor = "from-red-400 to-red-500";
    textColor = "text-red-400";
  } else if (percentageRemaining <= 20) {
    barColor = "from-red-400 to-orange-500";
    textColor = "text-red-400";
  } else if (percentageRemaining <= 50) {
    barColor = "from-yellow-400 to-orange-500";
    textColor = "text-yellow-400";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-2 bg-secondary/30 rounded-full overflow-hidden border border-border/30">
            <motion.div
              className={`h-full bg-gradient-to-r ${barColor} rounded-full shadow-lg shadow-primary/20`}
              initial={{ width: 0 }}
              animate={{ width: `${percentageRemaining}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
        <motion.span
          className={`ml-3 font-bold font-mono text-sm ${textColor}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {Math.ceil(percentageRemaining)}%
        </motion.span>
      </div>
      <p className="text-xs text-muted-foreground">
        {Math.ceil(remaining / (1000 * 60 * 60 * 24))} days remaining of {Math.ceil(totalDuration / (1000 * 60 * 60 * 24))} days
      </p>
    </div>
  );
}
