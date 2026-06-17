import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppShowcaseProps {
  app: "http-custom" | "http-injector";
  title: string;
  description: string;
  playStoreUrl: string;
}

const appImages = {
  "http-custom": [
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-e50hHOKmdleSOgxUGsfeuiqo8LyksE.png",
      alt: "HTTP Custom VPN Screen"
    },
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-v4DrKC6LzDdYBBcAQNDHUIlUt032aP.png",
      alt: "HTTP Custom Logo and UI"
    },
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-AFb6XLo6tRL8En7bEY2UeqD4LsjfMq.png",
      alt: "VPN Tunneling Rocket Icon"
    }
  ],
  "http-injector": [
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-6DhbAxYhOR7EKn1B7lQW68hoD7891i.png",
      alt: "HTTP Injector Home Screen"
    },
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-BnWTEZ9EgLW0fQ3SyXEitxCO4yR1zR.png",
      alt: "HTTP Injector Tools Screen"
    },
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-aj6YSgdIfrcOL0m5kDsGM3rRs7EY27.png",
      alt: "HTTP Injector Settings Screen"
    }
  ]
};

export function AppShowcase({ app, title, description, playStoreUrl }: AppShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const images = appImages[app];

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay, images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setAutoPlay(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">{title}</h2>
          <p className="text-gray-400 text-lg">{description}</p>
        </div>

        {/* Carousel */}
        <div 
          className="relative group bg-gradient-to-b from-gray-900 to-black rounded-xl overflow-hidden shadow-2xl"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          {/* Images */}
          <div className="relative w-full aspect-video overflow-hidden">
            {images.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-700 ease-out transform ${
                  index === currentIndex
                    ? "opacity-100 scale-100"
                    : index < currentIndex
                    ? "opacity-0 -translate-x-full scale-95"
                    : "opacity-0 translate-x-full scale-95"
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-contain p-4 sm:p-8"
                  loading="lazy"
                />
              </div>
            ))}
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? "bg-cyan-400 w-3 h-3"
                    : "bg-white/30 hover:bg-white/50 w-2 h-2"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Image Counter & CTA */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-gray-400">
            {currentIndex + 1} of {images.length}
          </p>
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              Download on Google Play
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
