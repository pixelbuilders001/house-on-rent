import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getStorageItem, setStorageItem } from '@/lib/storage';

export const SAVED_PROPERTIES_STORAGE_KEY = 'roomsaathi_saved_properties';

/**
 * Gets currently saved property IDs from localStorage (guest/offline mode)
 */
export function getLocalSavedIds(): string[] {
  return getStorageItem<string[]>(SAVED_PROPERTIES_STORAGE_KEY, []);
}

/**
 * Saves property IDs to localStorage
 */
export function setLocalSavedIds(ids: string[]): void {
  setStorageItem<string[]>(SAVED_PROPERTIES_STORAGE_KEY, ids);
}

/**
 * Fetches saved property IDs from Supabase for an authenticated user
 */
export async function fetchUserSavedIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !userId) return getLocalSavedIds();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('saved_properties')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Could not fetch saved_properties from profile:', error.message);
      return getLocalSavedIds();
    }

    if (data && Array.isArray(data.saved_properties)) {
      return data.saved_properties;
    }
  } catch (err) {
    console.error('Error fetching user saved properties:', err);
  }

  return getLocalSavedIds();
}

/**
 * Merges local saved properties into the authenticated user's profile in Supabase.
 * - Gathers local IDs
 * - Gathers remote IDs
 * - Creates a deduplicated union
 * - Saves back to both Supabase and localStorage
 */
export async function syncAndMergeSavedProperties(userId: string, localIds: string[] = []): Promise<string[]> {
  const currentLocal = localIds.length > 0 ? localIds : getLocalSavedIds();
  const supabase = getSupabaseBrowserClient();

  if (!supabase || !userId) {
    return currentLocal;
  }

  try {
    // 1. Fetch existing profile
    const { data: prof, error: fetchErr } = await supabase
      .from('profiles')
      .select('saved_properties')
      .eq('id', userId)
      .maybeSingle();

    const remoteIds: string[] = (prof && Array.isArray(prof.saved_properties)) ? prof.saved_properties : [];

    // 2. Union / merge without duplicates
    const mergedSet = new Set<string>([...remoteIds, ...currentLocal]);
    const mergedList = Array.from(mergedSet);

    // 3. Update Supabase profile
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        saved_properties: mergedList,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) {
      console.warn('Failed to persist merged saved_properties to Supabase:', updateErr.message);
    }

    // 4. Update localStorage so local copy mirrors cloud copy
    setLocalSavedIds(mergedList);
    return mergedList;
  } catch (err) {
    console.error('Exception during saved properties sync:', err);
    return currentLocal;
  }
}

/**
 * Updates a user's saved properties in Supabase and local storage
 */
export async function persistUserSavedIds(userId: string | null | undefined, ids: string[]): Promise<void> {
  // Always update local storage first for instant feedback
  setLocalSavedIds(ids);

  if (!userId) return;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        saved_properties: ids,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.warn('Could not update saved_properties in profile:', error.message);
    }
  } catch (err) {
    console.error('Failed to update user saved properties:', err);
  }
}
