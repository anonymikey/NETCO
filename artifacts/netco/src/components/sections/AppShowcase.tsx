'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppShowcaseProps {
  isFree?: boolean;
}

interface AppConfig {
  id: string;
  name: string;
  description: string;
  storeUrl: string;
  appType: 'http_custom' | 'http_injector';
  images: string[];
}

const APPS: AppConfig[] = [
  {
    id: 'http-custom',
    name: 'HTTP Custom',
    description: 'Premium VPN tunneling with advanced HTTP injection. Features VPN/LOG tabs, DNS control, and real-time monitoring.',
    storeUrl: 'https://play.google.com/store/apps/details?id=xyz.easypro.httpcustom&pcampaignid=web_share',
    appType: 'http_custom',
    images: [
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-1liZTVzmedOQIWdfWf2fwlCPOyjsRx.png',
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-8iU2qc6OV8ac7tPOWYg7ZZeehxnJU1.png',
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-x7Irq9AvDJN5fdCWDME8MXAq4z5jCM.png',
    ],
  },
  {
    id: 'http-injector',
    name: 'HTTP Injector',
    description: 'Comprehensive tunneling suite with Response Checker, DNS Changer, Tethering Tools, and more. Complete toolkit for power users.',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.evozi.injector&pcampaignid=web_share',
    appType: 'http_injector',
    images: [
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-p99ivscQphv19hnBM1haHPw4IBBuQI.png',
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OuTzXB9no9UclCtGjcpsMdVM3xVhWN.png',
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-M8fKjYoC1LG3T40a4fcCqczPmWNxI8.png',
    ],
  },
];

export function AppShowcase({ isFree = false }: AppShowcaseProps) {
  const [activeAppIndex, setActiveAppIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  const currentApp = APPS[activeAppIndex];
  const currentImage = currentApp.images[activeImageIndex];

  // Auto-rotate images
  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % currentApp.images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [autoRotate, currentApp.images.length]);

  // Auto-rotate apps
  useEffect(() => {
    if (!autoRotate) return;

    const appTimer = setTimeout(() => {
      setActiveAppIndex((prev) => (prev + 1) % APPS.length);
      setActiveImageIndex(0);
    }, 12000);

    return () => clearTimeout(appTimer);
  }, [autoRotate]);

  const handlePrevImage = () => {
    setAutoRotate(false);
    setActiveImageIndex((prev) => (prev - 1 + currentApp.images.length) % currentApp.images.length);
  };

  const handleNextImage = () => {
    setAutoRotate(false);
    setActiveImageIndex((prev) => (prev + 1) % currentApp.images.length);
  };

  const handleAppChange = (index: number) => {
    setAutoRotate(false);
    setActiveAppIndex(index);
    setActiveImageIndex(0);
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-card/30">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-foreground">
            Powerful Apps,{' '}
            <span className="bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
              Real Results
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your preferred tunneling application. Both apps work seamlessly with our premium VPN configurations.
          </p>
        </div>

        {/* App Showcase */}
        <div className="space-y-8">
          {/* Image Carousel */}
          <div className="relative group">
            {/* Main Image Container */}
            <div className="relative h-[500px] md:h-[600px] bg-muted/20 rounded-2xl overflow-hidden border border-primary/20">
              {/* Animated Background Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F5FF10_1px,transparent_1px),linear-gradient(to_bottom,#00F5FF10_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50" />

              {/* Image */}
              <img
                src={currentImage}
                alt={`${currentApp.name} screenshot ${activeImageIndex + 1}`}
                className="w-full h-full object-contain p-4 md:p-8 transition-all duration-500 ease-out"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

              {/* Navigation Buttons - Left */}
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-primary/80 hover:bg-primary text-primary-foreground p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Navigation Buttons - Right */}
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-primary/80 hover:bg-primary text-primary-foreground p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-muted-foreground border border-border">
                {activeImageIndex + 1} / {currentApp.images.length}
              </div>

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {currentApp.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setAutoRotate(false);
                      setActiveImageIndex(index);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeImageIndex
                        ? 'bg-primary w-8'
                        : 'bg-primary/30 w-2 hover:bg-primary/50'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* App Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {APPS.map((app, index) => (
              <button
                key={app.id}
                onClick={() => handleAppChange(index)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left group ${
                  activeAppIndex === index
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
                }`}
              >
                <div className="space-y-3">
                  <h3 className="text-xl font-bold font-heading text-foreground group-hover:text-primary transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {app.description}
                  </p>

                  {/* Features - HTTP Custom */}
                  {app.appType === 'http_custom' && (
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• VPN/LOG tabs for easy control</li>
                      <li>• Advanced DNS configuration</li>
                      <li>• Real-time monitoring</li>
                      <li>• Fast & reliable</li>
                    </ul>
                  )}

                  {/* Features - HTTP Injector */}
                  {app.appType === 'http_injector' && (
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Complete tunneling toolkit</li>
                      <li>• Response Checker & DNS tools</li>
                      <li>• Tethering & diagnostic tools</li>
                      <li>• Advanced customization options</li>
                    </ul>
                  )}

                  {/* Download Button */}
                  <div className="pt-4 flex gap-2">
                    <a
                      href={app.storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        variant={activeAppIndex === index ? 'default' : 'outline'}
                        className="w-full"
                      >
                        Download on Play Store
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </a>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Note for Free Users */}
          {isFree && (
            <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-6 text-center space-y-3">
              <p className="text-sm font-medium text-secondary">
                Download your preferred app first, then import the config file we provide
              </p>
              <p className="text-xs text-muted-foreground">
                Step-by-step setup instructions are available when you download the config
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
