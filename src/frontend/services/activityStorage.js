// // src/frontend/services/activityStorage.js

// import { DEMO_ACTIVITIES } from '../config/extracurricularData';

// // ========== КЛАСС ДЛЯ РАБОТЫ С ХРАНИЛИЩЕМ ==========
// class ActivityStorage {
//     constructor() {
//         this.storageKey = 'activities_admin';
//         this.backupKey = 'activities_admin_backup';
//         this.version = '1.0.0';
//         this.activities = [];
//         this.listeners = [];
//         this.init();
//     }

//     // Инициализация хранилища
//     init() {
//         try {
//             const saved = localStorage.getItem(this.storageKey);
//             if (saved) {
//                 this.activities = JSON.parse(saved);
//             } else {
//                 // Загружаем демо-данные из extracurricularData.js
//                 this.loadDemoData();
//             }
//             this.notifyListeners();
//         } catch (error) {
//             console.error('Error initializing storage:', error);
//             this.loadDemoData();
//         }
//     }

//     // Загрузка демо-данных из импортированного файла
//     loadDemoData() {
//         this.activities = [...DEMO_ACTIVITIES];
//         this.save();
//     }

//     // Сохранение данных
//     save() {
//         try {
//             localStorage.setItem(this.storageKey, JSON.stringify(this.activities));
//             this.createBackup();
//             this.notifyListeners();
//             return true;
//         } catch (error) {
//             console.error('Error saving activities:', error);
//             return false;
//         }
//     }

//     // Создание резервной копии
//     createBackup() {
//         try {
//             const backup = {
//                 timestamp: new Date().toISOString(),
//                 version: this.version,
//                 data: this.activities
//             };
//             localStorage.setItem(this.backupKey, JSON.stringify(backup));
//         } catch (error) {
//             console.error('Error creating backup:', error);
//         }
//     }

//     // Восстановление из резервной копии
//     restoreFromBackup() {
//         try {
//             const backup = localStorage.getItem(this.backupKey);
//             if (backup) {
//                 const backupData = JSON.parse(backup);
//                 this.activities = backupData.data;
//                 this.save();
//                 return true;
//             }
//             return false;
//         } catch (error) {
//             console.error('Error restoring from backup:', error);
//             return false;
//         }
//     }

//     // Получение всех активностей
//     getAll() {
//         return [...this.activities];
//     }

//     // Получение активности по ID
//     getById(id) {
//         return this.activities.find(activity => activity.id === id);
//     }

//     // Создание новой активности
//     create(activityData) {
//         const newActivity = {
//             ...activityData,
//             id: this.generateId(),
//             createdAt: new Date().toISOString(),
//             updatedAt: new Date().toISOString(),
//             studentsCount: activityData.studentsCount || 0,
//             status: activityData.status || 'active'
//         };
        
//         this.activities.push(newActivity);
//         this.save();
//         return newActivity;
//     }

//     // Обновление активности
//     update(id, activityData) {
//         const index = this.activities.findIndex(a => a.id === id);
//         if (index === -1) return null;
        
//         const updatedActivity = {
//             ...this.activities[index],
//             ...activityData,
//             id: id,
//             updatedAt: new Date().toISOString()
//         };
        
//         this.activities[index] = updatedActivity;
//         this.save();
//         return updatedActivity;
//     }

//     // Удаление активности
//     delete(id) {
//         const index = this.activities.findIndex(a => a.id === id);
//         if (index === -1) return false;
        
//         this.activities.splice(index, 1);
//         this.save();
//         return true;
//     }

//     // Массовое удаление
//     deleteMany(ids) {
//         this.activities = this.activities.filter(a => !ids.includes(a.id));
//         this.save();
//         return true;
//     }

//     // Поиск активностей
//     search(query) {
//         const searchTerm = query.toLowerCase();
//         return this.activities.filter(activity => 
//             activity.title.toLowerCase().includes(searchTerm) ||
//             activity.teacher.toLowerCase().includes(searchTerm) ||
//             activity.room.toLowerCase().includes(searchTerm) ||
//             (activity.description && activity.description.toLowerCase().includes(searchTerm))
//         );
//     }

