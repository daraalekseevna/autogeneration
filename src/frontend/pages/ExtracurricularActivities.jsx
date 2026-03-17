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
    FaEdit,
    FaExclamationTriangle
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ExtracurricularActivities.css';

// ========== КОНСТАНТЫ ==========
const COLORS = [
    { id: 1, name: "Зеленый", code: "#4CAF50" },
    { id: 2, name: "Синий", code: "#2196F3" },
    { id: 3, name: "Фиолетовый", code: "#9C27B0" },
    { id: 4, name: "Оранжевый", code: "#FF9800" },
    { id: 5, name: "Красный", code: "#F44336" },
    { id: 6, name: "Коричневый", code: "#795548" },
    { id: 7, name: "Серый", code: "#607D8B" },
    { id: 8, name: "Салатовый", code: "#8BC34A" },
    { id: 9, name: "Бирюзовый", code: "#009688" },
    { id: 10, name: "Оранжево-красный", code: "#FF5722" },
    { id: 11, name: "Темно-синий", code: "#3F51B5" },
    { id: 12, name: "Розовый", code: "#E91E63" },
    { id: 13, name: "Желтый", code: "#FFC107" },
    { id: 14, name: "Голубой", code: "#00BCD4" },
    { id: 15, name: "Оранжевый", code: "#FF9800" },
    { id: 16, name: "Светло-серый", code: "#9E9E9E" }
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

const TEACHERS = [
    "Иванов А.П.",
    "Петрова М.И.", 
    "Сидоров В.Г.",
    "Козлова Е.С.",
    "Алексеев Д.Н.",
    "Смирнова О.Л.",
    "Кузнецов И.В."
];

// ========== РОЛИ ПОЛЬЗОВАТЕЛЕЙ ==========
const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
    PARENT: 'parent'
};

// Текущий пользователь (для демо)
const CURRENT_USER = {
    id: 1,
    name: 'Администратор',
    role: 'super_admin' // super_admin, admin, teacher, student, parent
};

// ========== ХУК ДЛЯ ПРОВЕРКИ ПРАВ ==========
const usePermissions = () => {
    const checkPermission = useCallback((action) => {
        if (CURRENT_USER.role === USER_ROLES.SUPER_ADMIN) return true;
        if (CURRENT_USER.role === USER_ROLES.ADMIN) {
            if (action === 'delete') return false;
            return true;
        }
        return false;
    }, []);

    return {
        canCreate: checkPermission('create'),
        canEdit: checkPermission('edit'),
        canDelete: checkPermission('delete'),
        isAdmin: CURRENT_USER.role === USER_ROLES.SUPER_ADMIN || CURRENT_USER.role === USER_ROLES.ADMIN,
        userRole: CURRENT_USER.role,
        userName: CURRENT_USER.name
    };
};

