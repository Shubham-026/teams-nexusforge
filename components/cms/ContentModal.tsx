"use client";

import React, { useState, useEffect } from "react";
import { ContentItem, ContentType, ContentStatus } from "@/lib/types";
import { X, Check, AlertCircle } from "lucide-react";

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ContentItem>) => Promise<void>;
  initialData?: ContentItem | null;
}

export const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<ContentType>("blog");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [summary, setSummary] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setSlug(initialData.slug);
      setType(initialData.type);
      setStatus(initialData.status);
      setSummary(initialData.summary || "");
    } else {
      setTitle("");
      setSlug("");
      setType("blog");
      setStatus("draft");
      setSummary("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialData) {
      // auto-generate slug
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setError("Title and slug are required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        title,
        slug,
        type,
        status,
        summary: summary.trim() ? summary : null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save content item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-lg rounded-lg border border-pastel-mint-200 bg-white p-6 shadow-soft-lg transition-all duration-300">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {initialData ? "Edit Website Content" : "Create New Content"}
            </h3>
            <p className="text-xs text-slate-400">
              Publish and manage digital assets for nexusforgeagency.in
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-peach-50 hover:text-pastel-peach-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Next-Gen Web Design Systems for Enterprise"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-pastel-mint-400 focus:outline-none focus:ring-2 focus:ring-pastel-mint-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL Slug <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. web-design-systems-enterprise"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-pastel-mint-400 focus:outline-none focus:ring-2 focus:ring-pastel-mint-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Content Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-all duration-300 focus:border-pastel-mint-400 focus:outline-none focus:ring-2 focus:ring-pastel-mint-100"
              >
                <option value="blog">Agency Blog Post</option>
                <option value="portfolio">Portfolio Showcase</option>
                <option value="case_study">Client Case Study</option>
                <option value="landing_copy">Landing Page Copy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publishing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-all duration-300 focus:border-pastel-mint-400 focus:outline-none focus:ring-2 focus:ring-pastel-mint-100"
              >
                <option value="draft">Draft (Private)</option>
                <option value="in_review">In Editorial Review</option>
                <option value="published">Published (Live)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Summary / Excerpt
              </label>
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all duration-300 ${
                    activeTab === "edit"
                      ? "bg-white text-slate-800 shadow-soft-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all duration-300 ${
                    activeTab === "preview"
                      ? "bg-white text-slate-800 shadow-soft-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {activeTab === "edit" ? (
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief overview or teaser copy for the website..."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-pastel-mint-400 focus:outline-none focus:ring-2 focus:ring-pastel-mint-100"
              />
            ) : (
              <div className="min-h-[86px] rounded-md border border-slate-200 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-700">
                {summary ? (
                  <p>{summary}</p>
                ) : (
                  <span className="italic text-slate-400">No excerpt provided yet.</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md border border-pastel-mint-300 bg-pastel-mint-500 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-mint-400 hover:shadow-soft-md disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{loading ? "Saving..." : initialData ? "Save Changes" : "Create Item"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

