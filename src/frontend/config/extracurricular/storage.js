// src/frontend/config/extracurricular/storage.js

export const StorageConfig = {
    // Ключи localStorage
    keys: {
        // Расписание
        schedule: "school_schedule",
        scheduleBackup: "school_schedule_backup",
        scheduleVersion: "school_schedule_version",
        
        // Внешкольные занятия
        extracurricularActivities: "extracurricular_activities",
        
        // Конфигурация
        colors: "extracurricular_customColors",
        teachers: "extracurricular_teachers",
        rooms: "extracurricular_rooms",
        classes: "school_classes",
        settings: "school_settings",
        filters: "school_filters",
        
        // Пользовательские данные
        userPreferences: "user_preferences",
        recentClasses: "user_recent_classes",
        
        // История изменений
        changeHistory: "schedule_change_history",
        conflictHistory: "conflict_resolution_history"
    },
    
    // Версии форматов данных
    versions: {
        schedule: "1.0.0",
        activities: "1.0.0",
        teachers: "1.0.0"
    },
    
    // Настройки сериализации
    serialize: {
        schedule: (scheduleData) => {
            return JSON.stringify({
                ...scheduleData,
                _version: StorageConfig.versions.schedule,
                _timestamp: new Date().toISOString()
            });
        },
        
        activities: (activities) => {
            return JSON.stringify({
                data: activities,
                version: StorageConfig.versions.activities,
                timestamp: Date.now()
            });
        },
        
        teachers: (teachers) => {
            return JSON.stringify(teachers);
        },
        
        filters: (filters) => {
            return JSON.stringify(filters);
        },
        
        backup: (data) => {
            return JSON.stringify({
                data,
                timestamp: new Date().toISOString(),
                backupId: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
        }
    },
    
    // Настройки десериализации
    deserialize: {
        schedule: (data) => {
            if (!data) return null;
            
            try {
                const parsed = JSON.parse(data);
                
                // Проверка версии
                if (parsed._version !== StorageConfig.versions.schedule) {
                    console.warn(`Версия расписания не совпадает: ${parsed._version} != ${StorageConfig.versions.schedule}`);
                    return StorageConfig.migrate.schedule(parsed);
                }
                
                return parsed;
            } catch (error) {
                console.error('Ошибка десериализации расписания:', error);
                return null;
            }
        },
        
        activities: (data) => {
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed.data) ? parsed.data : [];
            } catch {
                return [];
            }
        },
        
        teachers: (data) => {
            try {
                return JSON.parse(data);
            } catch {
                return [];
            }
        },
        
        filters: (data) => {
            try {
                return JSON.parse(data);
            } catch {
                return {};
            }
        },
        
        backup: (data) => {
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }
    },
    
    // Миграция данных между версиями
    migrate: {
        schedule: (oldData) => {
            // Простая миграция - сохраняем данные как есть
            return {
                ...oldData,
                _version: StorageConfig.versions.schedule,
                _migrated: true
            };
        }
    },
    
    // Функции-помощники для работы с хранилищем
    helpers: {
        // Сохранение расписания
        saveSchedule(scheduleData, key = "schedule") {
            try {
                const serialized = StorageConfig.serialize.schedule(scheduleData);
                localStorage.setItem(StorageConfig.keys[key], serialized);
                
                // Создаем backup
                if (key === "schedule") {
                    this.createBackup(scheduleData);
                }
                
                return true;
            } catch (error) {
                console.error('Ошибка сохранения расписания:', error);
                return false;
            }
        },
        
        // Загрузка расписания
        loadSchedule(key = "schedule") {
            const data = localStorage.getItem(StorageConfig.keys[key]);
            return StorageConfig.deserialize.schedule(data);
        },
        
        // Создание backup
        createBackup(data) {
            try {
                const backup = StorageConfig.serialize.backup(data);
                localStorage.setItem(StorageConfig.keys.scheduleBackup, backup);
                
                // Храним только последние 5 backup
                this.cleanupOldBackups();
                
                return true;
            } catch (error) {
                console.error('Ошибка создания backup:', error);
                return false;
            }
        },
        
        // Восстановление из backup
        restoreBackup() {
            try {
                const backup = localStorage.getItem(StorageConfig.keys.scheduleBackup);
                if (!backup) return null;
                
                const parsed = StorageConfig.deserialize.backup(backup);
                if (parsed && parsed.data) {
                    this.saveSchedule(parsed.data);
                    return parsed;
                }
                
                return null;
            } catch (error) {
                console.error('Ошибка восстановления из backup:', error);
                return null;
            }
        },
        
        // Очистка старых backup
        cleanupOldBackups() {
            const backups = [];
            
            // Собираем все backup
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('backup')) {
                    try {
                        const backup = localStorage.getItem(key);
                        const parsed = JSON.parse(backup);
                        if (parsed && parsed.timestamp) {
                            backups.push({
                                key,
                                timestamp: new Date(parsed.timestamp),
                                data: parsed
                            });
                        }
                    } catch (e) {
                        // Пропускаем некорректные backup
                    }
                }
            }
            
            // Сортируем по времени (новые в конце)
            backups.sort((a, b) => a.timestamp - b.timestamp);
            
            // Удаляем старые backup (оставляем последние 5)
            while (backups.length > 5) {
                const oldBackup = backups.shift();
                localStorage.removeItem(oldBackup.key);
            }
        },
        
        // Сохранение фильтров
        saveFilters(filters, context = 'global') {
            try {
                localStorage.setItem(
                    `${StorageConfig.keys.filters}_${context}`,
                    StorageConfig.serialize.filters(filters)
                );
                return true;
            } catch (error) {
                console.error('Ошибка сохранения фильтров:', error);
                return false;
            }
        },
        
        // Загрузка фильтров
        loadFilters(context = 'global') {
            const data = localStorage.getItem(`${StorageConfig.keys.filters}_${context}`);
            return StorageConfig.deserialize.filters(data);
        },
        
        // Сохранение пользовательских предпочтений
        savePreferences(preferences) {
            try {
                localStorage.setItem(
                    StorageConfig.keys.userPreferences,
                    JSON.stringify({
                        ...preferences,
                        lastUpdated: new Date().toISOString()
                    })
                );
                return true;
            } catch (error) {
                console.error('Ошибка сохранения предпочтений:', error);
                return false;
            }
        },
        
        // Загрузка пользовательских предпочтений
        loadPreferences() {
            try {
                const data = localStorage.getItem(StorageConfig.keys.userPreferences);
                return data ? JSON.parse(data) : {};
            } catch {
                return {};
            }
        },
        
        // Сохранение истории изменений
        saveChangeHistory(change) {
            try {
                const history = this.loadChangeHistory();
                history.push({
                    ...change,
                    timestamp: new Date().toISOString(),
                    id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                });
                
                // Храним только последние 100 изменений
                if (history.length > 100) {
                    history.shift();
                }
                
                localStorage.setItem(
                    StorageConfig.keys.changeHistory,
                    JSON.stringify(history)
                );
                
                return true;
            } catch (error) {
                console.error('Ошибка сохранения истории изменений:', error);
                return false;
            }
        },
        
        // Загрузка истории изменений
        loadChangeHistory() {
            try {
                const data = localStorage.getItem(StorageConfig.keys.changeHistory);
                return data ? JSON.parse(data) : [];
            } catch {
                return [];
            }
        },
        
        // Получение размера хранилища
        getStorageSize() {
            let total = 0;
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const value = localStorage.getItem(key);
                    total += (key.length + value.length) * 2; // примерно в байтах
                }
            }
            return total;
        },
        
        // Очистка всех данных
        clearAll() {
            try {
                Object.values(StorageConfig.keys).forEach(key => {
                    localStorage.removeItem(key);
                });
                return true;
            } catch (error) {
                console.error('Ошибка очистки хранилища:', error);
                return false;
            }
        },
        
        // Экспорт всех данных
        exportAllData() {
            try {
                const exportData = {};
                
                Object.entries(StorageConfig.keys).forEach(([name, key]) => {
                    const data = localStorage.getItem(key);
                    if (data) {
                        exportData[name] = {
                            key,
                            data: JSON.parse(data),
                            size: data.length
                        };
                    }
                });
                
                return {
                    data: exportData,
                    timestamp: new Date().toISOString(),
                    totalSize: this.getStorageSize(),
                    version: "1.0.0"
                };
            } catch (error) {
                console.error('Ошибка экспорта данных:', error);
                return null;
            }
        },
        
        // Импорт данных
        importData(importData) {
            try {
                if (!importData || !importData.data) {
                    throw new Error('Неверный формат данных для импорта');
                }
                
                Object.entries(importData.data).forEach(([name, item]) => {
                    if (item && item.data) {
                        localStorage.setItem(item.key, JSON.stringify(item.data));
                    }
                });
                
                return true;
            } catch (error) {
                console.error('Ошибка импорта данных:', error);
                return false;
            }
        }
    },
    
    // Инициализация
    initialize() {
        console.log('StorageConfig инициализирован');
        
        // Проверяем наличие backup
        const backup = this.helpers.restoreBackup();
        if (backup) {
            console.log('Доступен backup от:', backup.timestamp);
        }
        
        return this;
    }
};

// Инициализация при экспорте
StorageConfig.initialize();