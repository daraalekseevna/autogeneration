// src/frontend/config/extracurricular/forms.js
import { FaBook, FaUser, FaClock, FaCalendar, FaDoorOpen, FaPalette, FaSchool, FaGraduationCap } from 'react-icons/fa';
import { ColorPalette } from './colors';
import { RoomRegistry } from './rooms';
import { TeacherRegistry } from './teachers';
import { TimeSchedule } from './schedule';

export const ActivityFormConfig = {
    // Конфигурация полей формы с учетом зданий
    fields: {
        title: {
            name: "title",
            label: "Название занятия",
            icon: FaBook,
            placeholder: "Например: Шахматный клуб",
            type: "text",
            required: true,
            validation: {
                minLength: 3,
                maxLength: 50
            }
        },
        teacher: {
            name: "teacher",
            label: "Преподаватель",
            icon: FaUser,
            placeholder: "Выберите или введите нового",
            type: "select",
            required: true,
            validation: {
                minLength: 2,
                maxLength: 50
            }
        },
        startTime: {
            name: "startTime",
            label: "Время начала",
            icon: FaClock,
            type: "select",
            required: true
        },
        endTime: {
            name: "endTime",
            label: "Время окончания",
            icon: FaClock,
            type: "select",
            required: true
        },
        days: {
            name: "days",
            label: "Дни недели",
            icon: FaCalendar,
            type: "multiselect",
            required: true
        },
        room: {
            name: "room",
            label: "Кабинет",
            icon: FaDoorOpen,
            placeholder: "Например: Каб. 9, Спортзал",
            type: "select",
            required: true,
            validation: {
                minLength: 2,
                maxLength: 50
            }
        },
        color: {
            name: "color",
            label: "Цвет занятия",
            icon: FaPalette,
            type: "colorpicker"
        },
        description: {
            name: "description",
            label: "Описание",
            placeholder: "Краткое описание занятия...",
            type: "textarea",
            rows: 3,
            validation: {
                maxLength: 500
            }
        },
        building: {
            name: "building",
            label: "Здание",
            icon: FaSchool,
            type: "radio",
            options: [
                { value: "highSchool", label: "Старшая школа", icon: FaGraduationCap },
                { value: "primarySchool", label: "Начальная школа", icon: FaSchool }
            ],
            required: true,
            defaultValue: "highSchool"
        }
    },
    
    // Значения по умолчанию с учетом здания
    getDefaults(building = 'highSchool') {
        return {
            title: "",
            teacher: "",
            startTime: TimeSchedule.getDefaultTime('start', building),
            endTime: TimeSchedule.getDefaultTime('end', building),
            days: ["Понедельник"],
            room: RoomRegistry.getDefaultRoom("", building),
            color: ColorPalette.getDefaultColor(building),
            description: "",
            building: building
        };
    },
    
    // Сообщения об ошибках
    errorMessages: {
        required: "Это поле обязательно для заполнения",
        minLength: (min) => `Минимум ${min} символов`,
        maxLength: (max) => `Максимум ${max} символов`,
        timeOrder: "Время начала должно быть раньше времени окончания",
        atLeastOneDay: "Выберите хотя бы один день недели",
        invalidTime: "Некорректное время",
        timeNotForBuilding: "Время не подходит для выбранного здания",
        dayNotForBuilding: "День не подходит для выбранного здания"
    },
    
    // Валидация формы с учетом здания
    validateForm(data) {
        const errors = {};
        const building = data.building || 'highSchool';
        
        // Название
        if (!data.title?.trim()) {
            errors.title = this.errorMessages.required;
        } else if (data.title.length < 3) {
            errors.title = this.errorMessages.minLength(3);
        } else if (data.title.length > 50) {
            errors.title = this.errorMessages.maxLength(50);
        }
        
        // Преподаватель
        if (!data.teacher?.trim()) {
            errors.teacher = this.errorMessages.required;
        } else if (data.teacher.length < 2) {
            errors.teacher = this.errorMessages.minLength(2);
        } else {
            // Проверка соответствия преподавателя и здания
            const teacherBuilding = TeacherRegistry.getTeacherBuilding(data.teacher);
            if (teacherBuilding !== 'unknown' && teacherBuilding !== building) {
                errors.teacher = `Преподаватель работает в другом здании`;
            }
        }
        
        // Кабинет
        if (!data.room?.trim()) {
            errors.room = this.errorMessages.required;
        } else if (data.room.length < 2) {
            errors.room = this.errorMessages.minLength(2);
        } else {
            // Проверка соответствия кабинета и здания
            const roomBuilding = RoomRegistry.getBuildingByRoom(data.room);
            if (roomBuilding !== 'unknown' && roomBuilding !== building) {
                errors.room = `Кабинет находится в другом здании`;
            }
        }
        
        // Дни недели
        if (!data.days || data.days.length === 0) {
            errors.days = this.errorMessages.atLeastOneDay;
        } else {
            // Проверка дней на соответствие зданию
            const invalidDays = data.days.filter(day => {
                const dayObj = require('./schedule').WeekSchedule.getDayByName(day);
                return dayObj && !dayObj.building.includes(building === 'primarySchool' ? 'primary' : 'high');
            });
            
            if (invalidDays.length > 0) {
                errors.days = `Дни ${invalidDays.join(', ')} не подходят для выбранного здания`;
            }
        }
        
        // Время
        if (data.startTime && data.endTime) {
            const start = TimeSchedule.parseTime(data.startTime);
            const end = TimeSchedule.parseTime(data.endTime);
            
            if (start.totalMinutes >= end.totalMinutes) {
                errors.time = this.errorMessages.timeOrder;
            }
            
            // Проверка времени на соответствие зданию
            if (!TimeSchedule.isValidForBuilding(data.startTime, building)) {
                errors.startTime = this.errorMessages.timeNotForBuilding;
            }
            
            if (!TimeSchedule.isValidForBuilding(data.endTime, building)) {
                errors.endTime = this.errorMessages.timeNotForBuilding;
            }
        }
        
        // Описание
        if (data.description && data.description.length > 500) {
            errors.description = this.errorMessages.maxLength(500);
        }
        
        return errors;
    },
    
    // Получение конфигурации поля
    getFieldConfig(fieldName, building = 'highSchool') {
        const field = this.fields[fieldName];
        if (!field) return null;
        
        // Добавляем опции для select полей
        if (field.name === 'teacher') {
            return {
                ...field,
                options: TeacherRegistry.getTeacherOptions(building)
            };
        }
        
        if (field.name === 'room') {
            return {
                ...field,
                options: RoomRegistry.getRoomOptions(building)
            };
        }
        
        if (field.name === 'startTime' || field.name === 'endTime') {
            return {
                ...field,
                options: TimeSchedule.getTimeOptions(building)
            };
        }
        
        if (field.name === 'color') {
            return {
                ...field,
                colors: ColorPalette.getColorsForBuilding(building)
            };
        }
        
        return field;
    },
    
    // Получить все обязательные поля
    getRequiredFields() {
        return Object.values(this.fields)
            .filter(field => field.required)
            .map(field => field.name);
    },
    
    // Автозаполнение полей на основе названия
    autoFillFromTitle(title, currentData = {}) {
        const building = currentData.building || 'highSchool';
        const autoFilled = { ...currentData };
        
        if (title) {
            // Автоматическое определение здания
            const detectedBuilding = RoomRegistry.detectBuildingByActivity(title);
            if (!currentData.building) {
                autoFilled.building = detectedBuilding;
            }
            
            // Автоматический подбор кабинета
            if (!currentData.room) {
                autoFilled.room = RoomRegistry.getDefaultRoom(title, detectedBuilding);
            }
            
            // Автоматический подбор времени
            if (!currentData.startTime) {
                autoFilled.startTime = TimeSchedule.getDefaultTime('start', detectedBuilding);
            }
            
            if (!currentData.endTime) {
                autoFilled.endTime = TimeSchedule.getDefaultTime('end', detectedBuilding);
            }
            
            // Автоматический подбор цвета
            if (!currentData.color) {
                autoFilled.color = ColorPalette.getDefaultColor(detectedBuilding);
            }
        }
        
        return autoFilled;
    },
    
    // Обновление опций при смене здания
    updateOptionsForBuilding(building, currentData = {}) {
        const updated = { ...currentData, building };
        
        // Обновляем время
        if (!TimeSchedule.isValidForBuilding(updated.startTime, building)) {
            updated.startTime = TimeSchedule.getDefaultTime('start', building);
        }
        
        if (!TimeSchedule.isValidForBuilding(updated.endTime, building)) {
            updated.endTime = TimeSchedule.getDefaultTime('end', building);
        }
        
        // Обновляем кабинет если текущий не подходит
        const roomBuilding = RoomRegistry.getBuildingByRoom(updated.room);
        if (roomBuilding !== 'unknown' && roomBuilding !== building) {
            updated.room = RoomRegistry.getDefaultRoom(updated.title || "", building);
        }
        
        // Обновляем цвет
        updated.color = ColorPalette.getDefaultColor(building);
        
        return updated;
    }
};