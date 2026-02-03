// src/frontend/pages/ExtracurricularActivities.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, 
    FaPlus, 
    FaCalendar, 
    FaClock, 
    FaUser, 
    FaPalette, 
    FaTrash, 
    FaEdit, 
    FaSave, 
    FaTimes,
    FaDoorOpen,
    FaBook,
    FaChevronDown,
    FaChevronUp
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ExtracurricularActivities.css';

const PASTEL_COLORS = [
    { name: "Розовый", value: "#FFB6C1" },
    { name: "Мятный", value: "#98FB98" },
    { name: "Лавандовый", value: "#E6E6FA" },
    { name: "Персиковый", value: "#FFDAB9" },
    { name: "Голубой", value: "#ADD8E6" },
    { name: "Сиреневый", value: "#D8BFD8" },
    { name: "Аквамарин", value: "#7FFFD4" },
    { name: "Салатовый", value: "#C1FFC1" },
    { name: "Коралловый", value: "#FF7F50" },
    { name: "Лазурный", value: "#87CEEB" },
    { name: "Сливовый", value: "#DDA0DD" },
    { name: "Желтый", value: "#FFFACD" },
    { name: "Бирюзовый", value: "#40E0D0" },
    { name: "Розово-лавандовый", value: "#F0B6FF" },
    { name: "Светло-оранжевый", value: "#FFD8A0" }
];

const WEEK_DAYS = [
    { dayName: "Понедельник", shortName: "ПН", id: "monday" },
    { dayName: "Вторник", shortName: "ВТ", id: "tuesday" },
    { dayName: "Среда", shortName: "СР", id: "wednesday" },
    { dayName: "Четверг", shortName: "ЧТ", id: "thursday" },
    { dayName: "Пятница", shortName: "ПТ", id: "friday" },
    { dayName: "Суббота", shortName: "СБ", id: "saturday" }
];

const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
    const hour = Math.floor(i / 2) + 13;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
});

const TEACHERS = [
    "Иванов А.П.",
    "Петрова М.И.", 
    "Сидоров В.Г.",
    "Козлова Е.С.",
    "Алексеев Д.Н.",
    "Смирнова О.Л.",
    "Кузнецов И.В."
];

