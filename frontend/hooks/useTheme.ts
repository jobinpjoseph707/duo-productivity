import { AppTheme, getThemeByName } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';

/**
 * Returns the currently active theme object.
 * Components use this to read colors/shadows dynamically.
 */
export function useTheme(): AppTheme {
    const themeName = useAppStore((state) => state.themeName);
    return getThemeByName(themeName);
}
