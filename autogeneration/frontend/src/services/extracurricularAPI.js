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
    
    // Получить список учителей школы (ДЛЯ СОВМЕСТИМОСТИ)
    getTeachers: async () => {
        try {
            const response = await axios.get(`${API_URL}/extracurricular/teachers`, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching teachers:', error);
            return [];
        }
    },
    
    // ПОЛУЧИТЬ СПИСОК ПЕДАГОГОВ ДОП. ОБРАЗОВАНИЯ (НОВЫЙ МЕТОД)
    getExtendedTeachers: async () => {
        try {
            console.log('Fetching extended teachers...');
            const response = await axios.get(`${API_URL}/extracurricular/extended-teachers`, getAuthHeaders());
            console.log('Extended teachers response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching extended teachers:', error);
            return [];
        }
    },
    
    // Получить занятие по ID
    getById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/extracurricular/${id}`, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching activity:', error);
            throw error;
        }
    },
    
    // Создать занятие
    create: async (data) => {
        try {
            console.log('Creating activity with data:', data);
            const response = await axios.post(`${API_URL}/extracurricular`, data, getAuthHeaders());
            console.log('Create response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating activity:', error);
            throw error;
        }
    },
    
    // Обновить занятие
    update: async (id, data) => {
        try {
            const response = await axios.put(`${API_URL}/extracurricular/${id}`, data, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.error('Error updating activity:', error);
            throw error;
        }
    },
    
    // Удалить занятие
    delete: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/extracurricular/${id}`, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.error('Error deleting activity:', error);
            throw error;
        }
    }
};