const ExtracurricularActivities = () => {
    const navigate = useNavigate();
    
    const [activities, setActivities] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0].value);
    const [showAllColors, setShowAllColors] = useState(false);
    
    const [newActivity, setNewActivity] = useState({
        title: "",
        teacher: "",
        days: ["Понедельник"],
        startTime: "15:00",
        endTime: "16:00",
        color: PASTEL_COLORS[0].value,
        room: "",
        description: ""
    });

    const visibleColors = showAllColors ? PASTEL_COLORS : PASTEL_COLORS.slice(0, 5);

    // СИЛЬНО УЛУЧШЕННАЯ ФУНКЦИЯ ЗАГРУЗКИ ДАННЫХ
    const loadInitialData = () => {
        console.log('Загружаем начальные данные...');
        const initialActivities = [
            {
                id: 1,
                title: "Шахматный клуб",
                teacher: "Иванов А.П.",
                days: ["Понедельник", "Среда"],
                startTime: "15:00",
                endTime: "16:30",
                color: "#98FB98",
                room: "Каб. 203",  // УБЕДИТЕСЬ, ЧТО ЭТО ПОЛЕ ЕСТЬ
                description: "Развитие логического мышления"
            },
            {
                id: 2,
                title: "Рисование",
                teacher: "Петрова М.И.",
                days: ["Вторник", "Суббота"],
                startTime: "14:30",
                endTime: "16:00",
                color: "#FFB6C1",
                room: "Актовый зал",  // УБЕДИТЕСЬ, ЧТО ЭТО ПОЛЕ ЕСТЬ
                description: "Основы живописи"
            },
            {
                id: 3,
                title: "Спортивная гимнастика",
                teacher: "Сидоров В.Г.",
                days: ["Понедельник", "Четверг"],
                startTime: "16:00",
                endTime: "17:30",
                color: "#ADD8E6",
                room: "Спортзал №1",  // УБЕДИТЕСЬ, ЧТО ЭТО ПОЛЕ ЕСТЬ
                description: "Занятия по гимнастике"
            },
            {
                id: 4,
                title: "Программирование",
                teacher: "Козлова Е.С.",
                days: ["Вторник", "Пятница"],
                startTime: "15:30",
                endTime: "17:00",
                color: "#E6E6FA",
                room: "Каб. 305",  // УБЕДИТЕСЬ, ЧТО ЭТО ПОЛЕ ЕСТЬ
                description: "Основы программирования"
            }
        ];
        
        console.log('Начальные данные с room:', initialActivities);
        setActivities(initialActivities);
        localStorage.setItem('extracurricularActivities', JSON.stringify(initialActivities));
        return initialActivities;
    };

    useEffect(() => {
        console.log('Компонент монтируется...');
        
        // ОЧИСТКА ЛОКАЛЬНОГО ХРАНИЛИЩА ДЛЯ ТЕСТА (РАСКОММЕНТИРОВАТЬ ЕСЛИ НУЖНО)
        // localStorage.removeItem('extracurricularActivities');
        
        const savedActivities = localStorage.getItem('extracurricularActivities');
        console.log('Данные из localStorage:', savedActivities);
        
        if (savedActivities) {
            try {
                const parsed = JSON.parse(savedActivities);
                console.log('Парсинг данных:', parsed);
                
                // ПРЕОБРАЗОВАНИЕ СТАРЫХ ДАННЫХ В НОВЫЙ ФОРМАТ
                const validatedActivities = parsed.map((activity, index) => {
                    // ЕСЛИ У СТАРОЙ ЗАПИСИ НЕТ room, ДОБАВЛЯЕМ ЕГО
                    const updatedActivity = {
                        ...activity,
                        id: activity.id || index + 1,
                        days: activity.days && Array.isArray(activity.days) 
                            ? activity.days 
                            : (activity.day ? [activity.day] : ["Понедельник"]),
                        // ГАРАНТИРУЕМ НАЛИЧИЕ ПОЛЯ room
                        room: activity.room || activity.cabinet || activity.classroom || getDefaultRoom(activity.title)
                    };
                    
                    console.log(`Занятие ${index + 1}:`, updatedActivity);
                    return updatedActivity;
                });
                
                console.log('Валидированные данные:', validatedActivities);
                setActivities(validatedActivities);
                
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
                console.log('Загружаем начальные данные из-за ошибки...');
                loadInitialData();
            }
        } else {
            console.log('Нет сохраненных данных, загружаем начальные...');
            loadInitialData();
        }
    }, []);

    // ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ КАБИНЕТА ПО УМОЛЧАНИЮ
    const getDefaultRoom = (title) => {
        const roomMap = {
            "Шахматный клуб": "Каб. 203",
            "Рисование": "Актовый зал",
            "Спортивная гимнастика": "Спортзал №1",
            "Программирование": "Каб. 305"
        };
        return roomMap[title] || "Каб. 101";
    };

    const saveToLocalStorage = (updatedActivities) => {
        console.log('Сохраняем данные в localStorage:', updatedActivities);
        const validatedActivities = updatedActivities.map(activity => ({
            id: activity.id,
            title: activity.title,
            teacher: activity.teacher,
            days: activity.days && Array.isArray(activity.days) ? activity.days : ["Понедельник"],
            startTime: activity.startTime,
            endTime: activity.endTime,
            color: activity.color,
            room: activity.room || "", // ГАРАНТИРУЕМ ПОЛЕ room
            description: activity.description || ""
        }));
        localStorage.setItem('extracurricularActivities', JSON.stringify(validatedActivities));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewActivity(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDayToggle = (day) => {
        setNewActivity(prev => {
            const currentDays = [...prev.days];
            if (currentDays.includes(day)) {
                return {
                    ...prev,
                    days: currentDays.filter(d => d !== day)
                };
            } else {
                return {
                    ...prev,
                    days: [...currentDays, day]
                };
            }
        });
    };

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        setNewActivity(prev => ({
            ...prev,
            color
        }));
    };

    const handleAddActivity = () => {
        if (!newActivity.title.trim() || !newActivity.teacher.trim()) {
            alert('Пожалуйста, заполните обязательные поля');
            return;
        }

        const activityToAdd = {
            ...newActivity,
            days: newActivity.days && Array.isArray(newActivity.days) ? newActivity.days : ["Понедельник"],
            room: newActivity.room.trim() || "Не указан"
        };

        if (activityToAdd.days.length === 0) {
            alert('Пожалуйста, выберите хотя бы один день недели');
            return;
        }

        const newId = activities.length > 0 
            ? Math.max(...activities.map(a => a.id)) + 1 
            : 1;
        
        const activity = {
            id: newId,
            ...activityToAdd
        };
        
        console.log('Добавляем новое занятие:', activity);
        const updatedActivities = [...activities, activity];
        setActivities(updatedActivities);
        saveToLocalStorage(updatedActivities);
        
        setNewActivity({
            title: "",
            teacher: "",
            days: ["Понедельник"],
            startTime: "15:00",
            endTime: "16:00",
            color: PASTEL_COLORS[0].value,
            room: "",
            description: ""
        });
        setSelectedColor(PASTEL_COLORS[0].value);
        setShowAddForm(false);
        
        alert('Занятие успешно добавлено!');
    };

    const handleEditActivity = (id) => {
        const activity = activities.find(a => a.id === id);
        if (activity) {
            console.log('Редактируем занятие:', activity);
            const activityWithDays = {
                ...activity,
                days: activity.days && Array.isArray(activity.days) 
                    ? activity.days 
                    : (activity.day ? [activity.day] : ["Понедельник"]),
                room: activity.room || ""
            };
            setNewActivity(activityWithDays);
            setSelectedColor(activityWithDays.color);
            setEditingId(id);
            setShowAddForm(true);
        }
    };

    const handleSaveEdit = () => {
        if (!newActivity.title.trim() || !newActivity.teacher.trim()) {
            alert('Пожалуйста, заполните обязательные поля');
            return;
        }

        const activityToSave = {
            ...newActivity,
            days: newActivity.days && Array.isArray(newActivity.days) ? newActivity.days : ["Понедельник"],
            room: newActivity.room.trim() || "Не указан"
        };

        if (activityToSave.days.length === 0) {
            alert('Пожалуйста, выберите хотя бы один день недели');
            return;
        }

        const updatedActivities = activities.map(activity => 
            activity.id === editingId ? activityToSave : activity
        );
        
        console.log('Сохраняем изменения:', activityToSave);
        setActivities(updatedActivities);
        saveToLocalStorage(updatedActivities);
        
        setNewActivity({
            title: "",
            teacher: "",
            days: ["Понедельник"],
            startTime: "15:00",
            endTime: "16:00",
            color: PASTEL_COLORS[0].value,
            room: "",
            description: ""
        });
        setSelectedColor(PASTEL_COLORS[0].value);
        setEditingId(null);
        setShowAddForm(false);
        
        alert('Изменения сохранены!');
    };

    const handleDeleteActivity = (id) => {
        if (window.confirm('Вы уверены, что хотите удалить это занятие?')) {
            const updatedActivities = activities.filter(activity => activity.id !== id);
            setActivities(updatedActivities);
            saveToLocalStorage(updatedActivities);
            
            if (editingId === id) {
                setEditingId(null);
                setShowAddForm(false);
            }
            
            alert('Занятие удалено!');
        }
    };

    const handleCancel = () => {
        setNewActivity({
            title: "",
            teacher: "",
            days: ["Понедельник"],
            startTime: "15:00",
            endTime: "16:00",
            color: PASTEL_COLORS[0].value,
            room: "",
            description: ""
        });
        setSelectedColor(PASTEL_COLORS[0].value);
        setEditingId(null);
        setShowAddForm(false);
        setShowAllColors(false);
    };

    const getActivitiesForDay = (dayName) => {
        const dayActivities = activities.filter(activity => {
            const hasDay = activity && 
                          activity.days && 
                          Array.isArray(activity.days) && 
                          activity.days.includes(dayName);
            
            if (hasDay) {
                console.log(`Найдено занятие на ${dayName}:`, activity);
            }
            
            return hasDay;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        return dayActivities;
    };

    return (
        <div className="extracurricular-page">
            <div className="animated-bg">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>

            <button className="back-btn" onClick={() => navigate('/')}>
                <FaArrowLeft />
                На главную
            </button>

            <Header />

            <main className="extracurricular-container">
                <div className="page-header">
                    <div className="title-section">
                        <h1>
                            <FaCalendar />
                            Внешкольные занятия
                        </h1>
                        <p className="page-subtitle">
                            Управление кружками, секциями и мероприятиями
                        </p>
                    </div>
                    
                    <button 
                        className={`btn ${showAddForm ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => {
                            console.log('Текущие занятия:', activities);
                            setShowAddForm(!showAddForm);
                        }}
                    >
                        <FaPlus /> 
                        {showAddForm ? 'Скрыть форму' : 'Добавить занятие'}
                    </button>
                </div>

                {showAddForm && (
                    <div className="add-form-overlay glass-effect">
                        <div className="form-section">
                            <div className="form-header">
                                <h3>
                                    {editingId ? 'Редактирование занятия' : 'Добавление нового занятия'}
                                </h3>
                                <button className="close-form-btn" onClick={handleCancel}>
                                    <FaTimes />
                                </button>
                            </div>
                            
                            <div className="activity-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            <FaBook /> Название занятия *
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={newActivity.title}
                                            onChange={handleInputChange}
                                            placeholder="Например: Шахматный клуб"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>
                                            <FaUser /> Преподаватель *
                                        </label>
                                        <select
                                            name="teacher"
                                            value={newActivity.teacher}
                                            onChange={handleInputChange}
                                            className="form-select"
                                            required
                                        >
                                            <option value="">Выберите преподавателя</option>
                                            {TEACHERS.map(teacher => (
                                                <option key={teacher} value={teacher}>
                                                    {teacher}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            <FaClock /> Время начала *
                                        </label>
                                        <select
                                            name="startTime"
                                            value={newActivity.startTime}
                                            onChange={handleInputChange}
                                            className="form-select"
                                        >
                                            {TIME_SLOTS.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>
                                            <FaClock /> Время окончания *
                                        </label>
                                        <select
                                            name="endTime"
                                            value={newActivity.endTime}
                                            onChange={handleInputChange}
                                            className="form-select"
                                        >
                                            {TIME_SLOTS.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>
                                        <FaCalendar /> Дни недели *
                                    </label>
                                    <div className="days-selector">
                                        {WEEK_DAYS.map(day => (
                                            <button
                                                key={day.dayName}
                                                type="button"
                                                className={`day-checkbox ${newActivity.days.includes(day.dayName) ? 'selected' : ''}`}
                                                onClick={() => handleDayToggle(day.dayName)}
                                            >
                                                {day.shortName}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="selected-days">
                                        <span className="days-count">Выбрано дней: {newActivity.days.length}</span>
                                        {newActivity.days.length > 0 && (
                                            <span className="days-list">
                                                ({newActivity.days.map(d => WEEK_DAYS.find(wd => wd.dayName === d)?.shortName).join(', ')})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            <FaDoorOpen /> Кабинет *
                                        </label>
                                        <input
                                            type="text"
                                            name="room"
                                            value={newActivity.room}
                                            onChange={handleInputChange}
                                            placeholder="Например: Каб. 203, Актовый зал"
                                            className="form-input"
                                            required
                                        />
                                        <small className="form-help">Обязательное поле для отображения в расписании</small>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>
                                            <FaPalette /> Цвет занятия
                                        </label>
                                        <div className="color-selection">
                                            <div className="selected-color-preview">
                                                <div 
                                                    className="color-preview" 
                                                    style={{ backgroundColor: selectedColor }}
                                                />
                                                <div className="color-info">
                                                    <span className="color-label">Выбранный цвет</span>
                                                    <span className="color-hex">{selectedColor.toUpperCase()}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="color-options">
                                                <div className="color-section-title">Палитра цветов:</div>
                                                <div className="preset-colors">
                                                    {visibleColors.map(color => (
                                                        <button
                                                            key={color.value}
                                                            type="button"
                                                            className={`color-preset ${selectedColor === color.value ? 'selected' : ''}`}
                                                            style={{ backgroundColor: color.value }}
                                                            onClick={() => handleColorSelect(color.value)}
                                                            title={color.name}
                                                        />
                                                    ))}
                                                </div>
                                                
                                                {PASTEL_COLORS.length > 5 && (
                                                    <button 
                                                        className="show-more-colors-btn"
                                                        type="button"
                                                        onClick={() => setShowAllColors(!showAllColors)}
                                                    >
                                                        {showAllColors ? (
                                                            <>
                                                                <FaChevronUp /> Скрыть цвета
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaChevronDown /> Показать все цвета ({PASTEL_COLORS.length})
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Описание</label>
                                    <textarea
                                        name="description"
                                        value={newActivity.description}
                                        onChange={handleInputChange}
                                        placeholder="Краткое описание занятия..."
                                        rows="3"
                                        className="form-textarea"
                                    />
                                </div>
                                
                                <div className="form-actions">
                                    {editingId ? (
                                        <>
                                            <button 
                                                className="btn btn-success" 
                                                onClick={handleSaveEdit}
                                            >
                                                <FaSave /> Сохранить изменения
                                            </button>
                                            <button 
                                                className="btn btn-danger"
                                                onClick={() => handleDeleteActivity(editingId)}
                                            >
                                                <FaTrash /> Удалить занятие
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            className="btn btn-primary btn-large" 
                                            onClick={handleAddActivity}
                                        >
                                            <FaPlus /> Добавить занятие
                                        </button>
                                    )}
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={handleCancel}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="main-schedule glass-effect">
                    <h3 className="schedule-title">
                        <FaCalendar /> Расписание внешкольных занятий
                    </h3>
                    
                    <div className="week-schedule-grid">
                        <div className="schedule-header">
                            <div className="time-column">Время</div>
                            {WEEK_DAYS.map(day => (
                                <div key={day.dayName} className="day-column-header">
                                    <div className="day-name">{day.shortName}</div>
                                    <div className="full-day-name">{day.dayName}</div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="schedule-body">
                            {TIME_SLOTS.map((time, timeIndex) => (
                                <div key={time} className="schedule-row">
                                    <div className="time-cell">
                                        <span className="time-label">{time}</span>
                                    </div>
                                    
                                    {WEEK_DAYS.map(day => {
                                        const dayActivities = getActivitiesForDay(day.dayName);
                                        const activityForTime = dayActivities.find(activity => {
                                            const start = parseInt(activity.startTime.replace(':', ''));
                                            const end = parseInt(activity.endTime.replace(':', ''));
                                            const current = parseInt(time.replace(':', ''));
                                            return current >= start && current < end;
                                        });
                                        
                                        const isStart = activityForTime && 
                                            parseInt(activityForTime.startTime.replace(':', '')) === parseInt(time.replace(':', ''));
                                        
                                        return (
                                            <div 
                                                key={`${day.dayName}-${time}`} 
                                                className={`day-cell ${activityForTime ? 'has-activity' : ''}`}
                                                onClick={() => activityForTime && handleEditActivity(activityForTime.id)}
                                            >
                                                {activityForTime && isStart && (
                                                    <div 
                                                        className="activity-block"
                                                        style={{ 
                                                            backgroundColor: `${activityForTime.color}15`,
                                                            borderLeft: `4px solid ${activityForTime.color}`
                                                        }}
                                                    >
                                                        <div className="activity-content">
                                                            <div className="activity-header">
                                                                <div className="activity-title">
                                                                    {activityForTime.title}
                                                                    {activityForTime.room && (
                                                                        <span style={{fontSize: '0.7rem', color: '#666', marginLeft: '5px'}}>
                                                                            ({activityForTime.room})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div 
                                                                    className="activity-color-dot"
                                                                    style={{ backgroundColor: activityForTime.color }}
                                                                />
                                                            </div>
                                                            <div className="activity-details">
                                                                <div className="activity-teacher">
                                                                    <FaUser /> {activityForTime.teacher}
                                                                </div>
                                                                <div className="activity-time">
                                                                    <FaClock /> {activityForTime.startTime} - {activityForTime.endTime}
                                                                </div>
                                                                {/* ГАРАНТИРОВАННОЕ ОТОБРАЖЕНИЕ КАБИНЕТА */}
                                                                {activityForTime.room && (
                                                                    <div className="activity-room">
                                                                        <FaDoorOpen /> {activityForTime.room}
                                                                    </div>
                                                                )}
                                                                {!activityForTime.room && (
                                                                    <div className="activity-room" style={{color: '#ff6b6b', backgroundColor: 'rgba(255, 107, 107, 0.1)'}}>
                                                                        <FaDoorOpen /> Кабинет не указан
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ExtracurricularActivities;