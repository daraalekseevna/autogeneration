// src/frontend/config/extracurricular/colors.js

export const ColorPalette = {
    // Основные пастельные цвета
    PASTEL_COLORS: [
        { name: "Розовый", value: "#FFB6C1", category: "pastel", building: "both" },
        { name: "Мятный", value: "#98FB98", category: "pastel", building: "both" },
        { name: "Лавандовый", value: "#E6E6FA", category: "pastel", building: "both" },
        { name: "Персиковый", value: "#FFDAB9", category: "pastel", building: "both" },
        { name: "Голубой", value: "#ADD8E6", category: "pastel", building: "both" },
        { name: "Сиреневый", value: "#D8BFD8", category: "pastel", building: "both" },
        { name: "Аквамарин", value: "#7FFFD4", category: "bright", building: "both" },
        { name: "Салатовый", value: "#C1FFC1", category: "bright", building: "both" },
        { name: "Коралловый", value: "#FF7F50", category: "bright", building: "both" },
        { name: "Лазурный", value: "#87CEEB", category: "bright", building: "both" },
        { name: "Сливовый", value: "#DDA0DD", category: "deep", building: "both" },
        { name: "Желтый", value: "#FFFACD", category: "pastel", building: "both" },
        { name: "Бирюзовый", value: "#40E0D0", category: "bright", building: "both" },
        { name: "Розово-лавандовый", value: "#F0B6FF", category: "pastel", building: "both" },
        { name: "Светло-оранжевый", value: "#FFD8A0", category: "pastel", building: "both" }
    ],
    
    // Цвета для начальной школы (более яркие)
    PRIMARY_SCHOOL_COLORS: [
        { name: "Ярко-розовый", value: "#FF69B4", category: "primary", building: "primary" },
        { name: "Ярко-зеленый", value: "#32CD32", category: "primary", building: "primary" },
        { name: "Ярко-синий", value: "#1E90FF", category: "primary", building: "primary" },
        { name: "Ярко-желтый", value: "#FFD700", category: "primary", building: "primary" },
        { name: "Ярко-оранжевый", value: "#FF8C00", category: "primary", building: "primary" }
    ],
    
    // Цвета для старшей школы (более спокойные)
    HIGH_SCHOOL_COLORS: [
        { name: "Темно-синий", value: "#4169E1", category: "high", building: "high" },
        { name: "Темно-зеленый", value: "#228B22", category: "high", building: "high" },
        { name: "Бордовый", value: "#8B0000", category: "high", building: "high" },
        { name: "Темно-фиолетовый", value: "#4B0082", category: "high", building: "high" },
        { name: "Серо-голубой", value: "#4682B4", category: "high", building: "high" }
    ],
    
    // Получение всех цветов
    getAllColors(building = 'both') {
        const allColors = [
            ...this.PASTEL_COLORS,
            ...this.PRIMARY_SCHOOL_COLORS,
            ...this.HIGH_SCHOOL_COLORS
        ];
        
        if (building === 'both') return allColors;
        return allColors.filter(color => color.building === 'both' || color.building === building);
    },
    
    // Цвет по умолчанию
    getDefaultColor(building = 'highSchool') {
        if (building === 'primarySchool') {
            return this.PRIMARY_SCHOOL_COLORS[0].value;
        }
        return this.PASTEL_COLORS[0].value;
    },
    
    // Поиск цвета по значению
    findColorByValue(value) {
        return this.getAllColors().find(color => color.value === value);
    },
    
    // Получение цветов по категории
    getColorsByCategory(category) {
        return this.getAllColors().filter(color => color.category === category);
    },
    
    // Получение цветов для определенного здания
    getColorsForBuilding(building) {
        return this.getAllColors(building);
    },
    
    // Добавление пользовательского цвета
    addCustomColor(name, value, building = 'both', category = "custom") {
        const newColor = { 
            name, 
            value: value.toUpperCase(), 
            category,
            building 
        };
        
        // Проверка на дубликат
        if (!this.findColorByValue(newColor.value)) {
            this.PASTEL_COLORS.push(newColor);
            this.saveCustomColors();
            return newColor;
        }
        return null;
    },
    
    // Удаление пользовательского цвета
    removeColor(value) {
        const index = this.PASTEL_COLORS.findIndex(color => 
            color.value === value && color.category === "custom"
        );
        
        if (index > -1) {
            this.PASTEL_COLORS.splice(index, 1);
            this.saveCustomColors();
            return true;
        }
        return false;
    },
    
    // Сохранение пользовательских цветов
    saveCustomColors() {
        const customColors = this.PASTEL_COLORS.filter(color => color.category === "custom");
        localStorage.setItem('extracurricular_customColors', JSON.stringify(customColors));
    },
    
    // Загрузка пользовательских цветов
    loadCustomColors() {
        const saved = localStorage.getItem('extracurricular_customColors');
        if (saved) {
            try {
                const customColors = JSON.parse(saved);
                customColors.forEach(color => {
                    if (!this.findColorByValue(color.value)) {
                        this.PASTEL_COLORS.push(color);
                    }
                });
            } catch (error) {
                console.error('Ошибка загрузки пользовательских цветов:', error);
            }
        }
    },
    
    // Получение цветов для отображения (с учетом здания)
    getVisibleColors(building = 'both', showAll = false, limit = 5) {
        const colors = this.getAllColors(building);
        return showAll ? colors : colors.slice(0, limit);
    },
    
    // Получение цветов для select опций
    getColorOptions(building = 'both') {
        return this.getAllColors(building).map(color => ({
            value: color.value,
            label: `${color.name} (${color.value})`,
            building: color.building,
            color: color.value
        }));
    },
    
    // Инициализация
    initialize() {
        this.loadCustomColors();
        return this;
    },
    
    // Сброс к дефолтным значениям
    resetToDefaults() {
        this.PASTEL_COLORS = [
            { name: "Розовый", value: "#FFB6C1", category: "pastel", building: "both" },
            { name: "Мятный", value: "#98FB98", category: "pastel", building: "both" },
            { name: "Лавандовый", value: "#E6E6FA", category: "pastel", building: "both" },
            { name: "Персиковый", value: "#FFDAB9", category: "pastel", building: "both" },
            { name: "Голубой", value: "#ADD8E6", category: "pastel", building: "both" },
            { name: "Сиреневый", value: "#D8BFD8", category: "pastel", building: "both" },
            { name: "Аквамарин", value: "#7FFFD4", category: "bright", building: "both" },
            { name: "Салатовый", value: "#C1FFC1", category: "bright", building: "both" },
            { name: "Коралловый", value: "#FF7F50", category: "bright", building: "both" },
            { name: "Лазурный", value: "#87CEEB", category: "bright", building: "both" },
            { name: "Сливовый", value: "#DDA0DD", category: "deep", building: "both" },
            { name: "Желтый", value: "#FFFACD", category: "pastel", building: "both" },
            { name: "Бирюзовый", value: "#40E0D0", category: "bright", building: "both" },
            { name: "Розово-лавандовый", value: "#F0B6FF", category: "pastel", building: "both" },
            { name: "Светло-оранжевый", value: "#FFD8A0", category: "pastel", building: "both" }
        ].filter(color => color.category !== "custom");
        
        this.saveCustomColors();
    }
};

// Инициализация при экспорте
ColorPalette.initialize();