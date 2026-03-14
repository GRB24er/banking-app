"use client";

import Image from "next/image";
import { useState } from "react";

interface BankLogoProps {
  width?: number;
  height?: number;
  className?: string;
  variant?: "light" | "dark";
}

export default function BankLogo({ width = 160, height = 60, className, variant = "light" }: BankLogoProps) {
  const [src, setSrc] = useState(
    variant === "dark" ? "/images/logo-dark.png" : "/images/Logo.png"
  );

  return (
    <Image
      src={src}
      alt="Horizon Global Capital"
      width={width}
      height={height}
      className={className}
      priority
      style={{ objectFit: "contain" }}
      onError={() => setSrc("/images/Logo.png")}
    />
  );
}
