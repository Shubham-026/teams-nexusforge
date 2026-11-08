"use client";

import React, { useState, useEffect } from "react";
import { ContentItem, ContentType, ContentStatus } from "@/lib/types";
import { ContentModal } from "./ContentModal";
import { CMSTableSkeleton } from "./CMSTableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/context/ToastContext";
import {
  getContentItems,
  createContentItem,
  updateContentItem,
  deleteContentItem,
} from "@/lib/supabase";
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  Calendar,
  Layers,
} from "lucide-react";

const typeBadges: Record<ContentType, { label: string; bg: string; text: string; border: string }> = {
  blog: {
    label: "Blog Post",
    bg: "bg-pastel-lavender-50",
    text: "text-pastel-lavender-500",
    border: "border-pastel-lavender-200",
  },
  portfolio: {
    label: "Portfolio",
    bg: "bg-pastel-mint-50",
    text: "text-pastel-mint-500",
    border: "border-pastel-mint-200",
  },
  case_study: {
    label: "Case Study",
    bg: "bg-pastel-sky-50",
    text: "text-pastel-sky-500",
    border: "border-pastel-sky-200",
  },
  landing_copy: {
    label: "Landing Copy",
    bg: "bg-pastel-peach-50",
    text: "text-pastel-peach-500",
    border: "border-pastel-peach-200",
  },
};

