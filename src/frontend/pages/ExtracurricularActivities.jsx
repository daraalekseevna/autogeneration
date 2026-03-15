// src/frontend/pages/ExtracurricularActivities.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, 
    FaPlus, 
    FaClock, 
    FaUser, 
    FaPalette, 
    FaTrash, 
    FaSave, 
    FaTimes,
    FaDoorOpen,
    FaBook,
    FaSearch,
    FaFilter,
    FaChevronDown,
    FaChevronUp,
    FaRegCalendarAlt,
    FaRegClock,
    FaRegUser,
    FaRegBuilding,
    FaGripVertical,
    FaExclamationCircle
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ExtracurricularActivities.css';

// ========== КОНСТАНТЫ ==========
const COLORS = [
    { id: 1, name: "Розовый", code: "#FFB6C1" },
    { id: 2, name: "Мятный", code: "#98FB98" },
    { id: 3, name: "Лавандовый", code: "#E6E6FA" },
    { id: 4, name: "Персиковый", code: "#FFDAB9" },
    { id: 5, name: "Голубой", code: "#ADD8E6" },
    { id: 6, name: "Сиреневый", code: "#D8BFD8" },
    { id: 7, name: "Аквамарин", code: "#7FFFD4" },
    { id: 8, name: "Салатовый", code: "#C1FFC1" },
    { id: 9, name: "Коралловый", code: "#FF7F50" },
    { id: 10, name: "Лазурный", code: "#87CEEB" },
    { id: 11, name: "Сливовый", code: "#DDA0DD" },
    { id: 12, name: "Желтый", code: "#FFFACD" },
    { id: 13, name: "Бирюзовый", code: "#40E0D0" },
    { id: 14, name: "Розово-лавандовый", code: "#F0B6FF" },
    { id: 15, name: "Светло-оранжевый", code: "#FFD8A0" }
];

const WEEK_DAYS = [
    { id: 1, name: "Понедельник", short: "ПН" },
    { id: 2, name: "Вторник", short: "ВТ" },
    { id: 3, name: "Среда", short: "СР" },
    { id: 4, name: "Четверг", short: "ЧТ" },
    { id: 5, name: "Пятница", short: "ПТ" },
    { id: 6, name: "Суббота", short: "СБ" }
];

const TIME_SLOTS = [];
for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
        TIME_SLOTS.push({
            id: `${h}:${m}`,
            value: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        });
    }
}