// ========== КОМПОНЕНТ ФОРМЫ ==========
const ActivityForm = ({ isOpen, onClose, onSubmit, initialData }) => {
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsSubmitting(false);
    }, [initialData, isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Введите название';
        if (!form.teacher) newErrors.teacher = 'Выберите преподавателя';
        if (form.days.length === 0) newErrors.days = 'Выберите хотя бы один день';
        if (!form.room.trim()) newErrors.room = 'Укажите кабинет';
        
        const start = parseInt(form.startTime.replace(':', ''));
        const end = parseInt(form.endTime.replace(':', ''));
        if (end <= start) newErrors.time = 'Время окончания должно быть позже начала';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            setIsSubmitting(true);
            try {
                await onSubmit({
                    ...form,
                    id: initialData?.id || Date.now(),
                    room: form.room.trim() || 'Не указан'
                });
                onClose();
            } catch (error) {
                console.error('Submit error:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const toggleDay = (day) => {
        setForm(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
        if (errors.days) {
            setErrors(prev => ({ ...prev, days: null }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{initialData ? 'Редактировать занятие' : 'Новое занятие'}</h2>
                    <button className="modal-close" onClick={onClose} disabled={isSubmitting}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form">
                    <div className="form-group">
                        <label><FaBook /> Название</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({...form, title: e.target.value})}
                            placeholder="Шахматный клуб"
                            className={errors.title ? 'error' : ''}
                            disabled={isSubmitting}
                        />
                        {errors.title && <span className="error-text">{errors.title}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><FaUser /> Преподаватель</label>
                            <select
                                value={form.teacher}
                                onChange={e => setForm({...form, teacher: e.target.value})}
                                className={errors.teacher ? 'error' : ''}
                                disabled={isSubmitting}
                            >
                                <option value="">Выберите преподавателя</option>
                                {TEACHERS.map(t => (
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
                                disabled={isSubmitting}
                            />
                            {errors.room && <span className="error-text">{errors.room}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label><FaRegCalendarAlt /> Дни недели</label>
                        <div className="days-grid">
                            {WEEK_DAYS.map(day => (
                                <button
                                    key={day.id}
                                    type="button"
                                    className={`day-btn ${form.days.includes(day.name) ? 'selected' : ''}`}
                                    onClick={() => toggleDay(day.name)}
                                    disabled={isSubmitting}
                                >
                                    {day.short}
                                </button>
                            ))}
                        </div>
                        {errors.days && <span className="error-text">{errors.days}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><FaRegClock /> Начало</label>
                            <select
                                value={form.startTime}
                                onChange={e => setForm({...form, startTime: e.target.value})}
                                disabled={isSubmitting}
                            >
                                {TIME_SLOTS.map(slot => (
                                    <option key={slot.id} value={slot.value}>{slot.value}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label><FaRegClock /> Конец</label>
                            <select
                                value={form.endTime}
                                onChange={e => setForm({...form, endTime: e.target.value})}
                                disabled={isSubmitting}
                            >
                                {TIME_SLOTS.map(slot => (
                                    <option key={slot.id} value={slot.value}>{slot.value}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {errors.time && <span className="error-text">{errors.time}</span>}

                    <div className="form-group">
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
                                        disabled={isSubmitting}
                                    />
                                ))}
                            </div>
                            {COLORS.length > 8 && (
                                <button
                                    type="button"
                                    className="show-more-btn"
                                    onClick={() => setShowAllColors(!showAllColors)}
                                    disabled={isSubmitting}
                                >
                                    {showAllColors ? 'Скрыть' : `+${COLORS.length - 8}`}
                                    {showAllColors ? <FaChevronUp /> : <FaChevronDown />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Описание</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            placeholder="Описание занятия (необязательно)"
                            rows="3"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Сохранение...' : <><FaSave /> {initialData ? 'Сохранить' : 'Создать'}</>}
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ========== КОМПОНЕНТ ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ ==========
const DeleteConfirmation = ({ onConfirm, onCancel }) => {
    return (
        <div className="delete-confirmation">
            <FaExclamationTriangle className="delete-icon" />
            <p>Вы уверены, что хотите удалить это занятие?</p>
            <p className="delete-warning">Это действие нельзя отменить</p>
            <div className="delete-actions">
                <button className="btn-confirm" onClick={onConfirm}>Удалить</button>
                <button className="btn-cancel" onClick={onCancel}>Отмена</button>
            </div>
        </div>
    );
};

// ========== КОМПОНЕНТ КАРТОЧКИ ==========
const ActivityCard = ({ activity, onEdit, onDelete, permissions }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowConfirm(true);
    };

    const handleConfirmDelete = (e) => {
        e.stopPropagation();
        onDelete(activity.id);
        setShowConfirm(false);
    };

    const handleCancelDelete = (e) => {
        e.stopPropagation();
        setShowConfirm(false);
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEdit(activity);
    };

    const cardStyle = {
        borderLeftColor: activity.color || '#21435A',
        backgroundColor: `${activity.color}10` || '#f8f9fa'
    };

    if (showConfirm) {
        return (
            <div className="activity-card delete-mode" style={cardStyle}>
                <DeleteConfirmation 
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            </div>
        );
    }

    return (
        <div 
            className="activity-card"
            style={cardStyle}
        >
            {(permissions.canEdit || permissions.canDelete) && (
                <div className="card-actions">
                    {permissions.canEdit && (
                        <button className="edit-btn" onClick={handleEditClick} title="Редактировать">
                            <FaEdit />
                        </button>
                    )}
                    {permissions.canDelete && (
                        <button className="delete-btn" onClick={handleDeleteClick} title="Удалить">
                            <FaTrash />
                        </button>
                    )}
                </div>
            )}
            <h4 className="activity-title">{activity.title}</h4>
            <div className="activity-info">
                <div><FaRegUser /> {activity.teacher}</div>
                <div><FaRegClock /> {activity.startTime}—{activity.endTime}</div>
                <div><FaRegBuilding /> {activity.room}</div>
            </div>
            {activity.description && (
                <div className="activity-description">{activity.description}</div>
            )}
        </div>
    );
};

// ========== КОМПОНЕНТ ДНЯ ==========
const DayColumn = ({ day, activities, onEdit, onDelete, permissions }) => {
    const dayActivities = activities
        .filter(a => a.days.includes(day.name))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
        <div className="day-column">
            <div className="day-header">
                <span className="day-short">{day.short}</span>
                <span className="day-full">{day.name}</span>
                <span className="day-count">{dayActivities.length}</span>
            </div>
            
            <div className="day-content">
                {dayActivities.length === 0 ? (
                    <div className="day-empty">
                        <span>Нет занятий</span>
                    </div>
                ) : (
                    dayActivities.map(activity => (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            permissions={permissions}
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
    const [notification, setNotification] = useState(null);

    const permissions = usePermissions();

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = () => {
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
                        color: "#4CAF50",
                        room: "Каб. 203",
                        description: "Развитие логического мышления"
                    },
                    {
                        id: 2,
                        title: "Рисование",
                        teacher: "Петрова М.И.",
                        days: ["Вторник", "Четверг"],
                        startTime: "14:30",
                        endTime: "16:00",
                        color: "#2196F3",
                        room: "Актовый зал",
                        description: "Акварель, гуашь"
                    },
                    {
                        id: 3,
                        title: "Спортивная гимнастика",
                        teacher: "Сидоров В.Г.",
                        days: ["Понедельник", "Пятница"],
                        startTime: "16:00",
                        endTime: "17:30",
                        color: "#F44336",
                        room: "Спортзал",
                        description: "ОФП, акробатика"
                    }
                ];
                setActivities(demo);
                localStorage.setItem('activities', JSON.stringify(demo));
            }
        } catch (error) {
            showNotification('Ошибка при загрузке данных', 'error');
        } finally {
            setLoading(false);
        }
    };

    const saveActivities = useCallback((newActivities) => {
        try {
            setActivities(newActivities);
            localStorage.setItem('activities', JSON.stringify(newActivities));
        } catch (error) {
            showNotification('Ошибка при сохранении данных', 'error');
        }
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleCreate = (activity) => {
        if (!permissions.canCreate) {
            showNotification('У вас нет прав для создания занятий', 'error');
            return;
        }

        try {
            const newActivity = {
                ...activity,
                id: Date.now()
            };
            saveActivities([...activities, newActivity]);
            showNotification('Занятие успешно создано');
        } catch (error) {
            showNotification('Ошибка при создании занятия', 'error');
        }
    };

    const handleUpdate = (activity) => {
        if (!permissions.canEdit) {
            showNotification('У вас нет прав для редактирования занятий', 'error');
            return;
        }

        try {
            saveActivities(activities.map(a => a.id === activity.id ? activity : a));
            setEditingActivity(null);
            showNotification('Занятие успешно обновлено');
        } catch (error) {
            showNotification('Ошибка при обновлении занятия', 'error');
        }
    };

    const handleDelete = (id) => {
        if (!permissions.canDelete) {
            showNotification('У вас нет прав для удаления занятий', 'error');
            return;
        }

        try {
            saveActivities(activities.filter(a => a.id !== id));
            showNotification('Занятие успешно удалено', 'info');
        } catch (error) {
            showNotification('Ошибка при удалении занятия', 'error');
        }
    };

    const handleEdit = (activity) => {
        if (!permissions.canEdit) {
            showNotification('У вас нет прав для редактирования занятий', 'error');
            return;
        }
        setEditingActivity(activity);
        setShowForm(true);
    };

    const filteredActivities = useMemo(() => {
        return activities.filter(a => {
            const matchSearch = !search || 
                a.title.toLowerCase().includes(search.toLowerCase()) ||
                a.teacher.toLowerCase().includes(search.toLowerCase()) ||
                a.room.toLowerCase().includes(search.toLowerCase());
            const matchTeacher = !filterTeacher || a.teacher === filterTeacher;
            return matchSearch && matchTeacher;
        });
    }, [activities, search, filterTeacher]);

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
            <div className="extracurricular-page">
                <div className="animated-bg">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-circle"></div>
                    ))}
                </div>
                <button className="back-btn" onClick={() => navigate('/')}>
                    <FaArrowLeft />
                </button>
                <Header />
                <main className="extracurricular-container">
                    <div className="loader">
                        <div className="spinner"></div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="extracurricular-page">
            <div className="animated-bg">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>
            
            <button className="back-btn" onClick={() => navigate('/')}>
                <FaArrowLeft />
            </button>

            <Header />

            <main className="extracurricular-container">
                {notification && (
                    <div className={`notification ${notification.type}`}>
                        {notification.message}
                    </div>
                )}

                <div className="header-compact">
                    <h1>
                        <FaRegCalendarAlt />
                        Внешкольные занятия
                    </h1>
                    <div className="header-actions">
                        <button 
                            className={`btn-filter ${showFilters || activeFiltersCount > 0 ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                            title="Фильтры"
                        >
                            <FaFilter />
                            {activeFiltersCount > 0 && (
                                <span className="filter-badge">{activeFiltersCount}</span>
                            )}
                        </button>
                        
                        {permissions.canCreate && (
                            <button 
                                className="btn-primary"
                                onClick={() => {
                                    setEditingActivity(null);
                                    setShowForm(true);
                                }}
                                title="Добавить занятие"
                            >
                                <FaPlus />
                            </button>
                        )}
                    </div>
                </div>

                <div className="stats-compact">
                    <span>Всего: {activities.length}</span>
                    {filteredActivities.length !== activities.length && (
                        <span>Показано: {filteredActivities.length}</span>
                    )}
                </div>

                {showFilters && (
                    <div className="filters-panel">
                        <input
                            type="text"
                            placeholder="Поиск..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="filter-input"
                        />
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
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className="btn-clear">
                                Очистить
                            </button>
                        )}
                    </div>
                )}

                <ActivityForm
                    isOpen={showForm}
                    onClose={() => {
                        setShowForm(false);
                        setEditingActivity(null);
                    }}
                    onSubmit={editingActivity ? handleUpdate : handleCreate}
                    initialData={editingActivity}
                />

                {!permissions.isAdmin && activities.length > 0 && (
                    <div className="view-mode-message">
                        <FaRegCalendarAlt className="view-icon" />
                        <p>Режим просмотра</p>
                    </div>
                )}

                {filteredActivities.length === 0 ? (
                    <div className="empty-state">
                        <FaRegCalendarAlt className="empty-icon" />
                        <h3>Нет занятий</h3>
                        <p>
                            {activeFiltersCount > 0
                                ? 'Попробуйте изменить параметры поиска'
                                : permissions.isAdmin 
                                    ? 'Создайте первое занятие'
                                    : 'Занятия появятся позже'}
                        </p>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className="btn-secondary">
                                Сбросить
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="days-row">
                        {WEEK_DAYS.map(day => (
                            <DayColumn
                                key={day.id}
                                day={day}
                                activities={filteredActivities}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                permissions={permissions}
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