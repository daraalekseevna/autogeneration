// // src/frontend/services/teacherScheduleStorage.js

// const STORAGE_KEY = 'teacher_schedule';

// // Начальные данные - ВСЕ ДНИ НА РУССКОМ
// const initialSchedule = [
//     { id: 1, title: 'Математика', teacher: 'Иванова А.П.', days: ['Понедельник', 'Среда', 'Пятница'], startTime: '08:30', endTime: '09:15', color: '#2196F3', room: '201', className: '5А', type: 'lesson' },
//     { id: 2, title: 'Алгебра', teacher: 'Иванова А.П.', days: ['Вторник', 'Четверг'], startTime: '09:25', endTime: '10:10', color: '#4CAF50', room: '203', className: '7Б', type: 'lesson' },
//     { id: 3, title: 'Геометрия', teacher: 'Иванова А.П.', days: ['Понедельник', 'Среда'], startTime: '10:20', endTime: '11:05', color: '#9C27B0', room: '201', className: '8В', type: 'lesson' },
//     { id: 4, title: 'Математический кружок', teacher: 'Иванова А.П.', days: ['Вторник'], startTime: '14:00', endTime: '15:30', color: '#FF9800', room: '201', className: '5-6 классы', type: 'extracurricular' },
//     { id: 5, title: 'Подготовка к ОГЭ', teacher: 'Иванова А.П.', days: ['Четверг'], startTime: '15:30', endTime: '17:00', color: '#F44336', room: '201', className: '9 классы', type: 'extracurricular' },
//     { id: 6, title: 'Олимпиадная математика', teacher: 'Иванова А.П.', days: ['Суббота'], startTime: '09:00', endTime: '10:30', color: '#E91E63', room: '201', className: '7-8 классы', type: 'extracurricular' }
// ];

// // Получить все занятия
// const getAll = () => {
//     try {
//         const data = localStorage.getItem(STORAGE_KEY);
//         console.log('Loaded from localStorage:', data);
        
//         if (!data) {
//             console.log('No data, saving initial schedule');
//             localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSchedule));
//             return [...initialSchedule];
//         }
        
//         const parsed = JSON.parse(data);
//         console.log('Parsed data:', parsed);
        
//         // Убеждаемся, что у каждого занятия есть массив days
//         return parsed.map(item => ({
//             ...item,
//             days: item.days || []
//         }));
//     } catch (error) {
//         console.error('Error loading data:', error);
//         return [...initialSchedule];
//     }
// };

// // Сохранить все занятия
// const saveAll = (activities) => {
//     try {
//         localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
//         console.log('Saved to localStorage:', activities);
//     } catch (error) {
//         console.error('Error saving data:', error);
//     }
// };

// // Получить занятие по id
// const getById = (id) => {
//     const activities = getAll();
//     return activities.find(a => a.id === id);
// };

// // Создать новое занятие
// const create = (activity) => {
//     const activities = getAll();
//     const newId = Math.max(...activities.map(a => a.id), 0) + 1;
//     const newActivity = { 
//         ...activity, 
//         id: newId,
//         days: activity.days || []
//     };
//     activities.push(newActivity);
//     saveAll(activities);
//     notifySubscribers();
//     return newActivity;
// };

// // Обновить занятие
// const update = (id, updatedActivity) => {
//     const activities = getAll();
//     const index = activities.findIndex(a => a.id === id);
//     if (index !== -1) {
//         activities[index] = { 
//             ...activities[index], 
//             ...updatedActivity, 
//             id,
//             days: updatedActivity.days || []
//         };
//         saveAll(activities);
//         notifySubscribers();
//         return activities[index];
//     }
//     return null;
// };

// // Удалить занятие
// const deleteActivity = (id) => {
//     const activities = getAll();
//     const filtered = activities.filter(a => a.id !== id);
//     saveAll(filtered);
//     notifySubscribers();
// };

// // Фильтрация
// const filter = (filters) => {
//     let activities = getAll();
    
//     if (filters.search) {
//         const searchLower = filters.search.toLowerCase();
//         activities = activities.filter(a => 
//             (a.title || '').toLowerCase().includes(searchLower) ||
//             (a.teacher || '').toLowerCase().includes(searchLower) ||
//             (a.className || '').toLowerCase().includes(searchLower)
//         );
//     }
    
//     if (filters.type) {
//         activities = activities.filter(a => a.type === filters.type);
//     }
    
//     if (filters.day) {
//         activities = activities.filter(a => a.days && a.days.includes(filters.day));
//     }
    
//     if (filters.teacher) {
//         activities = activities.filter(a => a.teacher === filters.teacher);
//     }
    
//     return activities;
// };

// // Получить уникальных учителей
// const getTeachers = () => {
//     const activities = getAll();
//     return [...new Set(activities.map(a => a.teacher))];
// };

// // Подписка на изменения
// let subscribers = [];
// const subscribe = (callback) => {
//     subscribers.push(callback);
//     return () => {
//         subscribers = subscribers.filter(cb => cb !== callback);
//     };
// };

// const notifySubscribers = () => {
//     const data = getAll();
//     subscribers.forEach(cb => cb(data));
// };

// // Очистить и сбросить данные (для отладки)
// const resetData = () => {
//     localStorage.removeItem(STORAGE_KEY);
//     const fresh = [...initialSchedule];
//     saveAll(fresh);
//     notifySubscribers();
//     return fresh;
// };

// export default {
//     getAll,
//     getById,
//     create,
//     update,
//     delete: deleteActivity,
//     filter,
//     getTeachers,
//     subscribe,
//     resetData
// };