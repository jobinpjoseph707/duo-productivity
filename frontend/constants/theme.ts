/**
 * Multi-Theme System — Selectable from Profile > Theme
 * Default: Solo Leveling ("The System")
 */

export interface AppTheme {
    name: string;
    label: string;
    description: string;
    colors: {
        primary: string;
        primaryDark: string;
        primaryGlow: string;
        primaryMuted: string;
        secondary: string;
        secondaryGlow: string;
        secondaryMuted: string;
        accent: string;
        accentGlow: string;
        dark: string;
        surface: string;
        surfaceLight: string;
        surfaceBorder: string;
        success: string;
        successGlow: string;
        successBg: string;
        warning: string;
        warningGlow: string;
        warningBg: string;
        error: string;
        errorGlow: string;
        errorBg: string;
        text: string;
        textSecondary: string;
        textMuted: string;
        textDim: string;
        border: string;
        borderLight: string;
        darkest: string;
        overlay: string;
        gridEmpty: string;
        gridLow: string;
        gridMed: string;
        gridHigh: string;
    };
    shadows: {
        card: {
            shadowColor: string;
            shadowOffset: { width: number; height: number };
            shadowOpacity: number;
            shadowRadius: number;
            elevation: number;
        };
        glow: {
            shadowColor: string;
            shadowOffset: { width: number; height: number };
            shadowOpacity: number;
            shadowRadius: number;
            elevation: number;
        };
        button: {
            shadowColor: string;
            shadowOffset: { width: number; height: number };
            shadowOpacity: number;
            shadowRadius: number;
            elevation: number;
        };
    };
}

// ── Solo Leveling — "The System" ──
export const soloLevelingTheme: AppTheme = {
    name: 'solo-leveling',
    label: 'Solo Leveling',
    description: 'Shadow Monarch · Dark purple & cyan glows',
    colors: {
        primary: '#7B61FF',
        primaryDark: '#5B3FD4',
        primaryGlow: 'rgba(123, 97, 255, 0.3)',
        primaryMuted: 'rgba(123, 97, 255, 0.15)',
        secondary: '#00D4FF',
        secondaryGlow: 'rgba(0, 212, 255, 0.25)',
        secondaryMuted: 'rgba(0, 212, 255, 0.12)',
        accent: '#FF6B35',
        accentGlow: 'rgba(255, 107, 53, 0.25)',
        dark: '#0A0E1A',
        surface: '#111827',
        surfaceLight: '#1E293B',
        surfaceBorder: '#1E293B',
        success: '#00FF88',
        successGlow: 'rgba(0, 255, 136, 0.2)',
        successBg: 'rgba(0, 255, 136, 0.08)',
        warning: '#FFB800',
        warningGlow: 'rgba(255, 184, 0, 0.2)',
        warningBg: 'rgba(255, 184, 0, 0.08)',
        error: '#FF4466',
        errorGlow: 'rgba(255, 68, 102, 0.2)',
        errorBg: 'rgba(255, 68, 102, 0.08)',
        text: '#E2E8F0',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
        textDim: '#475569',
        border: '#1E293B',
        borderLight: '#334155',
        darkest: '#060A14',
        overlay: 'rgba(10, 14, 26, 0.85)',
        gridEmpty: '#111827',
        gridLow: '#3B1F8C',
        gridMed: '#5B3FD4',
        gridHigh: '#7B61FF',
    },
    shadows: {
        card: { shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
        glow: { shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
        button: { shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    },
};

// ── Classic Duo — Original Duolingo Green ──
export const classicTheme: AppTheme = {
    name: 'classic',
    label: 'Classic Green',
    description: 'Original Duo · Clean teal & green',
    colors: {
        primary: '#58CC02',
        primaryDark: '#46A302',
        primaryGlow: 'rgba(88, 204, 2, 0.3)',
        primaryMuted: 'rgba(88, 204, 2, 0.15)',
        secondary: '#CE82FF',
        secondaryGlow: 'rgba(206, 130, 255, 0.25)',
        secondaryMuted: 'rgba(206, 130, 255, 0.12)',
        accent: '#FF9600',
        accentGlow: 'rgba(255, 150, 0, 0.25)',
        dark: '#131F24',
        surface: '#1A2C34',
        surfaceLight: '#243B45',
        surfaceBorder: '#243B45',
        success: '#58CC02',
        successGlow: 'rgba(88, 204, 2, 0.2)',
        successBg: 'rgba(88, 204, 2, 0.08)',
        warning: '#FF9600',
        warningGlow: 'rgba(255, 150, 0, 0.2)',
        warningBg: 'rgba(255, 150, 0, 0.08)',
        error: '#EF4444',
        errorGlow: 'rgba(239, 68, 68, 0.2)',
        errorBg: 'rgba(239, 68, 68, 0.08)',
        text: '#E5E7EB',
        textSecondary: '#9CA3AF',
        textMuted: '#6B7280',
        textDim: '#4B5563',
        border: '#2A3C44',
        borderLight: '#374151',
        darkest: '#0F1419',
        overlay: 'rgba(19, 31, 36, 0.85)',
        gridEmpty: '#1A2C34',
        gridLow: '#2F6D01',
        gridMed: '#46A302',
        gridHigh: '#58CC02',
    },
    shadows: {
        card: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
        glow: { shadowColor: '#58CC02', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
        button: { shadowColor: '#58CC02', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    },
};

// ── Crimson Knight — Red & Gold ──
export const crimsonTheme: AppTheme = {
    name: 'crimson',
    label: 'Crimson Knight',
    description: 'Fierce warrior · Red & gold blaze',
    colors: {
        primary: '#E53E3E',
        primaryDark: '#C53030',
        primaryGlow: 'rgba(229, 62, 62, 0.3)',
        primaryMuted: 'rgba(229, 62, 62, 0.15)',
        secondary: '#F6AD55',
        secondaryGlow: 'rgba(246, 173, 85, 0.25)',
        secondaryMuted: 'rgba(246, 173, 85, 0.12)',
        accent: '#FFD700',
        accentGlow: 'rgba(255, 215, 0, 0.25)',
        dark: '#1A0A0A',
        surface: '#2D1515',
        surfaceLight: '#3D2020',
        surfaceBorder: '#4A2525',
        success: '#48BB78',
        successGlow: 'rgba(72, 187, 120, 0.2)',
        successBg: 'rgba(72, 187, 120, 0.08)',
        warning: '#F6AD55',
        warningGlow: 'rgba(246, 173, 85, 0.2)',
        warningBg: 'rgba(246, 173, 85, 0.08)',
        error: '#FC8181',
        errorGlow: 'rgba(252, 129, 129, 0.2)',
        errorBg: 'rgba(252, 129, 129, 0.08)',
        text: '#FED7D7',
        textSecondary: '#FEB2B2',
        textMuted: '#FC8181',
        textDim: '#E53E3E',
        border: '#4A2525',
        borderLight: '#5C3030',
        darkest: '#0D0505',
        overlay: 'rgba(26, 10, 10, 0.85)',
        gridEmpty: '#2D1515',
        gridLow: '#9B2C2C',
        gridMed: '#C53030',
        gridHigh: '#E53E3E',
    },
    shadows: {
        card: { shadowColor: '#E53E3E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
        glow: { shadowColor: '#E53E3E', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
        button: { shadowColor: '#E53E3E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    },
};

// All available themes
export const ALL_THEMES: AppTheme[] = [
    soloLevelingTheme,
    classicTheme,
    crimsonTheme,
];

export function getThemeByName(name: string): AppTheme {
    return ALL_THEMES.find(t => t.name === name) || soloLevelingTheme;
}
