"use client";

import { Logo } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Logo do estúdio (imagem enviada em Estúdio) ou o nome em texto. */
export function StudioLogo({ className, imageClassName }: { className?: string; imageClassName?: string }) {
  const { studio } = useStore();
  if (studio.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={studio.logo} alt={studio.name} className={cn("h-8 w-auto object-contain", imageClassName)} />;
  }
  return <Logo className={className}>{studio.name}</Logo>;
}
