// src/frontend/services/extracurricularAPI.js

// ✅ Исправлено: используем переменную окружения или localhost для разработки
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_URL}/extracurricular`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token in getAuthHeaders:', token ? 'present' : 'null');
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
            console.log('📡 GET ALL activities from:', API_URL);
            const response = await fetch(API_URL, {
                method: 'GET',
                ...getAuthHeaders()
            });
            if (!response.ok) {
                const text = await response.text();
                console.error('Response error:', text);
                throw new Error('Failed to fetch activities');
            }
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
            console.log('📡 CREATE activity at:', API_URL);
            console.log('📦 Data:', activityData);
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

    // ✅ ПОЛУЧИТЬ ВСЕХ ПЕДАГОГОВ
    getExtendedTeachers: async () => {
        try {
            console.log('📡 GET extended teachers from:', `${BASE_URL}/superadmin/extended-teachers`);
            
            // Пробуем через superadmin эндпоинт
            const response = await fetch(`${BASE_URL}/superadmin/extended-teachers`, {
                method: 'GET',
                ...getAuthHeaders()
            });
            
            if (!response.ok) {
                console.warn('⚠️ Superadmin endpoint failed, trying fallback...');
                // Если не работает, пробуем через extracurricular
                const fallbackResponse = await fetch(`${BASE_URL}/extracurricular/teachers`, {
                    method: 'GET',
                    ...getAuthHeaders()
                });
                if (!fallbackResponse.ok) {
                    const text = await fallbackResponse.text();
                    console.error('Fallback response error:', text);
                    throw new Error('Failed to fetch teachers');
                }
                const data = await fallbackResponse.json();
                console.log('✅ Teachers loaded via extracurricular endpoint:', data);
                return data;
            }
            
            const data = await response.json();
            console.log('✅ Teachers loaded via superadmin endpoint:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching extended teachers:', error);
            // Возвращаем пустой массив вместо ошибки
            return [];
        }
    },

    // ✅ ПОЛУЧИТЬ ВСЕХ ПЕДАГОГОВ С ИХ СЕКЦИЯМИ
    getTeachersWithSections: async () => {
        try {
            console.log('📡 GET teachers with sections from:', `${BASE_URL}/extracurricular/teachers-with-sections`);
            
            const response = await fetch(`${BASE_URL}/extracurricular/teachers-with-sections`, {
                method: 'GET',
                ...getAuthHeaders()
            });
            
            if (!response.ok) {
                // Пробуем альтернативный эндпоинт
                const altResponse = await fetch(`${BASE_URL}/superadmin/extended-teachers`, {
                    method: 'GET',
                    ...getAuthHeaders()
                });
                if (!altResponse.ok) {
                    throw new Error('Failed to fetch teachers with sections');
                }
                return await altResponse.json();
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Error fetching teachers with sections:', error);
            // Возвращаем пустой массив
            return [];
        }
    },

    // ✅ ПОЛУЧИТЬ СЕКЦИИ КОНКРЕТНОГО ПЕДАГОГА
    getTeacherSections: async (teacherId) => {
        try {
            console.log(`📡 GET teacher sections for ID ${teacherId} from:`, `${BASE_URL}/extracurricular/teachers/${teacherId}/sections`);
            
            const response = await fetch(`${BASE_URL}/extracurricular/teachers/${teacherId}/sections`, {
                method: 'GET',
                ...getAuthHeaders()
            });
            
            if (!response.ok) {
                // Пробуем альтернативный эндпоинт
                const altResponse = await fetch(`${BASE_URL}/superadmin/extended-teachers/${teacherId}/sections`, {
                    method: 'GET',
                    ...getAuthHeaders()
                });
                if (!altResponse.ok) {
                    throw new Error('Failed to fetch teacher sections');
                }
                return await altResponse.json();
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Error fetching teacher sections:', error);
            return [];
        }
    }
};

export default extracurricularAPI;