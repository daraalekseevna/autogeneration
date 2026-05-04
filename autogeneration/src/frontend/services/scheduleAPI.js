import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const scheduleAPI = {
    // Получить настройки
    getSettings: async () => {
        const response = await axios.get(`${API_URL}/schedule/settings`, getAuthHeaders());
        return response.data;
    },
    
    // Сохранить настройки
    saveSettings: async (settings) => {
        const response = await axios.post(`${API_URL}/schedule/settings`, settings, getAuthHeaders());
        return response.data;
    }
};
//нужная стр