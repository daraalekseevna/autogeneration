// src/frontend/config/extracurricular/index.js
// Главный файл конфигурации внешкольных занятий

// Экспорт основных модулей
export * from './colors';
export * from './schedule';
export * from './teachers';
export * from './rooms';
export * from './classes';
export * from './forms';

// Экспорт вспомогательных модулей
export * from './activities';
export * from './dragdrop';
export * from './display';
export * from './filters';
export * from './storage';

// Функция инициализации всей конфигурации
export const initializeExtracurricularConfig = () => {
    console.log('🔄 Инициализация конфигурации школы...');
    
    try {
        // Инициализируем модули, которые имеют метод initialize
        const modulesToInitialize = [
            { module: import('./colors'), name: 'ColorPalette' },
            { module: import('./teachers'), name: 'TeacherRegistry' },
            { module: import('./rooms'), name: 'RoomRegistry' },
            { module: import('./classes'), name: 'ClassRegistry' },
            { module: import('./storage'), name: 'StorageConfig' }
        ];
        
        // Инициализируем синхронно если модули уже загружены
        modulesToInitialize.forEach(({ name }) => {
            try {
                // Проверяем, есть ли модуль в кэше
                if (window[name] && typeof window[name].initialize === 'function') {
                    window[name].initialize();
                }
            } catch (error) {
                console.warn(`Не удалось инициализировать ${name}:`, error);
            }
        });
        
        console.log('✅ Конфигурация школы успешно инициализирована');
        
        // Загружаем статистику асинхронно
        setTimeout(() => {
            try {
                const teacherCount = window.TeacherRegistry?.TEACHERS?.length || 0;
                const classCount = window.ClassRegistry?.ALL_CLASSES?.length || 0;
                const roomCount = window.RoomRegistry?.DEFAULT_ROOMS?.length || 0;
                
                console.log('📊 Статистика:');
                console.log(`   • Учителей: ${teacherCount}`);
                console.log(`   • Классов: ${classCount}`);
                console.log(`   • Кабинетов: ${roomCount}`);
            } catch (e) {
                // Игнорируем ошибки статистики
            }
        }, 100);
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка инициализации конфигурации:', error);
        return false;
    }
};

// Экспорт по умолчанию (для удобного импорта)
const extracurricularConfig = {
    initialize: initializeExtracurricularConfig,
    // Ссылки на основные модули (будут заполнены при инициализации)
    colors: null,
    schedule: null,
    teachers: null,
    rooms: null,
    classes: null,
    forms: null,
    activities: null,
    dragdrop: null,
    display: null,
    filters: null,
    storage: null
};

// Заполняем ссылки на модули
try {
    extracurricularConfig.colors = require('./colors');
    extracurricularConfig.schedule = require('./schedule');
    extracurricularConfig.teachers = require('./teachers');
    extracurricularConfig.rooms = require('./rooms');
    extracurricularConfig.classes = require('./classes');
    extracurricularConfig.forms = require('./forms');
    extracurricularConfig.activities = require('./activities');
    extracurricularConfig.dragdrop = require('./dragdrop');
    extracurricularConfig.display = require('./display');
    extracurricularConfig.filters = require('./filters');
    extracurricularConfig.storage = require('./storage');
} catch (error) {
    console.warn('Некоторые модули конфигурации недоступны:', error);
}

export default extracurricularConfig;