import { apiFetch } from "@/lib/api";

export const asList = (value, key) =>
  Array.isArray(value) ? value : value?.[key] || [];

export const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const parseAttributes = (value) => {
  if (!value || typeof value === "object") return value || {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

export const communityPostUrl = (post) =>
  `/${post.citySlug || slugify(post.city) || "stockholm"}/community/post/${post.slug}`;

export const communityHeaders = (token, json = false) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const communityRequest = async (path, options = {}) => {
  const response = await apiFetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Unable to complete this request.");
    error.fields = data.fields || {};
    error.code = data.code;
    throw error;
  }
  return data;
};

export const formatCommunityDate = (value) => {
  if (!value) return "Recently";
  const date = new Date(String(value).includes("T") ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString();
};