const statusBadges: Record<ContentStatus, { label: string; bg: string; text: string; border: string }> = {
  published: {
    label: "Published",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  in_review: {
    label: "In Review",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  draft: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
  },
};

export const CMSTable: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveToLocal = (newItems: ContentItem[]) => {
    try {
      localStorage.setItem("nexusforge_cms_items", JSON.stringify(newItems));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Load from local storage cache
    try {
      const cached = localStorage.getItem("nexusforge_cms_items");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const userOnly = parsed.filter((i) => !["content-01", "content-02", "content-03", "content-04"].includes(i.id));
          setItems(userOnly);
        }
      }
    } catch (e) {}

    // Fetch exclusively from Supabase
    async function loadContent() {
      try {
        const remote = await getContentItems();
        if (mounted) {
          setItems(remote || []);
          saveToLocal(remote || []);
        }
      } catch (err) {
        console.warn("Supabase content load error:", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    loadContent();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateOrUpdate = async (itemData: Partial<ContentItem>) => {
    if (editingItem) {
      // Update
      const updated = {
        ...editingItem,
        ...itemData,
        updated_at: new Date().toISOString(),
      } as ContentItem;

      const newItems = items.map((i) => (i.id === editingItem.id ? updated : i));
      setItems(newItems);
      saveToLocal(newItems);
      toast.success("Content Updated", `"${itemData.title || editingItem.title}" saved successfully`);

      try {
        await updateContentItem(editingItem.id, itemData);
      } catch (err) {
        console.warn("Updated locally (Supabase write queued):", err);
      }
    } else {
      // Create
      const tempId = `content-${Date.now()}`;
      const newItem: ContentItem = {
        id: tempId,
        title: itemData.title || "",
        slug: itemData.slug || "",
        type: itemData.type || "blog",
        status: itemData.status || "draft",
        summary: itemData.summary || null,
        author_id: "agency-admin",
        author_name: "Agency Staff",
        views_count: 0,
        published_at: itemData.status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const newItems = [newItem, ...items];
      setItems(newItems);
      saveToLocal(newItems);
      toast.success("Content Created", `"${itemData.title}" added to catalog`);

      try {
        const created = await createContentItem(itemData);
        if (created && created.id) {
          const finalized = newItems.map((i) => (i.id === tempId ? created : i));
          setItems(finalized);
          saveToLocal(finalized);
        }
      } catch (err) {
        console.warn("Created locally (Supabase write queued):", err);
      }
    }
    setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    const previous = [...items];
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveToLocal(updated);

    try {
      await deleteContentItem(id);
      toast.success("Content Removed", "Entry deleted from CMS catalog");
    } catch (err: any) {
      console.error("Delete content item failed:", err);
      // Revert if database rejected
      setItems(previous);
      saveToLocal(previous);
      const msg = err?.message || "Could not delete content from database";
      toast.error("Delete Failed", msg);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ContentItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType ? item.type === selectedType : true;
    const matchesStatus = selectedStatus ? item.status === selectedStatus : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top action and filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800">
            Agency Website Content CMS
          </h2>
          <p className="text-xs text-slate-500">
            Publish blog articles, portfolio showcases, and landing page assets for nexusforgeagency.in
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search box with strict soft square */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-48 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 transition-all duration-300 focus:border-pastel-mint-400 focus:outline-none focus:ring-2 focus:ring-pastel-mint-100 sm:w-56"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-all duration-300 focus:border-pastel-mint-400 focus:outline-none focus:ring-2 focus:ring-pastel-mint-100"
          >
            <option value="">All Categories</option>
            <option value="blog">Blog Posts</option>
            <option value="portfolio">Portfolio</option>
            <option value="case_study">Case Studies</option>
            <option value="landing_copy">Landing Copy</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-all duration-300 focus:border-pastel-mint-400 focus:outline-none focus:ring-2 focus:ring-pastel-mint-100"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="in_review">In Review</option>
            <option value="draft">Draft</option>
          </select>

          {/* New Item Button: Strict soft square (no rounded-full) */}
          <button
            onClick={openCreateModal}
            className="flex h-9 items-center gap-1.5 rounded-md border border-pastel-mint-300 bg-pastel-mint-500 px-3.5 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-mint-400 hover:shadow-soft-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Content</span>
          </button>
        </div>
      </div>

      {/* Table Content or Skeleton / Empty State */}
      {isLoading ? (
        <CMSTableSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No website content published yet"
          description="Your agency CMS directory is currently empty. Start publishing blog posts, client case studies, or portfolio items for nexusforgeagency.in."
          actionLabel="Create First Content Item"
          onAction={openCreateModal}
          accent="mint"
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching content entries"
          description={`No articles or pages match "${searchQuery}" or the selected status/category. Try resetting your search filters.`}
          actionLabel="Reset Search & Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedType("");
            setSelectedStatus("");
          }}
          accent="mint"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-soft-sm transition-all duration-300 hover:shadow-soft-md">
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
                {filteredItems.map((item) => {
                  const typeStyle = typeBadges[item.type] || typeBadges.blog;
                  const statusStyle = statusBadges[item.status] || statusBadges.draft;

                  return (
                    <tr
                      key={item.id}
                      className="group transition-all duration-300 hover:bg-slate-50/70"
                    >
                      {/* Title and slug */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 group-hover:text-pastel-lavender-500 transition-colors">
                            {item.title}
                          </span>
                          <span className="mt-0.5 font-mono text-xs text-slate-400">
                            /{item.slug}
                          </span>
                        </div>
                      </td>

                      {/* Category: Strict soft square badge (rounded-md) */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                        >
                          {typeStyle.label}
                        </span>
                      </td>

                      {/* Status: Strict soft square badge (rounded-md) */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                        {item.author_name}
                      </td>

                      {/* Metrics / Views */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          <span>{item.views_count.toLocaleString()} views</span>
                        </div>
                      </td>

                      {/* Actions: Edit & Delete buttons */}
                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit content"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-all duration-300 hover:scale-[1.02] hover:border-pastel-lavender-300 hover:bg-pastel-lavender-50 hover:text-pastel-lavender-500 hover:shadow-soft-sm"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete content"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-all duration-300 hover:scale-[1.02] hover:border-pastel-peach-300 hover:bg-pastel-peach-50 hover:text-pastel-peach-500 hover:shadow-soft-sm"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Create/Edit Modal */}
      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingItem}
      />
    </div>
  );
};

