// src/frontend/config/extracurricular/activities.js

export const ActivityTypes = {
    TYPES: [
        { 
            id: "sport", 
            name: "Спорт", 
            icon: "⚽", 
            defaultColor: "#4CAF50",
            description: "Спортивные занятия и секции"
        },
        { 
            id: "art", 
            name: "Творчество", 
            icon: "🎨", 
            defaultColor: "#FF9800",
            description: "Творческие кружки и студии"
        },
        { 
            id: "science", 
            name: "Наука", 
            icon: "🔬", 
            defaultColor: "#2196F3",
            description: "Научные кружки и лаборатории"
        },
        { 
            id: "music", 
            name: "Музыка", 
            icon: "🎵", 
            defaultColor: "#9C27B0",
            description: "Музыкальные занятия и ансамбли"
        },
        { 
            id: "dance", 
            name: "Танцы", 
            icon: "💃", 
            defaultColor: "#E91E63",
            description: "Танцевальные студии и коллективы"
        },
        { 
            id: "tech", 
            name: "Технологии", 
            icon: "💻", 
            defaultColor: "#607D8B",
            description: "Технические кружки и программирование"
        },
        { 
            id: "language", 
            name: "Языки", 
            icon: "🗣️", 
            defaultColor: "#FF5722",
            description: "Языковые кружки и клубы"
        },
        { 
            id: "other", 
            name: "Другое", 
            icon: "⭐", 
            defaultColor: "#795548",
            description: "Прочие занятия"
        }
    ],
    
    getTypeById(id) {
        return this.TYPES.find(type => type.id === id);
    },
    
    getTypeByName(name) {
        return this.TYPES.find(type => type.name === name);
    },
    
    getDefaultColorForType(typeId) {
        const type = this.getTypeById(typeId);
        return type ? type.defaultColor : "#9E9E9E";
    },
    
    getAllTypes() {
        return this.TYPES;
    },
    
    getTypeNames() {
        return this.TYPES.map(type => type.name);
    },
    
    getTypeIcons() {
        return this.TYPES.reduce((acc, type) => {
            acc[type.id] = type.icon;
            return acc;
        }, {});
    }
};

export const DifficultyLevels = {
    LEVELS: [
        { 
            id: "beginner", 
            name: "Начальный", 
            description: "Для новичков, без специальной подготовки",
            icon: "🌱"
        },
        { 
            id: "intermediate", 
            name: "Средний", 
            description: "Для продолжающих, с базовыми знаниями",
            icon: "🌿"
        },
        { 
            id: "advanced", 
            name: "Продвинутый", 
            description: "Для опытных, с углубленными знаниями",
            icon: "🌳"
        },
        { 
            id: "all", 
            name: "Все уровни", 
            description: "Подходит для участников любого уровня",
            icon: "🌈"
        }
    ],
    
    getLevelById(id) {
        return this.LEVELS.find(level => level.id === id);
    },
    
    getLevelByName(name) {
        return this.LEVELS.find(level => level.name === name);
    },
    
    getAllLevels() {
        return this.LEVELS;
    },
    
    getLevelOptions() {
        return this.LEVELS.map(level => ({
            value: level.id,
            label: level.name,
            description: level.description,
            icon: level.icon
        }));
    }
};

export const ActivityAgeGroups = {
    GROUPS: [
        { 
            id: "young", 
            name: "Младшая группа", 
            ages: "7-10 лет",
            description: "Учащиеся 1-4 классов",
            icon: "👧👦"
        },
        { 
            id: "middle", 
            name: "Средняя группа", 
            ages: "11-13 лет",
            description: "Учащиеся 5-7 классов",
            icon: "👩👨"
        },
        { 
            id: "senior", 
            name: "Старшая группа", 
            ages: "14-17 лет",
            description: "Учащиеся 8-11 классов",
            icon: "🧑‍🎓"
        },
        { 
            id: "all", 
            name: "Разновозрастная", 
            ages: "7-17 лет",
            description: "Для всех возрастов",
            icon: "👨‍👩‍👧‍👦"
        }
    ],
    
    getGroupById(id) {
        return this.GROUPS.find(group => group.id === id);
    },
    
    getGroupByName(name) {
        return this.GROUPS.find(group => group.name === name);
    },
    
    getAllGroups() {
        return this.GROUPS;
    },
    
    getGroupOptions() {
        return this.GROUPS.map(group => ({
            value: group.id,
            label: `${group.name} (${group.ages})`,
            description: group.description,
            icon: group.icon
        }));
    },
    
    getGroupsForGrade(grade) {
        if (grade <= 4) return [this.getGroupById("young")];
        if (grade <= 7) return [this.getGroupById("middle")];
        if (grade <= 11) return [this.getGroupById("senior")];
        return [this.getGroupById("all")];
    }
};