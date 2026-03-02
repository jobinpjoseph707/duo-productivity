import api from './api';

export interface Routine {
    id: string;
    title: string;
    color: string;
    start_time: string; // "HH:MM:SS"
    end_time: string; // "HH:MM:SS"
    days_of_week: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    is_active: boolean;
}

class TimelineService {
    async getRoutines(): Promise<Routine[]> {
        const response = await api.get(`/timeline/routines`);
        return response.data;
    }

    async getDailyRoutines(dayOfWeek: number): Promise<Routine[]> {
        const response = await api.get(`/timeline/daily?dayOfWeek=${dayOfWeek}`);
        return response.data;
    }

    async createRoutine(routine: Omit<Routine, 'id' | 'is_active'>): Promise<Routine> {
        const response = await api.post(`/timeline/routines`, routine);
        return response.data;
    }

    async updateRoutine(id: string, routine: Partial<Routine>): Promise<Routine> {
        const response = await api.put(`/timeline/routines/${id}`, routine);
        return response.data;
    }

    async deleteRoutine(id: string): Promise<void> {
        await api.delete(`/timeline/routines/${id}`);
    }
}

export const timelineService = new TimelineService();
