// src/frontend/services/extracurricularAPI.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const extracurricularAPI = {
    // Получить все занятия
    getAll: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            if (filters.teacher) params.append('teacher', filters.teacher);
            if (filters.day) params.append('day', filters.day);
            if (filters.search) params.append('search', filters.search);
            
            const url = `${API_URL}/extracurricular${params.toString() ? `?${params}` : ''}`;
            const response = await axios.get(url, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw error;
        }
    },
    
    // Получить список учителей (ДОБАВЛЕНО)
    getTeachers: async () => {
        try {
            const response = await axios.get(`${API_URL}/extracurricular/teachers`, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching teachers:', error);
            throw error;
        }
    },
    
    // Получить занятие по ID
    getById: async (id) => {
        const response = await axios.get(`${API_URL}/extracurricular/${id}`, getAuthHeaders());
        return response.data;
    },
    
    // Создать занятие
    create: async (data) => {
        const response = await axios.post(`${API_URL}/extracurricular`, data, getAuthHeaders());
        return response.data;
    },
    
    // Обновить занятие
    update: async (id, data) => {
        const response = await axios.put(`${API_URL}/extracurricular/${id}`, data, getAuthHeaders());
        return response.data;
    },
    
    // Удалить занятие
    delete: async (id) => {
        const response = await axios.delete(`${API_URL}/extracurricular/${id}`, getAuthHeaders());
        return response.data;
    }
};