//     // Фильтрация активностей
//     filter(filters) {
//         let result = [...this.activities];
        
//         if (filters.teacher) {
//             result = result.filter(a => a.teacher === filters.teacher);
//         }
        
//         if (filters.day) {
//             result = result.filter(a => a.days && a.days.includes(filters.day));
//         }
        
//         if (filters.status) {
//             result = result.filter(a => a.status === filters.status);
//         }
        
//         if (filters.level) {
//             result = result.filter(a => a.level === filters.level);
//         }
        
//         if (filters.search) {
//             result = result.filter(a => 
//                 a.title.toLowerCase().includes(filters.search.toLowerCase()) ||
//                 a.teacher.toLowerCase().includes(filters.search.toLowerCase())
//             );
//         }
        
//         return result;
//     }

//     // Получение статистики
//     getStats() {
//         const totalStudents = this.activities.reduce((sum, a) => sum + (a.studentsCount || 0), 0);
//         const totalCapacity = this.activities.reduce((sum, a) => sum + (a.maxStudents || 0), 0);
//         const uniqueTeachers = new Set(this.activities.map(a => a.teacher)).size;
//         const activeActivities = this.activities.filter(a => a.status === 'active').length;
        
//         const daysStats = {};
//         const weekDays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
//         weekDays.forEach(day => {
//             daysStats[day] = this.activities.filter(a => a.days && a.days.includes(day)).length;
//         });
        
//         const levelStats = {
//             beginner: this.activities.filter(a => a.level === 'beginner').length,
//             intermediate: this.activities.filter(a => a.level === 'intermediate').length,
//             advanced: this.activities.filter(a => a.level === 'advanced').length
//         };
        
//         return {
//             totalActivities: this.activities.length,
//             totalStudents,
//             totalCapacity,
//             uniqueTeachers,
//             activeActivities,
//             avgOccupancy: totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0,
//             daysStats,
//             levelStats
//         };
//     }

//     // Генерация ID
//     generateId() {
//         const maxId = this.activities.reduce((max, a) => Math.max(max, a.id), 0);
//         return maxId + 1;
//     }

//     // Очистка всех данных
//     clear() {
//         this.activities = [];
//         this.save();
//     }

//     // Сброс к демо-данным
//     resetToDemo() {
//         this.activities = [...DEMO_ACTIVITIES];
//         this.save();
//         return this.activities;
//     }

//     // Экспорт данных
//     exportData() {
//         return {
//             version: this.version,
//             exportDate: new Date().toISOString(),
//             activities: this.activities,
//             metadata: {
//                 totalCount: this.activities.length,
//                 teachersCount: new Set(this.activities.map(a => a.teacher)).size,
//                 exportFormat: "JSON"
//             }
//         };
//     }

//     // Импорт данных
//     importData(data) {
//         try {
//             let activitiesToImport;
            
//             if (data.activities && Array.isArray(data.activities)) {
//                 activitiesToImport = data.activities;
//             } else if (Array.isArray(data)) {
//                 activitiesToImport = data;
//             } else {
//                 throw new Error('Invalid data format');
//             }
            
//             const validatedActivities = activitiesToImport.map(activity => ({
//                 ...activity,
//                 id: activity.id || this.generateId(),
//                 updatedAt: new Date().toISOString(),
//                 createdAt: activity.createdAt || new Date().toISOString()
//             }));
            
//             this.activities = validatedActivities;
//             this.save();
//             return true;
//         } catch (error) {
//             console.error('Error importing data:', error);
//             return false;
//         }
//     }

//     // Подписка на изменения
//     subscribe(listener) {
//         this.listeners.push(listener);
//         return () => {
//             this.listeners = this.listeners.filter(l => l !== listener);
//         };
//     }

//     // Уведомление подписчиков
//     notifyListeners() {
//         this.listeners.forEach(listener => listener(this.activities));
//     }
// }

// // Создаем единственный экземпляр хранилища
// const activityStorage = new ActivityStorage();

// // Экспортируем для использования
// export default activityStorage;