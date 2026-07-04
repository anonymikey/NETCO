interface NetworkLogoProps {
  network: string;
  className?: string;
}

export function NetworkLogo({ network, className = "w-12 h-12" }: NetworkLogoProps) {
  const networkName = network.toLowerCase();

  const Safaricom = () => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="50" r="48" className="fill-green-400" />
      <text x="50" y="60" textAnchor="middle" className="text-white font-bold text-2xl" fontSize="40" fill="white">
        S
      </text>
    </svg>
  );

  const Airtel = () => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="50" r="48" className="fill-red-400" />
      <text x="50" y="60" textAnchor="middle" className="text-white font-bold text-2xl" fontSize="40" fill="white">
        A
      </text>
    </svg>
  );

  const Telkom = () => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="50" r="48" className="fill-blue-400" />
      <text x="50" y="60" textAnchor="middle" className="text-white font-bold text-2xl" fontSize="40" fill="white">
        T
      </text>
    </svg>
  );

  switch (networkName) {
    case "safaricom":
      return <Safaricom />;
    case "airtel":
      return <Airtel />;
    case "telkom":
      return <Telkom />;
    default:
      return (
        <div className={`${className} bg-primary/20 rounded-full flex items-center justify-center border border-primary/30`}>
          <span className="text-primary font-bold">{network.charAt(0)}</span>
        </div>
      );
  }
}
