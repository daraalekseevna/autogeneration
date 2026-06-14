import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const activityAPI = {
    // Получить журнал событий
    getActivities: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);
        
        const response = await axios.get(`${API_URL}/activity?${params}`, getAuthHeaders());
        return response.data;
    },
    
    // Получить типы событий
    getTypes: async () => {
        const response = await axios.get(`${API_URL}/activity/types`, getAuthHeaders());
        return response.data;
    }
};