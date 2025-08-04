"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface CountUpNumberProps {
  value: number;
  prefix?: string;
  decimals?: number;
}

export default function CountUpNumber({
  value,
  prefix = "",
  decimals = 2,
}: CountUpNumberProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    `${prefix}${latest.toFixed(decimals)}`
  );

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1 });
    return controls.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
}
