// src/frontend/services/extracurricularAPI.js

// ИСПРАВЛЕНО: используем переменную окружения
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_URL}/extracurricular`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const extracurricularAPI = {
    // Получить все внеурочные занятия
    getAll: async () => {
        try {
            const response = await fetch(API_URL, {
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

    // Получить занятие по ID
    getById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'GET',
                ...getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch activity');
            return await response.json();
        } catch (error) {
            console.error('Error fetching activity:', error);
            throw error;
        }
    },

    // Создать новое занятие
    create: async (activityData) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                ...getAuthHeaders(),
                body: JSON.stringify(activityData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create activity');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating activity:', error);
            throw error;
        }
    },

    // Обновить занятие
    update: async (id, activityData) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                ...getAuthHeaders(),
                body: JSON.stringify(activityData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update activity');
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating activity:', error);
            throw error;
        }
    },

    // Удалить занятие
    delete: async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                ...getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to delete activity');
            return await response.json();
        } catch (error) {
            console.error('Error deleting activity:', error);
            throw error;
        }
    },

    // Получить расширенный список учителей (с секциями)
    getExtendedTeachers: async () => {
        try {
            const response = await fetch(`${API_URL}/teachers/extended`, {
                method: 'GET',
                ...getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch extended teachers');
            return await response.json();
        } catch (error) {
            console.error('Error fetching extended teachers:', error);
            throw error;
        }
    }
};