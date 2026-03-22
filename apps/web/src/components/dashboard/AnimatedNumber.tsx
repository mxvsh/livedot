import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface Props {
  value: number;
  className?: string;
}

export default function AnimatedNumber({ value, className }: Props) {
  const [displayed, setDisplayed] = useState(value);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [slideKey, setSlideKey] = useState(0);
  const [useSlide, setUseSlide] = useState(false);
  const rafRef = useRef<number>();
  const currentRef = useRef(value);

  useEffect(() => {
    const prev = currentRef.current;
    if (prev === value) return;

    const diff = Math.abs(value - prev);
    const dir = value > prev ? 1 : -1;
    setDirection(dir as 1 | -1);

    if (diff <= 10) {
      // Small change: slide animate
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      currentRef.current = value;
      setDisplayed(value);
      setUseSlide(true);
      setSlideKey((k) => k + 1);
    } else {
      // Big change: smooth count up/down
      setUseSlide(false);
      const startValue = prev;
      const startTime = performance.now();
      const duration = Math.min(800, Math.max(200, diff * 4));

      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startValue + (value - startValue) * eased);

        currentRef.current = current;
        setDisplayed(current);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const formatted = displayed.toLocaleString();

  if (useSlide) {
    return (
      <span className={`relative inline-flex overflow-hidden ${className ?? ""}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={slideKey}
            initial={{ y: direction * 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction * -16, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {formatted}
          </motion.span>
        </AnimatePresence>
      </span>
    );
  }

  return <span className={className}>{formatted}</span>;
}