// ========== КОМПОНЕНТ ФОРМЫ ==========
const ActivityForm = ({ isOpen, onClose, onSubmit, initialData, teachers }) => {
    const [form, setForm] = useState({
        title: '',
        teacher: '',
        days: [],
        startTime: '15:00',
        endTime: '16:00',
        color: COLORS[0].code,
        room: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [showAllColors, setShowAllColors] = useState(false);

    useEffect(() => {
        if (initialData) {
            setForm({
                title: initialData.title || '',
                teacher: initialData.teacher || '',
                days: initialData.days || [],
                startTime: initialData.startTime || '15:00',
                endTime: initialData.endTime || '16:00',
                color: initialData.color || COLORS[0].code,
                room: initialData.room || '',
                description: initialData.description || ''
            });
        } else {
            setForm({
                title: '',
                teacher: '',
                days: [],
                startTime: '15:00',
                endTime: '16:00',
                color: COLORS[0].code,
                room: '',
                description: ''
            });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Обязательное поле';
        if (!form.teacher) newErrors.teacher = 'Выберите преподавателя';
        if (form.days.length === 0) newErrors.days = 'Выберите хотя бы один день';
        if (!form.room.trim()) newErrors.room = 'Укажите кабинет';
        
        const start = parseInt(form.startTime.replace(':', ''));
        const end = parseInt(form.endTime.replace(':', ''));
        if (end <= start) newErrors.time = 'Время окончания должно быть позже';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({
                ...form,
                id: initialData?.id || Date.now(),
                room: form.room.trim() || 'Не указан'
            });
        }
    };

    const toggleDay = (day) => {
        setForm(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{initialData ? 'Редактировать занятие' : 'Новое занятие'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form">
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label><FaBook /> Название</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm({...form, title: e.target.value})}
                                placeholder="Например: Шахматный клуб"
                                className={errors.title ? 'error' : ''}
                            />
                            {errors.title && <span className="error-text">{errors.title}</span>}
                        </div>

                        <div className="form-group">
                            <label><FaUser /> Преподаватель</label>
                            <select
                                value={form.teacher}
                                onChange={e => setForm({...form, teacher: e.target.value})}
                                className={errors.teacher ? 'error' : ''}
                            >
                                <option value="">Выберите</option>
                                {teachers.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            {errors.teacher && <span className="error-text">{errors.teacher}</span>}
                        </div>

                        <div className="form-group">
                            <label><FaRegBuilding /> Кабинет</label>
                            <input
                                type="text"
                                value={form.room}
                                onChange={e => setForm({...form, room: e.target.value})}
                                placeholder="Каб. 203"
                                className={errors.room ? 'error' : ''}
                            />
                            {errors.room && <span className="error-text">{errors.room}</span>}
                        </div>

                        <div className="form-group full-width">
                            <label><FaRegCalendarAlt /> Дни недели</label>
                            <div className="days-grid">
                                {WEEK_DAYS.map(day => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        className={`day-btn ${form.days.includes(day.name) ? 'selected' : ''}`}
                                        onClick={() => toggleDay(day.name)}
                                    >
                                        {day.short}
                                    </button>
                                ))}
                            </div>
                            {errors.days && <span className="error-text">{errors.days}</span>}
                        </div>

                        <div className="form-group full-width">
                            <label><FaRegClock /> Время</label>
                            <div className="time-group">
                                <select
                                    value={form.startTime}
                                    onChange={e => setForm({...form, startTime: e.target.value})}
                                >
                                    {TIME_SLOTS.map(slot => (
                                        <option key={slot.id} value={slot.value}>{slot.value}</option>
                                    ))}
                                </select>
                                <span className="time-separator">—</span>
                                <select
                                    value={form.endTime}
                                    onChange={e => setForm({...form, endTime: e.target.value})}
                                >
                                    {TIME_SLOTS.map(slot => (
                                        <option key={slot.id} value={slot.value}>{slot.value}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.time && <span className="error-text">{errors.time}</span>}
                        </div>

                        <div className="form-group full-width">
                            <label><FaPalette /> Цвет</label>
                            <div className="color-selector">
                                <div className="selected-color">
                                    <div className="color-preview" style={{ backgroundColor: form.color }} />
                                    <span className="color-code">{form.color}</span>
                                </div>
                                <div className="color-grid">
                                    {(showAllColors ? COLORS : COLORS.slice(0, 8)).map(color => (
                                        <button
                                            key={color.id}
                                            type="button"
                                            className={`color-btn ${form.color === color.code ? 'active' : ''}`}
                                            style={{ backgroundColor: color.code }}
                                            onClick={() => setForm({...form, color: color.code})}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                                {COLORS.length > 8 && (
                                    <button
                                        type="button"
                                        className="show-more-btn"
                                        onClick={() => setShowAllColors(!showAllColors)}
                                    >
                                        {showAllColors ? 'Скрыть' : `Показать все (${COLORS.length})`}
                                        {showAllColors ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>Описание</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({...form, description: e.target.value})}
                                placeholder="Описание занятия (необязательно)"
                                rows="2"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            <FaSave /> {initialData ? 'Сохранить' : 'Создать'}
                        </button>
                        {initialData && (
                            <button type="button" className="btn btn-danger" onClick={() => onSubmit({...form, delete: true})}>
                                <FaTrash /> Удалить
                            </button>
                        )}
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ========== КОМПОНЕНТ КАРТОЧКИ ==========
const ActivityCard = ({ activity, onEdit, onDragStart, onDragEnd }) => {
    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            id: activity.id,
            currentDay: activity.days[0] // Берем первый день как текущий
        }));
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
        if (onDragStart) onDragStart(activity);
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        if (onDragEnd) onDragEnd();
    };

    return (
        <div 
            className="activity-card"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={() => onEdit(activity)}
            style={{ 
                backgroundColor: `${activity.color}15`,
                borderLeft: `4px solid ${activity.color}`
            }}
        >
            <div className="drag-handle">
                <FaGripVertical />
            </div>
            
            <div className="activity-card-content">
                <h4 className="activity-title">{activity.title}</h4>
                
                <div className="activity-info">
                    <div className="info-item">
                        <FaRegUser className="info-icon" />
                        <span>{activity.teacher}</span>
                    </div>
                    <div className="info-item">
                        <FaRegClock className="info-icon" />
                        <span>{activity.startTime}—{activity.endTime}</span>
                    </div>
                    <div className="info-item">
                        <FaRegBuilding className="info-icon" />
                        <span>{activity.room}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========== КОМПОНЕНТ ДНЯ ==========
const DayColumn = ({ day, activities, onActivityClick, onDrop }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            onDrop(data.id, data.currentDay, day.name);
        } catch (error) {
            console.error('Ошибка при drop:', error);
        }
    };

    const dayActivities = activities
        .filter(a => a.days.includes(day.name))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
        <div 
            className={`day-column ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="day-column-header">
                <span className="day-name">{day.short}</span>
                <span className="day-full">{day.name}</span>
                <span className="day-count">{dayActivities.length}</span>
            </div>
            
            <div className="day-column-content">
                {dayActivities.length === 0 ? (
                    <div className="day-empty">
                        <FaRegCalendarAlt className="empty-icon" />
                        <p>Нет занятий</p>
                    </div>
                ) : (
                    dayActivities.map(activity => (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            onEdit={onActivityClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
const ExtracurricularActivities = () => {
    const navigate = useNavigate();
    
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');
    const [draggedItem, setDraggedItem] = useState(null);

    // Загрузка данных
    useEffect(() => {
        const loadData = () => {
            try {
                const saved = localStorage.getItem('activities');
                if (saved) {
                    setActivities(JSON.parse(saved));
                } else {
                    const demo = [
                        {
                            id: 1,
                            title: "Шахматный клуб",
                            teacher: "Иванов А.П.",
                            days: ["Понедельник", "Среда"],
                            startTime: "15:00",
                            endTime: "16:30",
                            color: "#98FB98",
                            room: "Каб. 203"
                        },
                        {
                            id: 2,
                            title: "Рисование",
                            teacher: "Петрова М.И.",
                            days: ["Вторник", "Четверг"],
                            startTime: "14:30",
                            endTime: "16:00",
                            color: "#FFB6C1",
                            room: "Актовый зал"
                        },
                        {
                            id: 3,
                            title: "Спортивная гимнастика",
                            teacher: "Сидоров В.Г.",
                            days: ["Понедельник", "Пятница"],
                            startTime: "16:00",
                            endTime: "17:30",
                            color: "#ADD8E6",
                            room: "Спортзал"
                        }
                    ];
                    setActivities(demo);
                    localStorage.setItem('activities', JSON.stringify(demo));
                }
            } catch (error) {
                console.error('Ошибка загрузки:', error);
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, []);

    // Сохранение
    const saveActivities = useCallback((newActivities) => {
        setActivities(newActivities);
        localStorage.setItem('activities', JSON.stringify(newActivities));
    }, []);

    // CRUD операции
    const handleCreate = (activity) => {
        saveActivities([...activities, { ...activity, id: Date.now() }]);
        setShowForm(false);
    };

    const handleUpdate = (activity) => {
        if (activity.delete) {
            saveActivities(activities.filter(a => a.id !== activity.id));
        } else {
            saveActivities(activities.map(a => a.id === activity.id ? activity : a));
        }
        setShowForm(false);
        setEditingActivity(null);
    };

    const handleEdit = (activity) => {
        setEditingActivity(activity);
        setShowForm(true);
    };

    // Drag & Drop обработчик - ИСПРАВЛЕННАЯ ВЕРСИЯ
    const handleDrop = useCallback((activityId, fromDay, toDay) => {
        if (fromDay === toDay) return; // Не перемещаем в тот же день

        setActivities(prev => prev.map(activity => {
            if (activity.id === activityId) {
                // Убираем старый день и добавляем новый
                const newDays = activity.days
                    .filter(day => day !== fromDay) // Удаляем старый день
                    .concat(toDay); // Добавляем новый день
                
                return {
                    ...activity,
                    days: newDays
                };
            }
            return activity;
        }));
    }, []);

    // Фильтрация
    const filteredActivities = useMemo(() => {
        return activities.filter(a => {
            const matchesSearch = !search || 
                a.title.toLowerCase().includes(search.toLowerCase()) ||
                a.teacher.toLowerCase().includes(search.toLowerCase()) ||
                a.room.toLowerCase().includes(search.toLowerCase());
            
            const matchesTeacher = !filterTeacher || a.teacher === filterTeacher;
            
            return matchesSearch && matchesTeacher;
        });
    }, [activities, search, filterTeacher]);

    // Уникальные преподаватели
    const teachers = useMemo(() => {
        return [...new Set(activities.map(a => a.teacher))];
    }, [activities]);

    const clearFilters = () => {
        setSearch('');
        setFilterTeacher('');
    };

    const activeFiltersCount = (search ? 1 : 0) + (filterTeacher ? 1 : 0);

    if (loading) {
        return (
            <div className="app">
                <div className="bg-pattern" />
                <button className="back-btn" onClick={() => navigate('/')}>
                    <FaArrowLeft /> На главную
                </button>
                <Header />
                <main className="container">
                    <div className="loader">
                        <div className="spinner"></div>
                        <p>Загрузка...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="app">
            <div className="bg-pattern" />
            
            <button className="back-btn" onClick={() => navigate('/')}>
                <FaArrowLeft /> На главную
            </button>

            <Header />

            <main className="container">
                {/* Шапка */}
                <div className="header">
                    <div className="header-left">
                        <h1>
                            <FaRegCalendarAlt />
                            Внешкольные занятия
                        </h1>
                        <div className="header-stats">
                            <span className="stat-total">Всего: {activities.length}</span>
                            {filteredActivities.length !== activities.length && (
                                <span className="stat-filtered">
                                    Показано: {filteredActivities.length}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="header-right">
                        <button 
                            className={`btn-filter ${showFilters || activeFiltersCount > 0 ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FaFilter />
                            <span>Фильтры</span>
                            {activeFiltersCount > 0 && (
                                <span className="filter-badge">{activeFiltersCount}</span>
                            )}
                        </button>
                        
                        <button 
                            className="btn-primary"
                            onClick={() => {
                                setEditingActivity(null);
                                setShowForm(true);
                            }}
                        >
                            <FaPlus /> Добавить занятие
                        </button>
                    </div>
                </div>

                {/* Фильтры */}
                {showFilters && (
                    <div className="filters-panel">
                        <div className="filters-grid">
                            <div className="filter-group">
                                <label>Поиск</label>
                                <input
                                    type="text"
                                    placeholder="Название, преподаватель, кабинет..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="filter-input"
                                />
                            </div>
                            
                            <div className="filter-group">
                                <label>Преподаватель</label>
                                <select
                                    value={filterTeacher}
                                    onChange={e => setFilterTeacher(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">Все преподаватели</option>
                                    {teachers.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {activeFiltersCount > 0 && (
                                <button onClick={clearFilters} className="btn-clear">
                                    Очистить фильтры
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Форма */}
                <ActivityForm
                    isOpen={showForm}
                    onClose={() => {
                        setShowForm(false);
                        setEditingActivity(null);
                    }}
                    onSubmit={editingActivity ? handleUpdate : handleCreate}
                    initialData={editingActivity}
                    teachers={teachers}
                />

                {/* Подсказка для Drag & Drop */}
                <div className="drag-hint">
                    <FaGripVertical className="hint-icon" />
                    <span>Перетаскивайте занятия между днями для изменения расписания</span>
                </div>

                {/* Расписание */}
                {filteredActivities.length === 0 ? (
                    <div className="empty-state">
                        <FaRegCalendarAlt className="empty-icon" />
                        <h3>Нет занятий</h3>
                        <p>
                            {activeFiltersCount > 0
                                ? 'Попробуйте изменить параметры поиска'
                                : 'Создайте первое занятие, чтобы начать'}
                        </p>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className="btn-secondary">
                                Сбросить фильтры
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="schedule-grid">
                        {WEEK_DAYS.map(day => (
                            <DayColumn
                                key={day.id}
                                day={day}
                                activities={filteredActivities}
                                onActivityClick={handleEdit}
                                onDrop={handleDrop}
                            />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default ExtracurricularActivities;