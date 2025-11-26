'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

const VIDEO_SOURCES = [
  '/website-video-desktop.mp4',
  '/Video_CEAT_FLOATMAX_VF_X3.mp4',
];

interface HeroVideoSectionProps {
  children: ReactNode;
  containerClassName?: string;
}

export default function HeroVideoSection({ children, containerClassName }: HeroVideoSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const advanceVideo = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % VIDEO_SOURCES.length);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    video.pause();
    video.currentTime = 0;
    video.load();

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      timeoutId = setTimeout(advanceVideo, video.duration * 1000);
    };

    const handleEnded = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      advanceVideo();
    };

    const handleLoadedMetadata = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      scheduleNext();
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    if (video.readyState >= 1) {
      scheduleNext();
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentIndex, advanceVideo]);

  return (
    <div className="relative min-h-[360px] sm:min-h-[420px] lg:min-h-[490px] w-full overflow-hidden bg-black">
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-[120%] w-full -translate-y-[10%] object-cover pointer-events-none"
          src={VIDEO_SOURCES[currentIndex]}
          autoPlay
          muted
          loop={false}
          playsInline
          preload="auto"
        />
      </div>
      <div className="absolute inset-0 bg-black/40" />
      <div className={`relative z-10 h-full w-full ${containerClassName ?? ''}`}>
        {children}
      </div>
    </div>
  );
}

