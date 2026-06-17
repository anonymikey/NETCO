import { AppShowcase } from "./app-showcase";

export function AppGallerySection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black via-gray-950 to-black">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-semibold">
            Supported Applications
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            See How It Works
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our configurations are designed to work seamlessly with the most popular VPN tunneling applications
          </p>
        </div>

        {/* Grid of App Showcases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
          {/* HTTP Custom */}
          <div className="flex flex-col justify-center">
            <AppShowcase
              app="http-custom"
              title="HTTP Custom"
              description="Professional VPN configuration tool with advanced DNS and payload customization"
              playStoreUrl="https://play.google.com/store/apps/details?id=xyz.easypro.httpcustom&pcampaignid=web_share"
            />
          </div>

          {/* HTTP Injector */}
          <div className="flex flex-col justify-center">
            <AppShowcase
              app="http-injector"
              title="HTTP Injector"
              description="Powerful tunneling application with response checking and advanced diagnostic tools"
              playStoreUrl="https://play.google.com/store/apps/details?id=com.evozi.injector&pcampaignid=web_share"
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
          {[
            { icon: "🔒", label: "Secure Tunneling", desc: "Military-grade encryption" },
            { icon: "⚡", label: "Fast Speeds", desc: "Optimized servers" },
            { icon: "🌍", label: "Global Coverage", desc: "Multiple regions" },
            { icon: "📱", label: "Easy Setup", desc: "Simple configuration" }
          ].map((feature, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="text-3xl mb-2">{feature.icon}</div>
              <h3 className="font-semibold text-white mb-1">{feature.label}</h3>
              <p className="text-sm text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
