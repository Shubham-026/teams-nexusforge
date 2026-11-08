import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Strict soft square/rectangle Skeleton component.
 * STRICT RULE: No pill shapes (rounded-full).
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/70 ${className}`}
      {...props}
    />
  );
};

