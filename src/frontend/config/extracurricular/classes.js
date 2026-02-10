// src/frontend/config/extracurricular/classes.js

export const ClassRegistry = {
    // Все классы школы
    ALL_CLASSES: [
        // Начальная школа (1-4 классы)
        { id: '1a', name: '1А', grade: 1, building: 'primary', studentsCount: 25, parallel: 'A' },
        { id: '1b', name: '1Б', grade: 1, building: 'primary', studentsCount: 24, parallel: 'B' },
        { id: '1v', name: '1В', grade: 1, building: 'primary', studentsCount: 26, parallel: 'B' },
        
        { id: '2a', name: '2А', grade: 2, building: 'primary', studentsCount: 27, parallel: 'A' },
        { id: '2b', name: '2Б', grade: 2, building: 'primary', studentsCount: 25, parallel: 'B' },
        { id: '2v', name: '2В', grade: 2, building: 'primary', studentsCount: 26, parallel: 'B' },
        
        { id: '3a', name: '3А', grade: 3, building: 'primary', studentsCount: 28, parallel: 'A' },
        { id: '3b', name: '3Б', grade: 3, building: 'primary', studentsCount: 26, parallel: 'B' },
        { id: '3v', name: '3В', grade: 3, building: 'primary', studentsCount: 27, parallel: 'B' },
        
        { id: '4a', name: '4А', grade: 4, building: 'primary', studentsCount: 29, parallel: 'A' },
        { id: '4b', name: '4Б', grade: 4, building: 'primary', studentsCount: 27, parallel: 'B' },
        { id: '4v', name: '4В', grade: 4, building: 'primary', studentsCount: 28, parallel: 'B' },
        
        // Средняя школа (5-9 классы)
        { id: '5a', name: '5А', grade: 5, building: 'high', studentsCount: 30, parallel: 'A' },
        { id: '5b', name: '5Б', grade: 5, building: 'high', studentsCount: 28, parallel: 'B' },
        { id: '5v', name: '5В', grade: 5, building: 'high', studentsCount: 29, parallel: 'B' },
        
        { id: '6a', name: '6А', grade: 6, building: 'high', studentsCount: 31, parallel: 'A' },
        { id: '6b', name: '6Б', grade: 6, building: 'high', studentsCount: 29, parallel: 'B' },
        { id: '6v', name: '6В', grade: 6, building: 'high', studentsCount: 30, parallel: 'B' },
        
        { id: '7a', name: '7А', grade: 7, building: 'high', studentsCount: 32, parallel: 'A' },
        { id: '7b', name: '7Б', grade: 7, building: 'high', studentsCount: 30, parallel: 'B' },
        { id: '7v', name: '7В', grade: 7, building: 'high', studentsCount: 31, parallel: 'B' },
        
        { id: '8a', name: '8А', grade: 8, building: 'high', studentsCount: 33, parallel: 'A' },
        { id: '8b', name: '8Б', grade: 8, building: 'high', studentsCount: 31, parallel: 'B' },
        { id: '8v', name: '8В', grade: 8, building: 'high', studentsCount: 32, parallel: 'B' },
        
        { id: '9a', name: '9А', grade: 9, building: 'high', studentsCount: 34, parallel: 'A' },
        { id: '9b', name: '9Б', grade: 9, building: 'high', studentsCount: 32, parallel: 'B' },
        { id: '9v', name: '9В', grade: 9, building: 'high', studentsCount: 33, parallel: 'B' },
        
        // Старшая школа (10-11 классы)
        { id: '10a', name: '10А', grade: 10, building: 'high', studentsCount: 30, parallel: 'A' },
        { id: '11a', name: '11А', grade: 11, building: 'high', studentsCount: 28, parallel: 'A' }
    ],
    
    // Классные руководители (можно расширить)
    CLASS_TEACHERS: {
        '1А': 'Ластовина Оксана Борисовна',
        '1Б': 'Кныш Ольга Владимировна',
        '1В': 'Лукина Надежда Ивановна',
        '2А': 'Рафальская Светлана Николаевна',
        '2Б': 'Гусакова Мария Геннадьевна',
        '2В': 'Дамирчиян Валерия Армавировна',
        '3А': 'Хилько Светлана Павловна',
        '3Б': 'Юдина Ирина Васильевна',
        '3В': 'Безуглая Маргарита Денисовна',
        '4А': 'Глазунова Татьяна Сергеевна',
        '4Б': 'Глущенко Татьяна Анатольевна',
        '4В': 'Федченко Светлана Вячеславовна',
        // Для средних и старших классов можно назначить позже
    },
    
    // Цвета для классов (для визуализации)
    CLASS_COLORS: {
        '1А': '#FF6B6B', '1Б': '#4ECDC4', '1В': '#45B7D1',
        '2А': '#96CEB4', '2Б': '#FECA57', '2В': '#FF9FF3',
        '3А': '#54A0FF', '3Б': '#5F27CD', '3В': '#00D2D3',
        '4А': '#1DD1A1', '4Б': '#FF9F43', '4В': '#EE5A24',
        '5А': '#F368E0', '5Б': '#FF9F43', '5В': '#EE5A24',
        '6А': '#00D2D3', '6Б': '#54A0FF', '6В': '#5F27CD',
        '7А': '#1DD1A1', '7Б': '#FF6B6B', '7В': '#4ECDC4',
        '8А': '#45B7D1', '8Б': '#96CEB4', '8В': '#FECA57',
        '9А': '#FF9FF3', '9Б': '#54A0FF', '9В': '#5F27CD',
        '10А': '#1DD1A1', '11А': '#FF6B6B'
    },
    
    // Типы классов
    CLASS_TYPES: {
        PRIMARY: 'Начальная школа (1-4 классы)',
        MIDDLE: 'Основная школа (5-9 классы)',
        HIGH: 'Старшая школа (10-11 классы)'
    },
    
    // Методы для работы с классами
    
    // Получение класса по имени
    getClassByName(className) {
        return this.ALL_CLASSES.find(cls => cls.name === className);
    },
    
    // Получение класса по ID
    getClassById(classId) {
        return this.ALL_CLASSES.find(cls => cls.id === classId);
    },
    
    // Получение классного руководителя
    getClassTeacher(className) {
        return this.CLASS_TEACHERS[className] || null;
    },
    
    // Установка классного руководителя
    setClassTeacher(className, teacherName) {
        this.CLASS_TEACHERS[className] = teacherName;
        this.saveClasses();
    },
    
    // Получение цвета класса
    getClassColor(className) {
        return this.CLASS_COLORS[className] || '#3498db';
    },
    
    // Получение классов по параллели
    getClassesByGrade(grade) {
        return this.ALL_CLASSES
            .filter(cls => cls.grade === grade)
            .sort((a, b) => a.parallel.localeCompare(b.parallel));
    },
    
    // Получение классов по зданию
    getClassesByBuilding(building) {
        return this.ALL_CLASSES.filter(cls => cls.building === building);
    },
    
    // Получение классов по типу
    getClassesByType(type) {
        switch (type) {
            case 'primary':
                return this.ALL_CLASSES.filter(cls => cls.grade <= 4);
            case 'middle':
                return this.ALL_CLASSES.filter(cls => cls.grade >= 5 && cls.grade <= 9);
            case 'high':
                return this.ALL_CLASSES.filter(cls => cls.grade >= 10);
            default:
                return this.ALL_CLASSES;
        }
    },
    
    // Получение всех параллелей
    getAllParallels() {
        const parallels = new Set();
        this.ALL_CLASSES.forEach(cls => parallels.add(cls.parallel));
        return Array.from(parallels).sort();
    },
    
    // Поиск классов
    searchClasses(query, filters = {}) {
        let filtered = this.ALL_CLASSES;
        
        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter(cls => 
                cls.name.toLowerCase().includes(lowerQuery) ||
                this.getClassTeacher(cls.name)?.toLowerCase().includes(lowerQuery)
            );
        }
        
        if (filters.grade) {
            filtered = filtered.filter(cls => cls.grade === parseInt(filters.grade));
        }
        
        if (filters.building) {
            filtered = filtered.filter(cls => cls.building === filters.building);
        }
        
        if (filters.type) {
            filtered = this.getClassesByType(filters.type);
        }
        
        if (filters.parallel) {
            filtered = filtered.filter(cls => cls.parallel === filters.parallel);
        }
        
        if (filters.minStudents) {
            filtered = filtered.filter(cls => cls.studentsCount >= filters.minStudents);
        }
        
        if (filters.maxStudents) {
            filtered = filtered.filter(cls => cls.studentsCount <= filters.maxStudents);
        }
        
        return filtered.sort((a, b) => {
            // Сортировка по классу, затем по параллели
            if (a.grade !== b.grade) return a.grade - b.grade;
            return a.parallel.localeCompare(b.parallel);
        });
    },
    
    // Получение статистики по классам
    getClassStatistics() {
        const stats = {
            totalClasses: this.ALL_CLASSES.length,
            totalStudents: this.ALL_CLASSES.reduce((sum, cls) => sum + cls.studentsCount, 0),
            byGrade: {},
            byBuilding: { primary: 0, high: 0, studentsPrimary: 0, studentsHigh: 0 },
            byType: {
                primary: this.getClassesByType('primary').length,
                middle: this.getClassesByType('middle').length,
                high: this.getClassesByType('high').length
            },
            averageStudents: 0
        };
        
        // Статистика по классам
        this.ALL_CLASSES.forEach(cls => {
            // По классам
            if (!stats.byGrade[cls.grade]) {
                stats.byGrade[cls.grade] = { classes: 0, students: 0 };
            }
            stats.byGrade[cls.grade].classes++;
            stats.byGrade[cls.grade].students += cls.studentsCount;
            
            // По зданиям
            stats.byBuilding[cls.building]++;
            if (cls.building === 'primary') {
                stats.byBuilding.studentsPrimary += cls.studentsCount;
            } else {
                stats.byBuilding.studentsHigh += cls.studentsCount;
            }
        });
        
        // Среднее количество учеников
        stats.averageStudents = Math.round(stats.totalStudents / stats.totalClasses);
        
        return stats;
    },
    
    // Получение классов для select опций
    getClassOptions(filters = {}) {
        const classes = this.searchClasses('', filters);
        
        return classes.map(cls => ({
            value: cls.name,
            label: `${cls.grade} класс "${cls.name}"`,
            grade: cls.grade,
            building: cls.building === 'primary' ? 'Начальная школа' : 'Старшая школа',
            parallel: cls.parallel,
            studentsCount: cls.studentsCount,
            teacher: this.getClassTeacher(cls.name),
            color: this.getClassColor(cls.name)
        }));
    },
    
    // Получение классов для отображения в виде групп
    getClassGroups() {
        return [
            {
                type: 'primary',
                label: 'Начальная школа (1-4 классы)',
                classes: this.getClassesByType('primary')
                    .sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                type: 'middle',
                label: 'Основная школа (5-9 классы)',
                classes: this.getClassesByType('middle')
                    .sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                type: 'high',
                label: 'Старшая школа (10-11 классы)',
                classes: this.getClassesByType('high')
                    .sort((a, b) => a.name.localeCompare(b.name))
            }
        ];
    },
    
    // Добавление нового класса
    addClass(classData) {
        const newClass = {
            id: classData.id || `${classData.grade}${classData.parallel.toLowerCase()}`,
            name: `${classData.grade}${classData.parallel}`,
            grade: parseInt(classData.grade),
            building: classData.grade <= 4 ? 'primary' : 'high',
            studentsCount: classData.studentsCount || 25,
            parallel: classData.parallel
        };
        
        // Проверка на дубликат
        if (this.getClassByName(newClass.name)) {
            console.error(`Класс ${newClass.name} уже существует`);
            return false;
        }
        
        this.ALL_CLASSES.push(newClass);
        
        // Добавляем цвет если его нет
        if (!this.CLASS_COLORS[newClass.name]) {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
                          '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#1DD1A1'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.CLASS_COLORS[newClass.name] = randomColor;
        }
        
        this.saveClasses();
        return true;
    },
    
    // Обновление класса
    updateClass(className, updates) {
        const classIndex = this.ALL_CLASSES.findIndex(cls => cls.name === className);
        if (classIndex === -1) return false;
        
        this.ALL_CLASSES[classIndex] = { ...this.ALL_CLASSES[classIndex], ...updates };
        this.saveClasses();
        return true;
    },
    
    // Удаление класса
    removeClass(className) {
        const classIndex = this.ALL_CLASSES.findIndex(cls => cls.name === className);
        if (classIndex > -1) {
            this.ALL_CLASSES.splice(classIndex, 1);
            delete this.CLASS_TEACHERS[className];
            delete this.CLASS_COLORS[className];
            this.saveClasses();
            return true;
        }
        return false;
    },
    
    // Получение рекомендуемых кабинетов для класса
    getRecommendedRoomsForClass(className) {
        const cls = this.getClassByName(className);
        if (!cls) return [];
        
        if (cls.building === 'primary') {
            return [
                `Каб. ${cls.grade}${cls.parallel === 'A' ? '1' : cls.parallel === 'Б' ? '2' : '3'}`,
                'Спортзал',
                'Актовый зал'
            ];
        } else {
            // Для старших классов кабинеты по предметам
            const rooms = ['Спортзал', 'Актовый зал', 'Библиотека'];
            
            if (cls.grade >= 5 && cls.grade <= 9) {
                rooms.push('Каб. 9', 'Каб. 10', 'Каб. 11', 'Каб. 12');
            } else {
                rooms.push('Каб. 29', 'Каб. 30', 'Каб. 31', 'Каб. 32');
            }
            
            return rooms;
        }
    },
    
    // Получение расписания занятости класса (заглушка)
    getClassSchedule(className, week = 1) {
        // Здесь будет логика получения расписания класса
        return {
            className,
            week,
            schedule: {}
        };
    },
    
    // Сохранение классов в localStorage
    saveClasses() {
        localStorage.setItem('school_classes_all', JSON.stringify(this.ALL_CLASSES));
        localStorage.setItem('school_class_teachers', JSON.stringify(this.CLASS_TEACHERS));
        localStorage.setItem('school_class_colors', JSON.stringify(this.CLASS_COLORS));
    },
    
    // Загрузка классов из localStorage
    loadClasses() {
        const savedAll = localStorage.getItem('school_classes_all');
        const savedTeachers = localStorage.getItem('school_class_teachers');
        const savedColors = localStorage.getItem('school_class_colors');
        
        if (savedAll) {
            try {
                this.ALL_CLASSES = JSON.parse(savedAll);
            } catch (error) {
                console.error('Ошибка загрузки классов:', error);
            }
        }
        
        if (savedTeachers) {
            try {
                this.CLASS_TEACHERS = JSON.parse(savedTeachers);
            } catch (error) {
                console.error('Ошибка загрузки классных руководителей:', error);
            }
        }
        
        if (savedColors) {
            try {
                this.CLASS_COLORS = JSON.parse(savedColors);
            } catch (error) {
                console.error('Ошибка загрузки цветов классов:', error);
            }
        }
    },
    
    // Инициализация
    initialize() {
        this.loadClasses();
        console.log(`Инициализирован ClassRegistry: ${this.ALL_CLASSES.length} классов`);
        return this;
    },
    
    // Сброс к дефолтным значениям
    resetToDefaults() {
        // Сбрасываем к исходным данным
        this.ALL_CLASSES = [
            // Начальная школа (1-4 классы)
            { id: '1a', name: '1А', grade: 1, building: 'primary', studentsCount: 25, parallel: 'A' },
            { id: '1b', name: '1Б', grade: 1, building: 'primary', studentsCount: 24, parallel: 'B' },
            { id: '1v', name: '1В', grade: 1, building: 'primary', studentsCount: 26, parallel: 'B' },
            
            { id: '2a', name: '2А', grade: 2, building: 'primary', studentsCount: 27, parallel: 'A' },
            { id: '2b', name: '2Б', grade: 2, building: 'primary', studentsCount: 25, parallel: 'B' },
            { id: '2v', name: '2В', grade: 2, building: 'primary', studentsCount: 26, parallel: 'B' },
            
            { id: '3a', name: '3А', grade: 3, building: 'primary', studentsCount: 28, parallel: 'A' },
            { id: '3b', name: '3Б', grade: 3, building: 'primary', studentsCount: 26, parallel: 'B' },
            { id: '3v', name: '3В', grade: 3, building: 'primary', studentsCount: 27, parallel: 'B' },
            
            { id: '4a', name: '4А', grade: 4, building: 'primary', studentsCount: 29, parallel: 'A' },
            { id: '4b', name: '4Б', grade: 4, building: 'primary', studentsCount: 27, parallel: 'B' },
            { id: '4v', name: '4В', grade: 4, building: 'primary', studentsCount: 28, parallel: 'B' },
            
            // Средняя школа (5-9 классы)
            { id: '5a', name: '5А', grade: 5, building: 'high', studentsCount: 30, parallel: 'A' },
            { id: '5b', name: '5Б', grade: 5, building: 'high', studentsCount: 28, parallel: 'B' },
            { id: '5v', name: '5В', grade: 5, building: 'high', studentsCount: 29, parallel: 'B' },
            
            { id: '6a', name: '6А', grade: 6, building: 'high', studentsCount: 31, parallel: 'A' },
            { id: '6b', name: '6Б', grade: 6, building: 'high', studentsCount: 29, parallel: 'B' },
            { id: '6v', name: '6В', grade: 6, building: 'high', studentsCount: 30, parallel: 'B' },
            
            { id: '7a', name: '7А', grade: 7, building: 'high', studentsCount: 32, parallel: 'A' },
            { id: '7b', name: '7Б', grade: 7, building: 'high', studentsCount: 30, parallel: 'B' },
            { id: '7v', name: '7В', grade: 7, building: 'high', studentsCount: 31, parallel: 'B' },
            
            { id: '8a', name: '8А', grade: 8, building: 'high', studentsCount: 33, parallel: 'A' },
            { id: '8b', name: '8Б', grade: 8, building: 'high', studentsCount: 31, parallel: 'B' },
            { id: '8v', name: '8В', grade: 8, building: 'high', studentsCount: 32, parallel: 'B' },
            
            { id: '9a', name: '9А', grade: 9, building: 'high', studentsCount: 34, parallel: 'A' },
            { id: '9b', name: '9Б', grade: 9, building: 'high', studentsCount: 32, parallel: 'B' },
            { id: '9v', name: '9В', grade: 9, building: 'high', studentsCount: 33, parallel: 'B' },
            
            // Старшая школа (10-11 классы)
            { id: '10a', name: '10А', grade: 10, building: 'high', studentsCount: 30, parallel: 'A' },
            { id: '11a', name: '11А', grade: 11, building: 'high', studentsCount: 28, parallel: 'A' }
        ];
        
        // Восстанавливаем классных руководителей
        this.CLASS_TEACHERS = {
            '1А': 'Ластовина Оксана Борисовна',
            '1Б': 'Кныш Ольга Владимировна',
            '1В': 'Лукина Надежда Ивановна',
            '2А': 'Рафальская Светлана Николаевна',
            '2Б': 'Гусакова Мария Геннадьевна',
            '2В': 'Дамирчиян Валерия Армавировна',
            '3А': 'Хилько Светлана Павловна',
            '3Б': 'Юдина Ирина Васильевна',
            '3В': 'Безуглая Маргарита Денисовна',
            '4А': 'Глазунова Татьяна Сергеевна',
            '4Б': 'Глущенко Татьяна Анатольевна',
            '4В': 'Федченко Светлана Вячеславовна'
        };
        
        // Восстанавливаем цвета
        this.CLASS_COLORS = {
            '1А': '#FF6B6B', '1Б': '#4ECDC4', '1В': '#45B7D1',
            '2А': '#96CEB4', '2Б': '#FECA57', '2В': '#FF9FF3',
            '3А': '#54A0FF', '3Б': '#5F27CD', '3В': '#00D2D3',
            '4А': '#1DD1A1', '4Б': '#FF9F43', '4В': '#EE5A24',
            '5А': '#F368E0', '5Б': '#FF9F43', '5В': '#EE5A24',
            '6А': '#00D2D3', '6Б': '#54A0FF', '6В': '#5F27CD',
            '7А': '#1DD1A1', '7Б': '#FF6B6B', '7В': '#4ECDC4',
            '8А': '#45B7D1', '8Б': '#96CEB4', '8В': '#FECA57',
            '9А': '#FF9FF3', '9Б': '#54A0FF', '9В': '#5F27CD',
            '10А': '#1DD1A1', '11А': '#FF6B6B'
        };
        
        this.saveClasses();
    }
};

// Инициализация при экспорте
ClassRegistry.initialize();