import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  accent?: "lavender" | "mint" | "peach" | "sky";
}

const accentStyles = {
  lavender: {
    bg: "bg-pastel-lavender-50",
    border: "border-pastel-lavender-200",
    iconBg: "bg-pastel-lavender-100",
    iconColor: "text-pastel-lavender-500",
    buttonBg: "bg-pastel-lavender-500 hover:bg-pastel-lavender-400 border-pastel-lavender-300",
  },
  mint: {
    bg: "bg-pastel-mint-50",
    border: "border-pastel-mint-200",
    iconBg: "bg-pastel-mint-100",
    iconColor: "text-pastel-mint-500",
    buttonBg: "bg-pastel-mint-500 hover:bg-pastel-mint-400 border-pastel-mint-300",
  },
  peach: {
    bg: "bg-pastel-peach-50",
    border: "border-pastel-peach-200",
    iconBg: "bg-pastel-peach-100",
    iconColor: "text-pastel-peach-500",
    buttonBg: "bg-pastel-peach-500 hover:bg-pastel-peach-400 border-pastel-peach-300",
  },
  sky: {
    bg: "bg-pastel-sky-50",
    border: "border-pastel-sky-200",
    iconBg: "bg-pastel-sky-100",
    iconColor: "text-pastel-sky-500",
    buttonBg: "bg-pastel-sky-500 hover:bg-pastel-sky-400 border-pastel-sky-300",
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  accent = "lavender",
}) => {
  const styles = accentStyles[accent];

  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed ${styles.border} ${styles.bg} p-8 text-center transition-all duration-300`}>
      {/* Soft square icon container (Strict: No rounded-full) */}
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${styles.border} ${styles.iconBg} ${styles.iconColor} shadow-soft-sm`}>
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`mt-4 flex items-center gap-1.5 rounded-md border ${styles.buttonBg} px-3.5 py-2 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-soft-md active:scale-95`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

