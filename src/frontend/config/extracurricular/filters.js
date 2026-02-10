// src/frontend/config/extracurricular/filters.js
import { WeekSchedule, TimeSchedule } from './schedule';
import { TeacherRegistry } from './teachers';
import { ClassRegistry } from './classes';
import { RoomRegistry } from './rooms';

export const FilterSortConfig = {
    // Типы сортировки для расписания
    SCHEDULE_SORT_TYPES: [
        { id: "time", name: "По времени", field: "startTime", icon: "⏰" },
        { id: "subject", name: "По предмету", field: "subject", icon: "📚" },
        { id: "teacher", name: "По учителю", field: "teacher", icon: "👨‍🏫" },
        { id: "room", name: "По кабинету", field: "room", icon: "🚪" },
        { id: "day", name: "По дню недели", field: "day", icon: "📅" }
    ],
    
    // Типы фильтрации для расписания
    SCHEDULE_FILTER_TYPES: [
        { id: "all", name: "Все дни", icon: "📅" },
        ...WeekSchedule.DAYS.map(day => ({ 
            id: day.dayName, 
            name: day.dayName,
            icon: day.isWeekend ? "🌴" : "📚"
        }))
    ],
    
    // Фильтры по типу занятия
    LESSON_TYPE_FILTERS: [
        { id: "all", name: "Все уроки", icon: "📋" },
        { id: "regular", name: "Обычные уроки", icon: "📖" },
        { id: "extracurricular", name: "Внеклассные занятия", icon: "🎨" },
        { id: "individual", name: "Индивидуальные", icon: "👤" }
    ],
    
    // Фильтры для поиска учителей
    TEACHER_FILTERS: [
        { id: "all", name: "Все учителя", icon: "👨‍🏫" },
        { id: "primary", name: "Начальная школа", icon: "👩‍🏫" },
        { id: "high", name: "Старшая школа", icon: "👨‍🎓" },
        ...Object.keys(TeacherRegistry.TEACHER_CATEGORIES || {}).map(category => ({
            id: category,
            name: TeacherRegistry.TEACHER_CATEGORIES[category]?.name || category,
            icon: "📚"
        }))
    ],
    
    // Функция сортировки занятий
    sortLessons(lessons, sortType) {
        const sorted = [...lessons];
        
        switch (sortType) {
            case "time":
                return sorted.sort((a, b) => 
                    TimeSchedule.compareTimes(a.startTime, b.startTime)
                );
            case "subject":
                return sorted.sort((a, b) => a.subject?.localeCompare(b.subject) || 0);
            case "teacher":
                return sorted.sort((a, b) => a.teacher?.localeCompare(b.teacher) || 0);
            case "room":
                return sorted.sort((a, b) => a.room?.localeCompare(b.room) || 0);
            case "day":
                return sorted.sort((a, b) => {
                    const dayA = WeekSchedule.getDayByName(a.day)?.order || 99;
                    const dayB = WeekSchedule.getDayByName(b.day)?.order || 99;
                    return dayA - dayB;
                });
            default:
                return sorted;
        }
    },
    
    // Функция фильтрации занятий
    filterLessons(lessons, filterDay = "all", filterType = "all", searchText = "") {
        let filtered = [...lessons];
        
        // Фильтр по дню
        if (filterDay !== "all") {
            filtered = filtered.filter(lesson => lesson.day === filterDay);
        }
        
        // Фильтр по типу урока
        if (filterType !== "all") {
            filtered = filtered.filter(lesson => lesson.type === filterType);
        }
        
        // Поиск по тексту
        if (searchText) {
            const lowerSearch = searchText.toLowerCase();
            filtered = filtered.filter(lesson => 
                lesson.subject?.toLowerCase().includes(lowerSearch) ||
                lesson.teacher?.toLowerCase().includes(lowerSearch) ||
                lesson.room?.toLowerCase().includes(lowerSearch) ||
                lesson.description?.toLowerCase().includes(lowerSearch)
            );
        }
        
        return filtered;
    },
    
    // Фильтрация классов
    filterClasses(classes, filters = {}) {
        let filtered = [...classes];
        
        if (filters.grade) {
            filtered = filtered.filter(cls => cls.grade === parseInt(filters.grade));
        }
        
        if (filters.building) {
            filtered = filtered.filter(cls => cls.building === filters.building);
        }
        
        if (filters.type) {
            const grade = parseInt(filters.grade);
            if (filters.type === 'primary') {
                filtered = filtered.filter(cls => cls.grade <= 4);
            } else if (filters.type === 'middle') {
                filtered = filtered.filter(cls => cls.grade >= 5 && cls.grade <= 9);
            } else if (filters.type === 'high') {
                filtered = filtered.filter(cls => cls.grade >= 10);
            }
        }
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(cls => 
                cls.name.toLowerCase().includes(searchLower) ||
                cls.teacher?.toLowerCase().includes(searchLower)
            );
        }
        
        return filtered;
    },
    
    // Получение статистики по фильтрам
    getFilterStats(lessons, filters = {}) {
        const filtered = this.filterLessons(
            lessons,
            filters.day || "all",
            filters.type || "all",
            filters.search || ""
        );
        
        return {
            total: lessons.length,
            filtered: filtered.length,
            byDay: WeekSchedule.DAYS.reduce((acc, day) => {
                acc[day.dayName] = lessons.filter(l => l.day === day.dayName).length;
                return acc;
            }, {}),
            byType: {
                regular: lessons.filter(l => l.type === "regular").length,
                extracurricular: lessons.filter(l => l.type === "extracurricular").length,
                individual: lessons.filter(l => l.type === "individual").length
            }
        };
    },
    
    // Получить конфигурацию сортировки по ID
    getSortConfig(sortId) {
        return this.SCHEDULE_SORT_TYPES.find(sort => sort.id === sortId) || this.SCHEDULE_SORT_TYPES[0];
    },
    
    // Получить конфигурацию фильтра по ID
    getFilterConfig(filterId) {
        return this.SCHEDULE_FILTER_TYPES.find(filter => filter.id === filterId) || this.SCHEDULE_FILTER_TYPES[0];
    },
    
    // Генерация уникального ID для фильтра
    generateFilterId(baseId, additional = "") {
        return `${baseId}-${additional}-${Date.now()}`;
    },
    
    // Сохранение фильтров в localStorage
    saveFilters(key, filters) {
        try {
            localStorage.setItem(`schedule_filters_${key}`, JSON.stringify(filters));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения фильтров:', error);
            return false;
        }
    },
    
    // Загрузка фильтров из localStorage
    loadFilters(key) {
        try {
            const saved = localStorage.getItem(`schedule_filters_${key}`);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('Ошибка загрузки фильтров:', error);
            return null;
        }
    },
    
    // Сброс фильтров
    resetFilters(key) {
        try {
            localStorage.removeItem(`schedule_filters_${key}`);
            return true;
        } catch (error) {
            console.error('Ошибка сброса фильтров:', error);
            return false;
        }
    }
};