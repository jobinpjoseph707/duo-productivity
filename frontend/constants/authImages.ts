/**
 * Auth background images mapped by theme name.
 * React Native requires static require() calls — dynamic paths don't work.
 * So we map theme names to their corresponding background images here.
 */

const AUTH_BACKGROUNDS: Record<string, any> = {
    'solo-leveling': require('@/assets/images/auth_bg.png'),
    'classic': require('@/assets/images/auth_bg_classic.png'),
    'crimson': require('@/assets/images/auth_bg_crimson.png'),
};

/**
 * Get the auth background image source for the current theme.
 * Falls back to Solo Leveling background if theme not found.
 */
export function getAuthBackground(themeName: string): any {
    return AUTH_BACKGROUNDS[themeName] || AUTH_BACKGROUNDS['solo-leveling'];
}
