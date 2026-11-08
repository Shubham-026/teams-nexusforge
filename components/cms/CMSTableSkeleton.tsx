import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export const CMSTableSkeleton: React.FC = () => {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-soft-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 pl-6 pr-4">Content Item & Slug</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Author</th>
              <th className="px-4 py-3.5">Metrics</th>
              <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {[1, 2, 3, 4, 5].map((idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="py-4 pl-6 pr-4">
                  <Skeleton className="h-4 w-48 rounded-md bg-slate-200" />
                  <Skeleton className="mt-1.5 h-3 w-28 rounded-md bg-slate-100" />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Skeleton className="h-6 w-20 rounded-md bg-slate-100" />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Skeleton className="h-6 w-20 rounded-md bg-slate-100" />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-24 rounded-md bg-slate-200" />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-16 rounded-md bg-slate-100" />
                </td>
                <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <Skeleton className="h-8 w-8 rounded-md bg-slate-100" />
                    <Skeleton className="h-8 w-8 rounded-md bg-slate-100" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

