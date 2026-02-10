// src/frontend/config/extracurricular/schedule.js

export const WeekSchedule = {
    // Дни недели
    DAYS: [
        { dayName: "Понедельник", shortName: "ПН", id: "monday", order: 0, isWeekend: false, building: "both" },
        { dayName: "Вторник", shortName: "ВТ", id: "tuesday", order: 1, isWeekend: false, building: "both" },
        { dayName: "Среда", shortName: "СР", id: "wednesday", order: 2, isWeekend: false, building: "both" },
        { dayName: "Четверг", shortName: "ЧТ", id: "thursday", order: 3, isWeekend: false, building: "both" },
        { dayName: "Пятница", shortName: "ПТ", id: "friday", order: 4, isWeekend: false, building: "both" },
        
    ],
    
    // Рабочие дни для начальной школы
    PRIMARY_SCHOOL_DAYS: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"],
    
    // Рабочие дни для старшей школы
    HIGH_SCHOOL_DAYS: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"],
    
    // Получение дня по короткому имени
    getDayByShortName(shortName) {
        return this.DAYS.find(day => day.shortName === shortName);
    },
    
    // Получение дня по полному имени
    getDayByName(dayName) {
        return this.DAYS.find(day => day.dayName === dayName);
    },
    
    // Получение дня по ID
    getDayById(id) {
        return this.DAYS.find(day => day.id === id);
    },
    
    // Получение рабочих дней для здания
    getWorkDays(building = 'highSchool') {
        return building === 'primarySchool' 
            ? this.PRIMARY_SCHOOL_DAYS 
            : this.HIGH_SCHOOL_DAYS;
    },
    
    // Получение выходных дней для здания
    getWeekendDays(building = 'highSchool') {
        const workDays = this.getWorkDays(building);
        return this.DAYS
            .filter(day => !workDays.includes(day.dayName) && day.building !== "none")
            .map(day => day.dayName);
    },
    
    // Проверка, является ли день рабочим для здания
    isWorkDay(dayName, building = 'highSchool') {
        const workDays = this.getWorkDays(building);
        return workDays.includes(dayName);
    },
    
    // Получение всех коротких имен
    getShortNames() {
        return this.DAYS.map(day => day.shortName);
    },
    
    // Получение всех полных имен
    getFullNames() {
        return this.DAYS.map(day => day.dayName);
    },
    
    // Получение дней для select опций
    getDayOptions(building = 'both') {
        return this.DAYS
            .filter(day => {
                if (building === 'both') return day.building !== "none";
                if (building === 'primarySchool') return this.PRIMARY_SCHOOL_DAYS.includes(day.dayName);
                if (building === 'highSchool') return this.HIGH_SCHOOL_DAYS.includes(day.dayName);
                return true;
            })
            .map(day => ({
                value: day.dayName,
                label: `${day.shortName} - ${day.dayName}`,
                isWeekend: day.isWeekend,
                building: day.building
            }));
    },
    
    // Сортировка дней в правильном порядке
    sortDays(days) {
        return days.sort((a, b) => {
            const dayA = this.getDayByName(a);
            const dayB = this.getDayByName(b);
            return (dayA?.order || 99) - (dayB?.order || 99);
        });
    }
};

export const TimeSchedule = {
    // Время начала занятий для разных зданий
    START_TIMES: {
        primarySchool: "14:00",
        highSchool: "15:00"
    },
    
    // Время окончания занятий
    END_TIMES: {
        primarySchool: "17:00",
        highSchool: "19:00"
    },
    
    // Длительность стандартного занятия (в минутах)
    DEFAULT_DURATION: 60,
    
    // Генерация временных слотов
    generateSlots(building = 'highSchool', interval = 30) {
        const slots = [];
        const startHour = building === 'primarySchool' ? 14 : 15;
        const endHour = building === 'primarySchool' ? 17 : 19;
        
        for (let hour = startHour; hour <= endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                if (hour === endHour && minute > 0) break;
                slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
            }
        }
        return slots;
    },
    
    // Получение слотов для здания
    getSlots(building = 'highSchool') {
        return this.generateSlots(building);
    },
    
    // Проверка валидности времени
    isValidTime(time) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    },
    
    // Парсинг времени
    parseTime(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return { 
            hours, 
            minutes, 
            totalMinutes: hours * 60 + minutes,
            formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        };
    },
    
    // Сравнение времени
    compareTimes(time1, time2) {
        const t1 = this.parseTime(time1);
        const t2 = this.parseTime(time2);
        return t1.totalMinutes - t2.totalMinutes;
    },
    
    // Расчет длительности
    calculateDuration(startTime, endTime) {
        const start = this.parseTime(startTime);
        const end = this.parseTime(endTime);
        return Math.round((end.totalMinutes - start.totalMinutes) / 60 * 10) / 10;
    },
    
    // Проверка, находится ли время в диапазоне
    isTimeInRange(time, startTime, endTime) {
        const current = this.parseTime(time);
        const start = this.parseTime(startTime);
        const end = this.parseTime(endTime);
        return current.totalMinutes >= start.totalMinutes && current.totalMinutes < end.totalMinutes;
    },
    
    // Проверка, допустимо ли время для здания
    isValidForBuilding(time, building = 'highSchool') {
        const parsed = this.parseTime(time);
        const startHour = building === 'primarySchool' ? 14 : 15;
        const endHour = building === 'primarySchool' ? 17 : 19;
        
        return parsed.hours >= startHour && parsed.hours <= endHour;
    },
    
    // Получение времени по умолчанию для здания
    getDefaultTime(type = 'start', building = 'highSchool') {
        return type === 'start' 
            ? this.START_TIMES[building === 'primarySchool' ? 'primarySchool' : 'highSchool']
            : this.END_TIMES[building === 'primarySchool' ? 'primarySchool' : 'highSchool'];
    },
    
    // Получение временных слотов для select опций
    getTimeOptions(building = 'highSchool') {
        return this.getSlots(building).map(time => ({
            value: time,
            label: time,
            isValid: this.isValidForBuilding(time, building)
        }));
    },
    
    // Форматирование времени для отображения
    formatTimeForDisplay(time, showSeconds = false) {
        const parsed = this.parseTime(time);
        if (showSeconds) {
            return `${parsed.formatted}:00`;
        }
        return parsed.formatted;
    }
};