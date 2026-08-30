/**
 * avatarUtils.ts
 * Provides colorful, deterministic gradients and initial letter badges for users & members
 * when profile photos are not mapped.
 */

export interface AvatarColorTheme {
  name: string;
  gradient: string;
  solidBg: string;
  textColor: string;
  borderColor: string;
  softBg: string;
  softText: string;
  shadowColor: string;
}

export const AVATAR_COLOR_PALETTES: AvatarColorTheme[] = [
  {
    name: 'indigo-purple',
    gradient: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600',
    solidBg: 'bg-indigo-600',
    textColor: 'text-white',
    borderColor: 'border-indigo-400/40',
    softBg: 'bg-indigo-50',
    softText: 'text-indigo-700',
    shadowColor: 'shadow-indigo-500/25',
  },
  {
    name: 'emerald-teal',
    gradient: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600',
    solidBg: 'bg-emerald-600',
    textColor: 'text-white',
    borderColor: 'border-emerald-400/40',
    softBg: 'bg-emerald-50',
    softText: 'text-emerald-700',
    shadowColor: 'shadow-emerald-500/25',
  },
  {
    name: 'rose-pink',
    gradient: 'bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600',
    solidBg: 'bg-rose-600',
    textColor: 'text-white',
    borderColor: 'border-rose-400/40',
    softBg: 'bg-rose-50',
    softText: 'text-rose-700',
    shadowColor: 'shadow-rose-500/25',
  },
  {
    name: 'amber-orange',
    gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500',
    solidBg: 'bg-amber-600',
    textColor: 'text-white',
    borderColor: 'border-amber-400/40',
    softBg: 'bg-amber-50',
    softText: 'text-amber-800',
    shadowColor: 'shadow-amber-500/25',
  },
  {
    name: 'cyan-blue',
    gradient: 'bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-600',
    solidBg: 'bg-cyan-600',
    textColor: 'text-white',
    borderColor: 'border-cyan-400/40',
    softBg: 'bg-cyan-50',
    softText: 'text-cyan-800',
    shadowColor: 'shadow-cyan-500/25',
  },
  {
    name: 'violet-fuchsia',
    gradient: 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600',
    solidBg: 'bg-violet-600',
    textColor: 'text-white',
    borderColor: 'border-violet-400/40',
    softBg: 'bg-violet-50',
    softText: 'text-violet-700',
    shadowColor: 'shadow-violet-500/25',
  },
  {
    name: 'blue-indigo',
    gradient: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700',
    solidBg: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-400/40',
    softBg: 'bg-blue-50',
    softText: 'text-blue-700',
    shadowColor: 'shadow-blue-500/25',
  },
  {
    name: 'teal-emerald',
    gradient: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-green-600',
    solidBg: 'bg-teal-600',
    textColor: 'text-white',
    borderColor: 'border-teal-400/40',
    softBg: 'bg-teal-50',
    softText: 'text-teal-800',
    shadowColor: 'shadow-teal-500/25',
  },
  {
    name: 'fuchsia-pink',
    gradient: 'bg-gradient-to-br from-fuchsia-500 via-pink-600 to-rose-600',
    solidBg: 'bg-fuchsia-600',
    textColor: 'text-white',
    borderColor: 'border-fuchsia-400/40',
    softBg: 'bg-fuchsia-50',
    softText: 'text-fuchsia-800',
    shadowColor: 'shadow-fuchsia-500/25',
  },
  {
    name: 'sky-blue',
    gradient: 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600',
    solidBg: 'bg-sky-600',
    textColor: 'text-white',
    borderColor: 'border-sky-400/40',
    softBg: 'bg-sky-50',
    softText: 'text-sky-800',
    shadowColor: 'shadow-sky-500/25',
  },
  {
    name: 'coral-amber',
    gradient: 'bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500',
    solidBg: 'bg-orange-600',
    textColor: 'text-white',
    borderColor: 'border-orange-400/40',
    softBg: 'bg-orange-50',
    softText: 'text-orange-800',
    shadowColor: 'shadow-orange-500/25',
  },
  {
    name: 'purple-violet',
    gradient: 'bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700',
    solidBg: 'bg-purple-700',
    textColor: 'text-white',
    borderColor: 'border-purple-400/40',
    softBg: 'bg-purple-50',
    softText: 'text-purple-800',
    shadowColor: 'shadow-purple-500/25',
  },
];

/**
 * Extracts 1-2 uppercase letters from name (e.g. "John Doe" -> "JD", "SuperAdmin" -> "SA" or "S")
 */
export function getInitials(name?: string | null, maxChars: 1 | 2 = 2): string {
  if (!name || typeof name !== 'string') return 'U';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ');
  if (!clean) return 'U';

  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 1) {
    if (maxChars === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }

  // Multi-word name: take first char of first word & first char of last word
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return maxChars === 1 ? first : `${first}${last}`;
}

/**
 * Generates a deterministic hash from a string identifier (e.g., name or userId)
 */
export function getAvatarColor(identifier?: string | null): AvatarColorTheme {
  if (!identifier) return AVATAR_COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % AVATAR_COLOR_PALETTES.length;
  return AVATAR_COLOR_PALETTES[index];
}
