// src/frontend/services/activityAPI.js

// ИСПРАВЛЕНО: используем переменную окружения
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_URL}/activity`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const activityAPI = {
    // Получить список активностей с фильтрацией
    getActivities: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            if (filters.type && filters.type !== 'all') params.append('type', filters.type);
            if (filters.limit) params.append('limit', filters.limit);
            if (filters.offset) params.append('offset', filters.offset);
            
            const url = params.toString() ? `${API_URL}?${params}` : API_URL;
            const response = await fetch(url, {
                method: 'GET',
                ...getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch activities');
            return await response.json();
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw error;
        }
    },

    // Получить статистику
    getStats: async () => {
        try {
            const response = await fetch(`${API_URL}/stats`, {
                method: 'GET',
                ...getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch stats');
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    },

    // Логирование действия
    logActivity: async (activityData) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                ...getAuthHeaders(),
                body: JSON.stringify(activityData)
            });
            if (!response.ok) throw new Error('Failed to log activity');
            return await response.json();
        } catch (error) {
            console.error('Error logging activity:', error);
            throw error;
        }
    }
};