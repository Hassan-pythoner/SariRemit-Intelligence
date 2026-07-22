import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedFinancialValueProps {
  value: number;
  suffix?: string;
  prefix?: string;
  precision?: number;
  durationMs?: number;
  className?: string;
}

export function AnimatedFinancialValue({
  value,
  suffix = '',
  prefix = '',
  precision = 2,
  durationMs = 350,
  className = '',
}: AnimatedFinancialValueProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(value);
  const previousValueRef = useRef<number>(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || durationMs <= 0) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    const startValue = previousValueRef.current;
    const targetValue = value;
    if (startValue === targetValue) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = startValue + (targetValue - startValue) * easeProgress;

      setDisplayValue(currentVal);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        previousValueRef.current = targetValue;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, durationMs, prefersReducedMotion]);

  const formattedNum = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return (
    <span className={`font-mono transition-colors ${className}`}>
      {prefix}
      {formattedNum}
      {suffix && <span className="text-[0.65em] font-sans font-bold ml-1 text-sds-text-sec uppercase">{suffix}</span>}
    </span>
  );
}
