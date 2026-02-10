// src/frontend/config/extracurricular/teachers.js

export const TeacherRegistry = {
    // Учителя начальной школы (1-4 классы) - Классные руководители
    PRIMARY_SCHOOL_TEACHERS: [
        "Ластовина Оксана Борисовна",
        "Кныш Ольга Владимировна",
        "Лукина Надежда Ивановна",
        "Рафальская Светлана Николаевна",
        "Гусакова Мария Геннадьевна",
        "Дамирчиян Валерия Армавировна",
        "Хилько Светлана Павловна",
        "Юдина Ирина Васильевна",
        "Безуглая Маргарита Денисовна",
        "Глазунова Татьяна Сергеевна",
        "Глущенко Татьяна Анатольевна",
        "Федченко Светлана Вячеславовна"
    ],
    
    // Учителя средней и старшей школы (5-11 классы)
    HIGH_SCHOOL_TEACHERS: [
        "Кириллова Вера Ивановна",
        "Камфорина Елена Сергеевна",
        "Корницкая Ольга Александровна",
        "Козубовская Татьяна Александровна",
        "Семенова Ирина Владимировна",
        "Соломка Евгения Анатольевна",
        "Мархотка Юлия Эдуардовна",
        "Олейникова Светлана Викторовна",
        "Пухова Дина Григорьевна",
        "Оленева Алина Дмитриевна",
        "Хилько София Андреевна",
        "Багдиян Тамара Оганесовна",
        "Головко Ирина Александровна",
        "Кутукова Оксана Николаевна",
        "Медведовская Ирина Владимировна",
        "Хохлова Евгения Валерьевна",
        "Дружинин Евгений Владимирович",
        "Липка Роман Владимирович",
        "Кардаильский Дмитрий Дмитриевич",
        "Мурзагалиева Диана Сергеевна",
        "Олейник Татьяна Васильевна",
        "Шуваева Елена Витальевна",
        "Балабаева Екатерина Игоревна",
        "Голенковская Елена Александровна",
        "Казакова Марина Сергеевна",
        "Дружинина Анастасия Анатольевна",
        "Ашифина Марина Александровна",
        "Глущенко Олег Александрович",
        "Крайванова Наталья Викторовна",
        "Юрченко Татьяна Дмитриевна",
        "Глущенко Ангелина Денисовна",
        "Хентонен Сергей Вячеславович",
        "Титаренко Марина Николаевна",
        "Воронин Михаил Владимирович",
        "Балабаева Нина Ивановна",
        "Горчукова Снежана Петровна"
    ],
    
    // Все учителя (для обратной совместимости)
    get TEACHERS() {
        return [...this.PRIMARY_SCHOOL_TEACHERS, ...this.HIGH_SCHOOL_TEACHERS];
    },
    
    // Предметы каждого учителя (словарь)
    TEACHER_SUBJECTS: {
        // Русский язык и литература
        "Кириллова Вера Ивановна": ["Русский язык", "Литература"],
        "Камфорина Елена Сергеевна": ["Русский язык", "Литература", "Литературная мастерская"],
        "Корницкая Ольга Александровна": ["Русский язык", "Литература"],
        "Козубовская Татьяна Александровна": ["Русский язык", "Литература"],
        "Семенова Ирина Владимировна": ["Русский язык", "Литература"],
        "Соломка Евгения Анатольевна": ["Русский язык", "Литература", "Русское правописание: орфография и пунктуация"],
        
        // Математика
        "Мархотка Юлия Эдуардовна": ["Математика"],
        "Олейникова Светлана Викторовна": ["Математика"],
        "Пухова Дина Григорьевна": ["Математика", "Практикум по геометрии"],
        "Оленева Алина Дмитриевна": ["Математика"],
        "Хилько София Андреевна": ["Математика"],
        
        // Английский язык
        "Багдиян Тамара Оганесовна": ["Английский язык"],
        "Головко Ирина Александровна": ["Английский язык"],
        "Кутукова Оксана Николаевна": ["Английский язык"],
        "Медведовская Ирина Владимировна": ["Английский язык"],
        "Хохлова Евгения Валерьевна": ["Английский язык"],
        
        // Физическая культура
        "Дружинин Евгений Владимирович": ["Физическая культура"],
        "Липка Роман Владимирович": ["Физическая культура"],
        "Кардаильский Дмитрий Дмитриевич": ["Физическая культура"],
        "Мурзагалиева Диана Сергеевна": ["Физическая культура"],
        
        // География
        "Олейник Татьяна Васильевна": ["География"],
        "Шуваева Елена Витальевна": ["География", "Экологический образ жизни", "Я географ"],
        
        // Биология и химия
        "Балабаева Екатерина Игоревна": ["Биология", "Современные агробиотехнологии", "Основы растениеводства"],
        "Голенковская Елена Александровна": ["Биология", "Химия"],
        
        // История и обществознание
        "Казакова Марина Сергеевна": ["История", "Обществознание"],
        "Дружинина Анастасия Анатольевна": ["История", "Обществознание"],
        "Ашифина Марина Александровна": ["История", "Обществознание"],
        "Глущенко Олег Александрович": ["История"],
        
        // Индивидуальный проект
        "Крайванова Наталья Викторовна": ["Индивидуальный проект"],
        
        // Физика
        "Юрченко Татьяна Дмитриевна": ["Физика"],
        "Глущенко Ангелина Денисовна": ["Физика"],
        
        // Физика и информатика
        "Хентонен Сергей Вячеславович": ["Физика", "Информатика", "Компьютерное проектирование", "Черчение"],
        
        // Труд
        "Титаренко Марина Николаевна": ["Труд"],
        
        // ОБЖ
        "Воронин Михаил Владимирович": ["ОБЖ"],
        
        // ИЗО и музыка
        "Балабаева Нина Ивановна": ["Изобразительное искусство"],
        "Горчукова Снежана Петровна": ["Музыка"],
        
        // Начальная школа (универсальные)
        "Ластовина Оксана Борисовна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд"],
        "Кныш Ольга Владимировна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд"],
        "Лукина Надежда Ивановна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд"],
        "Рафальская Светлана Николаевна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд"],
        "Гусакова Мария Геннадьевна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд"],
        "Дамирчиян Валерия Армавировна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд"],
        "Хилько Светлана Павловна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд"],
        "Юдина Ирина Васильевна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд"],
        "Безуглая Маргарита Денисовна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд"],
        "Глазунова Татьяна Сергеевна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд", "ОРКСЭ"],
        "Глущенко Татьяна Анатольевна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд", "ОРКСЭ"],
        "Федченко Светлана Вячеславовна": ["Русский язык", "Литературное чтение", "Математика", "Окружающий мир", "Изобразительное искусство", "Труд", "ОРКСЭ"]
    },
    
    // Категории предметов
    SUBJECT_CATEGORIES: {
        RUSSIAN: "Русский язык и литература",
        MATH: "Математика",
        ENGLISH: "Иностранные языки",
        PHYSICAL_ED: "Физическая культура",
        GEOGRAPHY: "География",
        BIOLOGY: "Биология",
        CHEMISTRY: "Химия",
        HISTORY: "История",
        SOCIAL_STUDIES: "Обществознание",
        PHYSICS: "Физика",
        COMPUTER_SCIENCE: "Информатика",
        TECHNOLOGY: "Технология",
        ART: "Искусство",
        MUSIC: "Музыка",
        PRIMARY: "Начальные классы",
        PROJECT: "Проектная деятельность"
    },
    
    // Группировка учителей по предметным областям
    TEACHER_CATEGORIES: {
        RUSSIAN_LANGUAGE: [
            "Кириллова Вера Ивановна",
            "Камфорина Елена Сергеевна",
            "Корницкая Ольга Александровна",
            "Козубовская Татьяна Александровна",
            "Семенова Ирина Владимировна",
            "Соломка Евгения Анатольевна"
        ],
        MATHEMATICS: [
            "Мархотка Юлия Эдуардовна",
            "Олейникова Светлана Викторовна",
            "Пухова Дина Григорьевна",
            "Оленева Алина Дмитриевна",
            "Хилько София Андреевна"
        ],
        ENGLISH: [
            "Багдиян Тамара Оганесовна",
            "Головко Ирина Александровна",
            "Кутукова Оксана Николаевна",
            "Медведовская Ирина Владимировна",
            "Хохлова Евгения Валерьевна"
        ],
        PHYSICAL_EDUCATION: [
            "Дружинин Евгений Владимирович",
            "Липка Роман Владимирович",
            "Кардаильский Дмитрий Дмитриевич",
            "Мурзагалиева Диана Сергеевна"
        ],
        SCIENCE: [
            "Олейник Татьяна Васильевна",
            "Шуваева Елена Витальевна",
            "Балабаева Екатерина Игоревна",
            "Голенковская Елена Александровна",
            "Юрченко Татьяна Дмитриевна",
            "Глущенко Ангелина Денисовна",
            "Хентонен Сергей Вячеславович"
        ],
        HUMANITIES: [
            "Казакова Марина Сергеевна",
            "Дружинина Анастасия Анатольевна",
            "Ашифина Марина Александровна",
            "Глущенко Олег Александрович"
        ],
        ARTS: [
            "Титаренко Марина Николаевна",
            "Балабаева Нина Ивановна",
            "Горчукова Снежана Петровна"
        ],
        PRIMARY_SCHOOL: [
            "Ластовина Оксана Борисовна",
            "Кныш Ольга Владимировна",
            "Лукина Надежда Ивановна",
            "Рафальская Светлана Николаевна",
            "Гусакова Мария Геннадьевна",
            "Дамирчиян Валерия Армавировна",
            "Хилько Светлана Павловна",
            "Юдина Ирина Васильевна",
            "Безуглая Маргарита Денисовна",
            "Глазунова Татьяна Сергеевна",
            "Глущенко Татьяна Анатольевна",
            "Федченко Светлана Вячеславовна"
        ],
        OTHER: [
            "Воронин Михаил Владимирович",
            "Крайванова Наталья Викторовна"
        ]
    },
    
    // Методы для работы с данными
    
    // Получение предметов учителя
    getTeacherSubjects(teacherName) {
        return this.TEACHER_SUBJECTS[teacherName] || [];
    },
    
    // Получение учителей по предмету
    getTeachersBySubject(subject) {
        return this.TEACHERS.filter(teacher => 
            this.TEACHER_SUBJECTS[teacher]?.includes(subject)
        );
    },
    
    // Получение учителей по категории
    getTeachersByCategory(category) {
        return this.TEACHER_CATEGORIES[category] || [];
    },
    
    // Получение категории учителя
    getTeacherCategory(teacherName) {
        for (const [category, teachers] of Object.entries(this.TEACHER_CATEGORIES)) {
            if (teachers.includes(teacherName)) {
                return category;
            }
        }
        return 'OTHER';
    },
    
    // Определение здания по учителю
    getTeacherBuilding(teacherName) {
        if (this.PRIMARY_SCHOOL_TEACHERS.includes(teacherName)) {
            return 'primary';
        }
        if (this.HIGH_SCHOOL_TEACHERS.includes(teacherName)) {
            return 'high';
        }
        return 'unknown';
    },
    
    // Добавление учителя
    addTeacher(teacher, subjects = [], category = null) {
        if (teacher && !this.TEACHERS.includes(teacher)) {
            this.TEACHERS.push(teacher);
            
            // Определяем здание по категории или предметам
            const building = category === 'PRIMARY_SCHOOL' ? 'primary' : 'high';
            if (building === 'primary') {
                this.PRIMARY_SCHOOL_TEACHERS.push(teacher);
            } else {
                this.HIGH_SCHOOL_TEACHERS.push(teacher);
            }
            
            // Сохраняем предметы
            if (subjects.length > 0) {
                this.TEACHER_SUBJECTS[teacher] = subjects;
            }
            
            // Сохраняем категорию
            if (category && this.TEACHER_CATEGORIES[category]) {
                this.TEACHER_CATEGORIES[category].push(teacher);
            }
            
            this.saveTeachers();
            return true;
        }
        return false;
    },
    
    // Удаление учителя
    removeTeacher(teacher) {
        const index = this.TEACHERS.indexOf(teacher);
        if (index > -1) {
            this.TEACHERS.splice(index, 1);
            
            // Удаляем из списка начальной школы
            const primaryIndex = this.PRIMARY_SCHOOL_TEACHERS.indexOf(teacher);
            if (primaryIndex > -1) {
                this.PRIMARY_SCHOOL_TEACHERS.splice(primaryIndex, 1);
            }
            
            // Удаляем из списка старшей школы
            const highIndex = this.HIGH_SCHOOL_TEACHERS.indexOf(teacher);
            if (highIndex > -1) {
                this.HIGH_SCHOOL_TEACHERS.splice(highIndex, 1);
            }
            
            // Удаляем предметы
            delete this.TEACHER_SUBJECTS[teacher];
            
            // Удаляем из категорий
            for (const [category, teachers] of Object.entries(this.TEACHER_CATEGORIES)) {
                const catIndex = teachers.indexOf(teacher);
                if (catIndex > -1) {
                    this.TEACHER_CATEGORIES[category].splice(catIndex, 1);
                }
            }
            
            this.saveTeachers();
            return true;
        }
        return false;
    },
    
    // Обновление учителя
    updateTeacher(oldName, newName, subjects = null, category = null) {
        if (!this.TEACHERS.includes(oldName)) return false;
        
        const oldSubjects = this.TEACHER_SUBJECTS[oldName] || [];
        const oldBuilding = this.getTeacherBuilding(oldName);
        
        // Удаляем старого
        this.removeTeacher(oldName);
        
        // Добавляем нового
        this.addTeacher(
            newName,
            subjects || oldSubjects,
            category || this.getTeacherCategory(oldName)
        );
        
        return true;
    },
    
    // Поиск учителей
    searchTeachers(query, category = null) {
        const lowerQuery = query.toLowerCase();
        let teachersToSearch = category ? this.getTeachersByCategory(category) : this.TEACHERS;
        
        return teachersToSearch.filter(teacher => {
            const matchesName = teacher.toLowerCase().includes(lowerQuery);
            const matchesSubjects = this.getTeacherSubjects(teacher).some(subject =>
                subject.toLowerCase().includes(lowerQuery)
            );
            return matchesName || matchesSubjects;
        });
    },
    
    // Получение учителей для select опций
    getTeacherOptions(building = 'all', subject = null) {
        let teachers = this.TEACHERS;
        
        // Фильтр по зданию
        if (building === 'primary') {
            teachers = this.PRIMARY_SCHOOL_TEACHERS;
        } else if (building === 'high') {
            teachers = this.HIGH_SCHOOL_TEACHERS;
        }
        
        // Фильтр по предмету
        if (subject) {
            teachers = teachers.filter(teacher => 
                this.getTeacherSubjects(teacher).includes(subject)
            );
        }
        
        return teachers
            .sort((a, b) => a.localeCompare(b))
            .map(teacher => ({
                value: teacher,
                label: teacher,
                building: this.getTeacherBuilding(teacher),
                subjects: this.getTeacherSubjects(teacher),
                category: this.getTeacherCategory(teacher)
            }));
    },
    
    // Получение всех предметов
    getAllSubjects() {
        const subjects = new Set();
        Object.values(this.TEACHER_SUBJECTS).forEach(teacherSubjects => {
            teacherSubjects.forEach(subject => subjects.add(subject));
        });
        return Array.from(subjects).sort();
    },
    
    // Получение статистики
    getTeacherStatistics() {
        return {
            total: this.TEACHERS.length,
            primarySchool: this.PRIMARY_SCHOOL_TEACHERS.length,
            highSchool: this.HIGH_SCHOOL_TEACHERS.length,
            byCategory: Object.keys(this.TEACHER_CATEGORIES).reduce((acc, category) => {
                acc[category] = this.TEACHER_CATEGORIES[category].length;
                return acc;
            }, {}),
            uniqueSubjects: this.getAllSubjects().length
        };
    },
    
    // Сортировка учителей
    sortTeachers() {
        this.PRIMARY_SCHOOL_TEACHERS.sort((a, b) => a.localeCompare(b));
        this.HIGH_SCHOOL_TEACHERS.sort((a, b) => a.localeCompare(b));
        this.TEACHERS.sort((a, b) => a.localeCompare(b));
    },
    
    // Сохранение в localStorage
    saveTeachers() {
        this.sortTeachers();
        localStorage.setItem('school_teachers_all', JSON.stringify(this.TEACHERS));
        localStorage.setItem('school_teachers_primary', JSON.stringify(this.PRIMARY_SCHOOL_TEACHERS));
        localStorage.setItem('school_teachers_high', JSON.stringify(this.HIGH_SCHOOL_TEACHERS));
        localStorage.setItem('school_teacher_subjects', JSON.stringify(this.TEACHER_SUBJECTS));
    },
    
    // Загрузка из localStorage
    loadTeachers() {
        const savedAll = localStorage.getItem('school_teachers_all');
        const savedPrimary = localStorage.getItem('school_teachers_primary');
        const savedHigh = localStorage.getItem('school_teachers_high');
        const savedSubjects = localStorage.getItem('school_teacher_subjects');
        
        if (savedAll) {
            try {
                const teachers = JSON.parse(savedAll);
                this.TEACHERS.length = 0;
                this.TEACHERS.push(...teachers);
            } catch (error) {
                console.error('Ошибка загрузки всех учителей:', error);
            }
        }
        
        if (savedPrimary) {
            try {
                const teachers = JSON.parse(savedPrimary);
                this.PRIMARY_SCHOOL_TEACHERS.length = 0;
                this.PRIMARY_SCHOOL_TEACHERS.push(...teachers);
            } catch (error) {
                console.error('Ошибка загрузки учителей начальной школы:', error);
            }
        }
        
        if (savedHigh) {
            try {
                const teachers = JSON.parse(savedHigh);
                this.HIGH_SCHOOL_TEACHERS.length = 0;
                this.HIGH_SCHOOL_TEACHERS.push(...teachers);
            } catch (error) {
                console.error('Ошибка загрузки учителей старшей школы:', error);
            }
        }
        
        if (savedSubjects) {
            try {
                this.TEACHER_SUBJECTS = JSON.parse(savedSubjects);
            } catch (error) {
                console.error('Ошибка загрузки предметов учителей:', error);
            }
        }
        
        this.sortTeachers();
    },
    
    // Инициализация
    initialize() {
        this.loadTeachers();
        console.log(`Инициализирован TeacherRegistry: ${this.TEACHERS.length} учителей`);
        return this;
    },
    
    // Сброс к дефолтным значениям
    resetToDefaults() {
        // Сбрасываем данные к исходным (из кода выше)
        this.TEACHERS = [
            "Кириллова Вера Ивановна",
            "Камфорина Елена Сергеевна",
            "Корницкая Ольга Александровна",
            "Козубовская Татьяна Александровна",
            "Семенова Ирина Владимировна",
            "Соломка Евгения Анатольевна",
            "Мархотка Юлия Эдуардовна",
            "Олейникова Светлана Викторовна",
            "Пухова Дина Григорьевна",
            "Оленева Алина Дмитриевна",
            "Хилько София Андреевна",
            "Багдиян Тамара Оганесовна",
            "Головко Ирина Александровна",
            "Кутукова Оксана Николаевна",
            "Медведовская Ирина Владимировна",
            "Хохлова Евгения Валерьевна",
            "Дружинин Евгений Владимирович",
            "Липка Роман Владимирович",
            "Кардаильский Дмитрий Дмитриевич",
            "Мурзагалиева Диана Сергеевна",
            "Олейник Татьяна Васильевна",
            "Шуваева Елена Витальевна",
            "Балабаева Екатерина Игоревна",
            "Голенковская Елена Александровна",
            "Казакова Марина Сергеевна",
            "Дружинина Анастасия Анатольевна",
            "Ашифина Марина Александровна",
            "Глущенко Олег Александрович",
            "Крайванова Наталья Викторовна",
            "Юрченко Татьяна Дмитриевна",
            "Глущенко Ангелина Денисовна",
            "Хентонен Сергей Вячеславович",
            "Титаренко Марина Николаевна",
            "Воронин Михаил Владимирович",
            "Балабаева Нина Ивановна",
            "Горчукова Снежана Петровна",
            "Ластовина Оксана Борисовна",
            "Кныш Ольга Владимировна",
            "Лукина Надежда Ивановна",
            "Рафальская Светлана Николаевна",
            "Гусакова Мария Геннадьевна",
            "Дамирчиян Валерия Армавировна",
            "Хилько Светлана Павловна",
            "Юдина Ирина Васильевна",
            "Безуглая Маргарита Денисовна",
            "Глазунова Татьяна Сергеевна",
            "Глущенко Татьяна Анатольевна",
            "Федченко Светлана Вячеславовна"
        ];
        
        // Восстанавливаем TEACHER_SUBJECTS из кода выше
        // (полный словарь должен быть определен в коде)
        
        this.PRIMARY_SCHOOL_TEACHERS = this.TEACHERS.filter(teacher => 
            this.getTeacherBuilding(teacher) === 'primary'
        );
        
        this.HIGH_SCHOOL_TEACHERS = this.TEACHERS.filter(teacher => 
            this.getTeacherBuilding(teacher) === 'high'
        );
        
        this.saveTeachers();
    }
};

// Инициализация при экспорте
TeacherRegistry.initialize();