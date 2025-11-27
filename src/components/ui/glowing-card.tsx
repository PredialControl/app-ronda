import React from "react";
import { cn } from "@/lib/utils";

interface GlowingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string;
}

export const GlowingCard = React.forwardRef<HTMLDivElement, GlowingCardProps>(
  ({ className, children, glowColor = "from-green-500 via-emerald-500 to-green-500", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative rounded-xl border border-green-500/20 bg-[rgba(26,47,42,0.6)] backdrop-blur-lg shadow-lg transition-all duration-300 hover:bg-[rgba(26,47,42,0.8)] hover:border-green-500/40 hover:shadow-green-500/20 hover:shadow-2xl hover:-translate-y-1",
          className
        )}
        {...props}
      >
        {/* Content Container */}
        <div className="h-full w-full rounded-xl bg-transparent">
          {children}
        </div>
      </div>
    );
  }
);
GlowingCard.displayName = "GlowingCard";
