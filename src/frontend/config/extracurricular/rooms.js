// src/frontend/config/extracurricular/rooms.js

export const RoomRegistry = {
    // Старшая школа (основное здание)
    HIGH_SCHOOL_ROOMS: [
        "Каб. 9",
        "Каб. 10",
        "Каб. 11",
        "Каб. 12",
        "Каб. 14",
        "Каб. 15",
        "Каб. 20",
        "Каб. 22",
        "Каб. 25",
        "Каб. 26",
        "Каб. 29",
        "Каб. 30",
        "Каб. 31",
        "Каб. 32",
        "Каб. 33",
        "Каб. 34",
        "Каб. 35",
        "Каб. 38",
        "Каб. 39",
        "Каб. 40",
        "Каб. 41",
        "Спортзал"
    ],
    
    // Начальная школа (отдельное здание)
    PRIMARY_SCHOOL_ROOMS: [
        "Каб. 1",
        "Каб. 2",
        "Каб. 3",
        "Каб. 4",
        "Каб. 5",
        "Каб. 6",
        "Спортзал"
    ],
    
    // Все кабинеты (для обратной совместимости)
    get DEFAULT_ROOMS() {
        return [...this.HIGH_SCHOOL_ROOMS, ...this.PRIMARY_SCHOOL_ROOMS];
    },
    
    // Типы помещений
    ROOM_TYPES: {
        CLASSROOM: "Кабинет",
        PRIMARY_CLASSROOM: "Кабинет (нач. школа)",
        HIGH_SCHOOL_CLASSROOM: "Кабинет (ст. школа)",
        GYM: "Спортзал",
        
    },
    
    // Определение типа помещения
    getRoomType(roomName) {
        if (roomName.includes('Спорт')) return this.ROOM_TYPES.GYM;
        if (this.PRIMARY_SCHOOL_ROOMS.includes(roomName)) return this.ROOM_TYPES.PRIMARY_CLASSROOM;
        if (this.HIGH_SCHOOL_ROOMS.includes(roomName)) return this.ROOM_TYPES.HIGH_SCHOOL_CLASSROOM;
        return this.ROOM_TYPES.CLASSROOM;
    },
    
    // Получение здания по номеру кабинета
    getBuildingByRoom(room) {
        if (this.PRIMARY_SCHOOL_ROOMS.includes(room)) return 'primarySchool';
        if (this.HIGH_SCHOOL_ROOMS.includes(room)) return 'highSchool';
        return 'unknown';
    },
    
    // Получение номера кабинета
    getRoomNumber(room) {
        const match = room.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    },
    
    // Кабинет по умолчанию в зависимости от занятия и здания
    getDefaultRoom(title, building = 'highSchool') {
        const highSchoolMap = {
            "Шахматный клуб": "Каб. 30",
            "Рисование": "Каб. 20",
            "Спортивная гимнастика": "Спортзал",
            "Программирование": "Каб. 30",
            "Хор": "Каб. 9",
            "Танцы": "Спортзал",
            "Футбол": "Спортзал",
            "Театр": "Каб. 9",
            "Робототехника": "Каб. 30",
            "Вокал": "Каб. 9",
            "Йога": "Спортзал",
            "Шитье": "Каб. 41",
            "Кулинария": "Каб. 41",
            "Фотография": "Каб. 20",
            "Математика": "Каб. 29",
            "Физика": "Каб. 35",
            "Химия": "Каб. 38",
            "Биология": "Каб. 39"
        };
        
        const primarySchoolMap = {
            "Шахматный клуб": "Каб. 6",
            "Рисование": "Каб. 6",
            "Спортивная гимнастика": "Спортзал",
            "Танцы": "Спортзал",
            "Театр": "Каб. 6",
            "Йога": "Спортзал",
            "Шитье": "Каб. 6",
            "Кулинария": "Каб. 6",
            "Математика": "Каб. 3",
            "Русский язык": "Каб. 2",
            "Чтение": "Каб. 1"
        };
        
        if (building === 'primarySchool') {
            return primarySchoolMap[title] || "Каб. 1";
        }
        return highSchoolMap[title] || "Каб. 9";
    },
    
    // Автоматическое определение здания по названию занятия
    detectBuildingByActivity(title) {
        const primarySchoolActivities = [
            "Чтение", "Письмо", "Развитие речи", "Окружающий мир",
            "Мир вокруг нас", "Математика (начальная)"
        ];
        
        const lowerTitle = title.toLowerCase();
        
        if (primarySchoolActivities.some(activity => 
            lowerTitle.includes(activity.toLowerCase()))) {
            return 'primarySchool';
        }
        
        if (lowerTitle.includes('начальн') || lowerTitle.includes('младш')) {
            return 'primarySchool';
        }
        
        return 'highSchool';
    },
    
    // Добавление нового кабинета
    addRoom(room, building = 'highSchool') {
        let roomList;
        
        if (building === 'primarySchool') {
            roomList = this.PRIMARY_SCHOOL_ROOMS;
        } else {
            roomList = this.HIGH_SCHOOL_ROOMS;
        }
        
        if (room && !roomList.includes(room)) {
            roomList.push(room);
            this.saveRooms();
            return true;
        }
        return false;
    },
    
    // Удаление кабинета
    removeRoom(room) {
        let removed = false;
        
        const highIndex = this.HIGH_SCHOOL_ROOMS.indexOf(room);
        if (highIndex > -1) {
            this.HIGH_SCHOOL_ROOMS.splice(highIndex, 1);
            removed = true;
        }
        
        const primaryIndex = this.PRIMARY_SCHOOL_ROOMS.indexOf(room);
        if (primaryIndex > -1) {
            this.PRIMARY_SCHOOL_ROOMS.splice(primaryIndex, 1);
            removed = true;
        }
        
        if (removed) {
            this.saveRooms();
        }
        return removed;
    },
    
    // Поиск кабинетов
    searchRooms(query, building = 'all') {
        const lowerQuery = query.toLowerCase();
        let roomsToSearch = [];
        
        if (building === 'primarySchool') {
            roomsToSearch = this.PRIMARY_SCHOOL_ROOMS;
        } else if (building === 'highSchool') {
            roomsToSearch = this.HIGH_SCHOOL_ROOMS;
        } else {
            roomsToSearch = this.DEFAULT_ROOMS;
        }
        
        return roomsToSearch.filter(room => 
            room.toLowerCase().includes(lowerQuery)
        );
    },
    
    // Получение кабинетов по типу
    getRoomsByType(type) {
        switch (type) {
            case this.ROOM_TYPES.CLASSROOM:
                return this.DEFAULT_ROOMS.filter(room => room.startsWith('Каб.'));
            case this.ROOM_TYPES.PRIMARY_CLASSROOM:
                return this.PRIMARY_SCHOOL_ROOMS;
            case this.ROOM_TYPES.HIGH_SCHOOL_CLASSROOM:
                return this.HIGH_SCHOOL_ROOMS.filter(room => room.startsWith('Каб.'));
            case this.ROOM_TYPES.GYM:
                return this.DEFAULT_ROOMS.filter(room => 
                    room.includes('Спорт') || room.toLowerCase().includes('зал'));
            case this.ROOM_TYPES.HALL:
                return this.DEFAULT_ROOMS.filter(room => 
                    room.includes('зал') || room.includes('Зал'));
            default:
                return this.DEFAULT_ROOMS;
        }
    },
    
    // Сортировка кабинетов
    sortRooms() {
        // Сортировка кабинетов начальной школы
        this.PRIMARY_SCHOOL_ROOMS.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.match(/\d+/)?.[0] || 0);
            return numA - numB;
        });
        
        // Сортировка кабинетов старшей школы
        this.HIGH_SCHOOL_ROOMS.sort((a, b) => {
            // Спортзал всегда в конце
            if (a.includes('Спорт')) return 1;
            if (b.includes('Спорт')) return -1;
            
            const numA = parseInt(a.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.match(/\d+/)?.[0] || 0);
            return numA - numB;
        });
    },
    
    // Получение всех кабинетов с информацией о здании
    getAllRoomsWithBuilding() {
        return [
            ...this.PRIMARY_SCHOOL_ROOMS.map(room => ({ 
                room, 
                building: 'Начальная школа',
                type: this.getRoomType(room),
                number: this.getRoomNumber(room)
            })),
            ...this.HIGH_SCHOOL_ROOMS.map(room => ({ 
                room, 
                building: 'Старшая школа',
                type: this.getRoomType(room),
                number: this.getRoomNumber(room)
            }))
        ];
    },
    
    // Получение кабинетов для select опций
    getRoomOptions(building = 'all') {
        const rooms = this.getAllRoomsWithBuilding()
            .filter(item => building === 'all' || 
                (building === 'primarySchool' && item.building === 'Начальная школа') ||
                (building === 'highSchool' && item.building === 'Старшая школа'))
            .sort((a, b) => {
                if (a.number === null) return 1;
                if (b.number === null) return -1;
                return a.number - b.number;
            });
        
        return rooms.map(item => ({
            value: item.room,
            label: `${item.room} (${item.building})`,
            building: item.building
        }));
    },
    
    // Сохранение в localStorage
    saveRooms() {
        this.sortRooms();
        localStorage.setItem('extracurricular_highSchoolRooms', JSON.stringify(this.HIGH_SCHOOL_ROOMS));
        localStorage.setItem('extracurricular_primarySchoolRooms', JSON.stringify(this.PRIMARY_SCHOOL_ROOMS));
    },
    
    // Загрузка из localStorage
    loadRooms() {
        const savedHigh = localStorage.getItem('extracurricular_highSchoolRooms');
        const savedPrimary = localStorage.getItem('extracurricular_primarySchoolRooms');
        
        if (savedHigh) {
            try {
                const rooms = JSON.parse(savedHigh);
                rooms.forEach(room => {
                    if (!this.HIGH_SCHOOL_ROOMS.includes(room)) {
                        this.HIGH_SCHOOL_ROOMS.push(room);
                    }
                });
            } catch (error) {
                console.error('Ошибка загрузки кабинетов старшей школы:', error);
            }
        }
        
        if (savedPrimary) {
            try {
                const rooms = JSON.parse(savedPrimary);
                rooms.forEach(room => {
                    if (!this.PRIMARY_SCHOOL_ROOMS.includes(room)) {
                        this.PRIMARY_SCHOOL_ROOMS.push(room);
                    }
                });
            } catch (error) {
                console.error('Ошибка загрузки кабинетов начальной школы:', error);
            }
        }
        
        this.sortRooms();
    },
    
    // Инициализация
    initialize() {
        this.loadRooms();
        return this;
    },
    
    // Сброс к дефолтным значениям
    resetToDefaults() {
        this.HIGH_SCHOOL_ROOMS = [
            "Каб. 9", "Каб. 10", "Каб. 11", "Каб. 12", "Каб. 14", "Каб. 15",
            "Каб. 20", "Каб. 22", "Каб. 25", "Каб. 26", "Каб. 29", "Каб. 30",
            "Каб. 31", "Каб. 32", "Каб. 33", "Каб. 34", "Каб. 35", "Каб. 38",
            "Каб. 39", "Каб. 40", "Каб. 41", "Спортзал"
        ];
        
        this.PRIMARY_SCHOOL_ROOMS = [
            "Каб. 1", "Каб. 2", "Каб. 3", "Каб. 4", "Каб. 5", "Каб. 6"
        ];
        
        this.saveRooms();
    }
};

// Инициализация при экспорте
RoomRegistry.initialize();