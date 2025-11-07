// lib/categories-storage.server.ts
// Categories data persistence layer (server-only)
// Features:
// - Atomic writes (write temp -> rename)
// - Case-insensitive uniqueness checks using slugify
// - Stores categories in Title Case for nicer UI
// - Exposes load, save, add, remove and update helpers

import "server-only";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");
const TMP_FILE = path.join(DATA_DIR, "categories.json.tmp");

const DEFAULT_CATEGORIES = [
  "Rings",
  "Earrings",
  "Pendants",
  "Bracelets",
  "Necklaces",
];

// Helper: create a normalized slug for case-insensitive comparisons
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-word chars
    .replace(/\s+/g, "-");
}

// Helper: convert a string to Title Case (keeps words readable)
function toTitleCase(s: string) {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function atomicWrite(filePath: string, data: string) {
  // write to tmp and rename to avoid partial writes
  await ensureDataDir();
  await fs.writeFile(TMP_FILE, data, "utf-8");
  await fs.rename(TMP_FILE, filePath);
}

export async function loadCategories(): Promise<string[]> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(CATEGORIES_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((c) => typeof c === "string")) {
      // ensure Title Case and unique by slug
      const seen = new Set<string>();
      const normalized: string[] = [];
      for (const item of parsed) {
        const title = toTitleCase(String(item));
        const key = slugify(title);
        if (!seen.has(key)) {
          seen.add(key);
          normalized.push(title);
        }
      }
      return normalized;
    }
    return DEFAULT_CATEGORIES.slice();
  } catch {
    // on any error (missing file, parse error) return defaults
    return DEFAULT_CATEGORIES.slice();
  }
}

export async function saveCategories(categories: string[]): Promise<void> {
  // normalize & dedupe before saving
  const seen = new Set<string>();
  const normalized = categories
    .map((c) => toTitleCase(String(c)))
    .filter((c) => {
      const k = slugify(c);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  const json = JSON.stringify(normalized, null, 2);
  await atomicWrite(CATEGORIES_FILE, json);
}

/**
 * Add a category (returns the full updated list)
 * - name: any casing accepted; stored as Title Case
 * - avoids duplicates (case-insensitive)
 */
export async function addCategory(name: string): Promise<string[]> {
  const trimmed = String(name || "").trim();
  if (!trimmed) throw new Error("Category name is required");

  const newTitle = toTitleCase(trimmed);
  const newKey = slugify(newTitle);

  const categories = await loadCategories();
  const existingKeys = new Set(categories.map((c) => slugify(c)));

  if (!existingKeys.has(newKey)) {
    const updated = [...categories, newTitle].sort((a, b) => a.localeCompare(b));
    await saveCategories(updated);
    return updated;
  }

  return categories;
}

/**
 * Remove a category by name (case-insensitive).
 * Returns the updated list.
 */
export async function removeCategory(name: string): Promise<string[]> {
  const keyToRemove = slugify(String(name || ""));
  if (!keyToRemove) throw new Error("Category name is required");

  const categories = await loadCategories();
  const filtered = categories.filter((c) => slugify(c) !== keyToRemove);

  // If nothing changed, return original
  if (filtered.length === categories.length) return categories;

  await saveCategories(filtered);
  return filtered;
}

/**
 * Update an existing category name -> newName (both strings).
 * Returns the updated list.
 */
export async function updateCategory(oldName: string, newName: string): Promise<string[]> {
  const oldKey = slugify(String(oldName || ""));
  const newTrim = String(newName || "").trim();
  if (!oldKey) throw new Error("Existing category name is required");
  if (!newTrim) throw new Error("New category name is required");

  const newTitle = toTitleCase(newTrim);
  const newKey = slugify(newTitle);

  const categories = await loadCategories();
  const hasOld = categories.some((c) => slugify(c) === oldKey);
  if (!hasOld) throw new Error("Category to update not found");

  // if newKey collides with another existing (other than the old one), disallow
  const collision = categories.some((c) => slugify(c) === newKey && slugify(c) !== oldKey);
  if (collision) throw new Error("Another category with that name already exists");

  const updated = categories.map((c) => (slugify(c) === oldKey ? newTitle : c)).sort((a, b) => a.localeCompare(b));
  await saveCategories(updated);
  return updated;
}
