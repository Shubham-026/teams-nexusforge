import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export const KanbanSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((colIndex) => (
        <div
          key={colIndex}
          className="flex flex-col rounded-lg border border-slate-200/80 bg-slate-50/50 p-4"
        >
          {/* Column Header Skeleton */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
              <Skeleton className="h-4 w-20 bg-slate-300" />
            </div>
            <Skeleton className="h-5 w-6 rounded-md bg-slate-200" />
          </div>

          {/* Cards Skeleton */}
          <div className="flex flex-col gap-3">
            {[1, 2].map((cardIndex) => (
              <div
                key={cardIndex}
                className="flex flex-col justify-between rounded-lg border border-slate-200/80 bg-white p-4 shadow-soft-sm"
              >
                <div>
                  {/* Priority tag skeleton */}
                  <Skeleton className="h-4 w-12 rounded-md bg-slate-200" />
                  {/* Title lines */}
                  <Skeleton className="mt-3 h-4 w-4/5 rounded-md bg-slate-200" />
                  <Skeleton className="mt-1.5 h-3 w-3/5 rounded-md bg-slate-100" />
                  {/* Description line */}
                  <Skeleton className="mt-2.5 h-3 w-full rounded-md bg-slate-100" />
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-md bg-slate-200" />
                    <Skeleton className="h-4 w-16 rounded-md bg-slate-100" />
                  </div>
                  <Skeleton className="h-7 w-12 rounded-md bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

