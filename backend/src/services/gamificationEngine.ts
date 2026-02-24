/**
 * GamificationEngine — XP calculation, streak management, and leveling.
 *
 * XP Rules:
 *   - Logging work:    +25 XP base, +10 if linked to a task
 *   - Completing task:  +50 XP
 *   - Daily streak:     +10 XP bonus per consecutive day (capped at +100)
 *
 * Levels:
 *   Level = floor(sqrt(totalXP / 100)) + 1
 *   So: Level 2 at 100 XP, Level 3 at 400 XP, Level 4 at 900 XP, etc.
 */

export interface XPResult {
    xpAwarded: number;
    newTotalXP: number;
    newLevel: number;
    leveledUp: boolean;
    streakBonus: number;
}

export interface StreakResult {
    streakCount: number;
    streakMaintained: boolean;
    streakBroken: boolean;
}

export class GamificationEngine {
    /**
     * Calculate XP for logging work.
     */
    static calculateWorkLogXP(hasTask: boolean, streakCount: number): { baseXP: number; streakBonus: number; total: number } {
        const baseXP = hasTask ? 35 : 25; // +10 bonus for task-linked logs
        const streakBonus = Math.min(streakCount * 10, 100); // cap at 100
        return {
            baseXP,
            streakBonus,
            total: baseXP + streakBonus,
        };
    }

    /**
     * Calculate level from total XP.
     */
    static calculateLevel(totalXP: number): number {
        return Math.floor(Math.sqrt(totalXP / 100)) + 1;
    }

    /**
     * Award XP and return the result.
     */
    static awardXP(currentTotalXP: number, xpToAdd: number): { newTotalXP: number; newLevel: number; oldLevel: number; leveledUp: boolean } {
        const oldLevel = this.calculateLevel(currentTotalXP);
        const newTotalXP = currentTotalXP + xpToAdd;
        const newLevel = this.calculateLevel(newTotalXP);

        return {
            newTotalXP,
            newLevel,
            oldLevel,
            leveledUp: newLevel > oldLevel,
        };
    }

    /**
     * Evaluate streak status based on the last activity date.
     */
    static evaluateStreak(lastActivityDate: string | null, currentStreak: number): StreakResult {
        if (!lastActivityDate) {
            // First ever activity
            return { streakCount: 1, streakMaintained: true, streakBroken: false };
        }

        const last = new Date(lastActivityDate);
        const now = new Date();

        // Reset time components for date-only comparison
        last.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);

        const diffMs = now.getTime() - last.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Same day — streak unchanged
            return { streakCount: currentStreak, streakMaintained: true, streakBroken: false };
        } else if (diffDays === 1) {
            // Consecutive day — streak continues
            return { streakCount: currentStreak + 1, streakMaintained: true, streakBroken: false };
        } else {
            // Missed days — streak broken, restart at 1
            return { streakCount: 1, streakMaintained: false, streakBroken: true };
        }
    }

    /**
     * XP needed to reach the next level.
     */
    static xpForNextLevel(currentLevel: number): number {
        return currentLevel * currentLevel * 100;
    }

    /**
     * Progress percentage toward the next level.
     */
    static levelProgress(totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number; progress: number } {
        const level = this.calculateLevel(totalXP);
        const currentLevelXP = (level - 1) * (level - 1) * 100;
        const nextLevelXP = level * level * 100;
        const progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

        return {
            level,
            currentLevelXP,
            nextLevelXP,
            progress: Math.min(Math.max(progress, 0), 100),
        };
    }
}
