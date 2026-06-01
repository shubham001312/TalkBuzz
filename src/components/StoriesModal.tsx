/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, ArrowRight, Play, Pause } from 'lucide-react';
import { UserStatusStory } from '../types';

interface StoriesModalProps {
  stories: UserStatusStory[];
  initialUserId: string;
  onClose: () => void;
}

export default function StoriesModal({ stories, initialUserId, onClose }: StoriesModalProps) {
  const userStories = stories.filter(s => s.userId === initialUserId);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentStory = userStories[currentIndex] || userStories[0];

  const [paused, setPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!currentStory) {
      onClose();
      return;
    }

    if (paused) return;

    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 100)); // Increments of 2% (approx 5 sec total each slide)
    }, 100);

    return () => clearInterval(interval);
  }, [currentStory, paused, onClose]);

  // Handle auto-advancing or closing when progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      if (currentIndex < userStories.length - 1) {
        setProgress(0);
        setCurrentIndex((prevIdx) => prevIdx + 1);
      } else {
        onClose();
      }
    }
  }, [progress, currentIndex, userStories.length, onClose]);

  // Reset progress state when moving to a new story index
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/20 selection:text-emerald-400 backdrop-blur-md">
      <div className="w-full max-w-sm h-[85vh] bg-[#0D1117] border border-slate-800 rounded-3xl overflow-hidden relative flex flex-col justify-between shadow-2xl">
        
        {/* Story top timeline progresses */}
        <div className="absolute top-2.5 left-3 right-3 flex gap-1.5 z-30">
          {userStories.map((s, idx) => (
            <div key={s.id} className="h-1 bg-slate-800 flex-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 shadow-[0_0_6px_#10b981] transition-all duration-100 ease-linear"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Top bar indicators */}
        <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-30 select-none">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStory.avatarUrl || undefined}
              alt=""
              className="w-8 h-8 rounded-full border border-slate-800 object-cover"
            />
            <div>
              <h4 className="text-xs font-bold text-slate-100">{currentStory.displayName}</h4>
              <span className="text-[9px] font-mono text-slate-500">disappearing status update</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <button onClick={() => setPaused(!paused)} className="p-1.5 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer">
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Display Image stream frame */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            if (percentage < 0.35) {
              if (currentIndex > 0) {
                setCurrentIndex((prev) => prev - 1);
              }
            } else {
              if (currentIndex < userStories.length - 1) {
                setCurrentIndex((prev) => prev + 1);
              } else {
                onClose();
              }
            }
          }}
          className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#07080B] cursor-pointer"
        >
          <img
            src={currentStory.mediaUrl || undefined}
            alt=""
            className="w-full h-full object-cover select-none pointer-events-none"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-transparent" title="Tap Left to Go Back" />
          <div className="absolute inset-y-0 right-0 w-2/3 bg-transparent" title="Tap Right to Skip" />
        </div>

        {/* Caption bottom bar sheet */}
        <div className="p-6 bg-gradient-to-t from-[#0A0C10] via-[#0D1117] to-[#0D1117]/95 border-t border-slate-800 flex flex-col items-center text-center gap-3">
          <p className="text-xs text-slate-200 leading-normal font-semibold whitespace-pre-wrap select-text px-2">
            "{currentStory.caption}"
          </p>

          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">
            {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

      </div>
    </div>
  );
}
