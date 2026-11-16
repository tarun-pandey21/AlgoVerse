import { useCallback, useEffect, useState } from 'react';

export const SPEEDS = [
  { label: 'Slow', ms: 1400 },
  { label: 'Normal', ms: 800 },
  { label: 'Fast', ms: 350 },
];

/**
 * Plays through a list of frames.
 * Resets to the first frame whenever `frames` changes (new input).
 * Pass autoPlay to start playing as soon as new frames arrive.
 */
export default function useFramePlayer(frames, { autoPlay = false } = {}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(SPEEDS[1].ms);

  const lastIndex = Math.max(frames.length - 1, 0);

  useEffect(() => {
    setIndex(0);
    setPlaying(autoPlay && frames.length > 1);
  }, [frames, autoPlay]);

  // Advance one frame per tick while playing
  useEffect(() => {
    if (!playing) return undefined;
    if (index >= lastIndex) {
      setPlaying(false);
      return undefined;
    }
    const id = setTimeout(() => setIndex((i) => Math.min(i + 1, lastIndex)), speed);
    return () => clearTimeout(id);
  }, [playing, index, lastIndex, speed]);

  const togglePlay = useCallback(() => {
    if (index >= lastIndex) {
      // Replay from the start if we're at the end
      setIndex(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }, [index, lastIndex]);

  return {
    frame: frames[Math.min(index, lastIndex)],
    index,
    total: frames.length,
    playing,
    speed,
    setSpeed,
    togglePlay,
    stepForward: () => {
      setPlaying(false);
      setIndex((i) => Math.min(i + 1, lastIndex));
    },
    stepBack: () => {
      setPlaying(false);
      setIndex((i) => Math.max(i - 1, 0));
    },
    reset: () => {
      setPlaying(false);
      setIndex(0);
    },
    atStart: index === 0,
    atEnd: index >= lastIndex,
  };
}
