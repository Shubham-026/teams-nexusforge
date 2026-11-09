"use client";

import React, { useState, useEffect, useRef } from "react";

export const VideoLoader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFinish = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 700);
  };

  useEffect(() => {
    // Lock body scroll while loader is visible
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay was prevented or video couldn't play:", err);
        });
      }
    }

    // Safety timeout in case video fails or gets stuck
    const safetyTimeout = setTimeout(() => {
      handleFinish();
    }, 10000);

    return () => clearTimeout(safetyTimeout);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex h-screen w-screen items-center justify-center bg-black transition-opacity duration-700 ease-out ${
        isFading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ width: "100vw", height: "100vh" }}
    >
      <video
        ref={videoRef}
        src="/loading.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleFinish}
        onError={handleFinish}
        className="h-full w-full object-cover"
      />

      {/* Skip button in soft square aesthetic */}
      <button
        type="button"
        onClick={handleFinish}
        className="absolute top-6 right-6 z-10 rounded-md border border-white/20 bg-black/40 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/40 hover:bg-black/70 hover:text-white active:scale-95"
      >
        Skip
      </button>
    </div>
  );
};

