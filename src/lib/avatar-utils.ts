/**
 * Utility functions for avatar generation and handling
 */

/**
 * Generates a cartoonish avatar URL using DiceBear API
 * @param seed - A unique identifier (like user ID or name) to generate consistent avatars
 * @param style - The avatar style to use (default: 'avataaars' for cartoonish style)
 * @returns URL string for the generated avatar
 */
export function generateAvatar(
    seed: string,
    style: 'avataaars' | 'bottts' | 'fun-emoji' | 'lorelei' | 'notionists' | 'personas' = 'avataaars'
): string {
    // DiceBear API v7 - Free avatar generation service
    // Using avataaars style for cartoonish avatars
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Gets the appropriate avatar URL, falling back to generated avatar if none exists
 * Checks multiple sources in priority order:
 * 1. User's uploaded avatar (avatar_url)
 * 2. Google/OAuth profile picture (picture)
 * 3. Generated cartoonish avatar
 * 
 * @param avatarUrl - The user's uploaded avatar URL (can be null/undefined)
 * @param fallbackSeed - Seed for generating fallback avatar (user ID or name)
 * @param style - Avatar style for fallback generation
 * @param oauthPicture - OAuth provider profile picture (e.g., Google profile photo)
 * @returns URL string for the avatar to display
 */
export function getAvatarUrl(
    avatarUrl: string | null | undefined,
    fallbackSeed: string,
    style: 'avataaars' | 'bottts' | 'fun-emoji' | 'lorelei' | 'notionists' | 'personas' = 'avataaars',
    oauthPicture?: string | null
): string {
    // Priority 1: Check if user has uploaded their own avatar
    if (avatarUrl && avatarUrl.trim() !== '') {
        return avatarUrl;
    }

    // Priority 2: Check if OAuth profile picture exists (e.g., Google profile photo)
    if (oauthPicture && oauthPicture.trim() !== '') {
        return oauthPicture;
    }

    // Priority 3: Generate a cartoonish avatar as fallback
    return generateAvatar(fallbackSeed, style);
}

/**
 * Gets initials from a full name for avatar fallback
 * @param name - Full name of the user
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
