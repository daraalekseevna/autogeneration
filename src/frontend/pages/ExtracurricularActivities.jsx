// src/frontend/pages/ExtracurricularActivities.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, 
    FaPlus, 
    FaUser, 
    FaPalette, 
    FaTrash, 
    FaSave, 
    FaTimes,
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
    FaExclamationTriangle,
    FaCheck,
    FaPrint,
    FaBell,
    FaShieldAlt
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import activityStorage from '../services/activityStorage';
import { COLORS, WEEK_DAYS, TIME_SLOTS, TEACHERS } from '../config/extracurricularData';
import styles from '../styles/ExtracurricularActivities.module.css';

// ========== КОМПОНЕНТ УВЕДОМЛЕНИЯ ==========
const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <FaCheck />,
        error: <FaExclamationTriangle />,
        info: <FaBell />
    };

    return (
        <div className={`${styles.notification} ${styles[type]}`}>
            <div className={styles.notificationContent}>
                <span className={styles.notificationIcon}>{icons[type]}</span>
                <span className={styles.notificationMessage}>{message}</span>
            </div>
            <button className={styles.notificationClose} onClick={onClose}>
                <FaTimes />
            </button>
        </div>
    );
};

// ========== КОМПОНЕНТ ФОРМЫ (УБРАНЫ УРОВЕНЬ И МАКСИМУМ УЧЕНИКОВ) ==========
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
        if (!form.title.trim()) newErrors.title = 'Введите название занятия';
        if (!form.teacher) newErrors.teacher = 'Выберите преподавателя';
        if (form.days.length === 0) newErrors.days = 'Выберите хотя бы один день недели';
        if (!form.room.trim()) newErrors.room = 'Укажите кабинет или место проведения';
        
        const start = parseInt(form.startTime.replace(':', ''));
        const end = parseInt(form.endTime.replace(':', ''));
        if (end <= start) newErrors.time = 'Время окончания должно быть позже времени начала';
        
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
                    id: initialData?.id,
                    studentsCount: initialData?.studentsCount || 0
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
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>
                        {initialData ? 'Редактировать занятие' : 'Создать новое занятие'}
                    </h2>
                    <button className={styles.modalClose} onClick={onClose} disabled={isSubmitting}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>
                            <FaBook className={styles.formIcon} />
                            Название занятия *
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({...form, title: e.target.value})}
                            placeholder="Например: Шахматный клуб, Рисование, Спортивная секция"
                            className={errors.title ? styles.error : ''}
                            disabled={isSubmitting}
                            autoFocus
                        />
                        {errors.title && <span className={styles.errorText}>{errors.title}</span>}
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>
                                <FaUser className={styles.formIcon} />
                                Преподаватель *
                            </label>
                            <select
                                value={form.teacher}
                                onChange={e => setForm({...form, teacher: e.target.value})}
                                className={errors.teacher ? styles.error : ''}
                                disabled={isSubmitting}
                            >
                                <option value="">Выберите преподавателя</option>
                                {TEACHERS.map(t => (
                                    <option key={t.id} value={t.name}>{t.name} ({t.subject})</option>
                                ))}
                            </select>
                            {errors.teacher && <span className={styles.errorText}>{errors.teacher}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>
                                <FaRegBuilding className={styles.formIcon} />
                                Кабинет / Место *
                            </label>
                            <input
                                type="text"
                                value={form.room}
                                onChange={e => setForm({...form, room: e.target.value})}
                                placeholder="Каб. 203, Спортзал, Актовый зал"
                                className={errors.room ? styles.error : ''}
                                disabled={isSubmitting}
                            />
                            {errors.room && <span className={styles.errorText}>{errors.room}</span>}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>
                            <FaRegCalendarAlt className={styles.formIcon} />
                            Дни недели *
                        </label>
                        <div className={styles.daysGrid}>
                            {WEEK_DAYS.map(day => (
                                <button
                                    key={day.id}
                                    type="button"
                                    className={`${styles.dayBtn} ${form.days.includes(day.name) ? styles.selected : ''}`}
                                    onClick={() => toggleDay(day.name)}
                                    disabled={isSubmitting}
                                >
                                    {day.short}
                                </button>
                            ))}
                        </div>
                        {errors.days && <span className={styles.errorText}>{errors.days}</span>}
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>
                                <FaRegClock className={styles.formIcon} />
                                Время начала *
                            </label>
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

                        <div className={styles.formGroup}>
                            <label>
                                <FaRegClock className={styles.formIcon} />
                                Время окончания *
                            </label>
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
                    {errors.time && <span className={styles.errorText}>{errors.time}</span>}

                    <div className={styles.formGroup}>
                        <label>
                            <FaPalette className={styles.formIcon} />
                            Цветовое оформление
                        </label>
                        <div className={styles.colorSelector}>
                            <div className={styles.selectedColor}>
                                <div className={styles.colorPreview} style={{ backgroundColor: form.color }} />
                                <span className={styles.colorCode}>{form.color}</span>
                            </div>
                            <div className={styles.colorGrid}>
                                {(showAllColors ? COLORS : COLORS.slice(0, 8)).map(color => (
                                    <button
                                        key={color.id}
                                        type="button"
                                        className={`${styles.colorBtn} ${form.color === color.code ? styles.active : ''}`}
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
                                    className={styles.showMoreBtn}
                                    onClick={() => setShowAllColors(!showAllColors)}
                                    disabled={isSubmitting}
                                >
                                    {showAllColors ? 'Скрыть' : `Показать еще ${COLORS.length - 8}`}
                                    {showAllColors ? <FaChevronUp /> : <FaChevronDown />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Описание</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            placeholder="Дополнительная информация о занятии"
                            rows="3"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                            {isSubmitting ? (
                                'Сохранение...'
                            ) : (
                                <>
                                    <FaSave /> {initialData ? 'Сохранить' : 'Создать'}
                                </>
                            )}
                        </button>
                        <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSubmitting}>
                            <FaTimes /> Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ========== КОМПОНЕНТ ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ ==========
const DeleteConfirmation = ({ onConfirm, onCancel, activityTitle }) => {
    return (
        <div className={styles.deleteConfirmation}>
            <FaExclamationTriangle className={styles.deleteIcon} />
            <p>Вы уверены, что хотите удалить занятие?</p>
            <p className={styles.deleteWarning}>
                <strong>"{activityTitle}"</strong> будет удалено
            </p>
            <div className={styles.deleteActions}>
                <button className={styles.btnConfirm} onClick={onConfirm}>
                    <FaTrash /> Удалить
                </button>
                <button className={styles.btnCancel} onClick={onCancel}>
                    <FaTimes /> Отмена
                </button>
            </div>
        </div>
    );
};

// ========== КОМПОНЕНТ КАРТОЧКИ (КОМПАКТНАЯ) ==========
const ActivityCard = React.memo(({ activity, onEdit, onDelete }) => {
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
        backgroundColor: `${activity.color}08` || '#f8f9fa'
    };

    if (showConfirm) {
        return (
            <div className={`${styles.activityCard} ${styles.deleteMode}`} style={cardStyle}>
                <DeleteConfirmation 
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    activityTitle={activity.title}
                />
            </div>
        );
    }

    return (
        <div className={styles.activityCard} style={cardStyle}>
            <div className={styles.cardActions}>
                <button className={styles.editBtn} onClick={handleEditClick} title="Редактировать">
                    <FaEdit />
                </button>
                <button className={styles.deleteBtn} onClick={handleDeleteClick} title="Удалить">
                    <FaTrash />
                </button>
            </div>
            <h4 className={styles.activityTitle}>{activity.title}</h4>
            <div className={styles.activityInfo}>
                <div><FaRegUser /> {activity.teacher}</div>
                <div><FaRegClock /> {activity.startTime} — {activity.endTime}</div>
                <div><FaRegBuilding /> {activity.room}</div>
            </div>
        </div>
    );
});

// ========== КОМПОНЕНТ ДНЯ ==========
const DayColumn = React.memo(({ day, activities, onEdit, onDelete }) => {
    const dayActivities = useMemo(() => 
        activities
            .filter(a => a.days.includes(day.name))
            .sort((a, b) => a.startTime.localeCompare(b.startTime)),
        [activities, day.name]
    );

    return (
        <div className={styles.dayColumn}>
            <div className={styles.dayHeader}>
                <div className={styles.dayHeaderLeft}>
                    <span className={styles.dayShort}>{day.short}</span>
                    <span className={styles.dayFull}>{day.full}</span>
                </div>
                <span className={styles.dayCount}>{dayActivities.length}</span>
            </div>
            
            <div className={styles.dayContent}>
                {dayActivities.length === 0 ? (
                    <div className={styles.dayEmpty}>
                        <FaRegCalendarAlt className={styles.emptyIconSmall} />
                        <span>Нет занятий</span>
                    </div>
                ) : (
                    dayActivities.map(activity => (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </div>
        </div>
    );
});

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
    const [filterDay, setFilterDay] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [notifications, setNotifications] = useState([]);
    
    const searchTimeoutRef = useRef(null);

    // Подписка на изменения в хранилище
    useEffect(() => {
        loadData();
        
        const unsubscribe = activityStorage.subscribe((newData) => {
            setActivities(newData);
        });
        
        return unsubscribe;
    }, []);

    const loadData = () => {
        setLoading(true);
        try {
            const data = activityStorage.getAll();
            setActivities(data);
        } catch (error) {
            console.error('Error loading data:', error);
            showNotification('Ошибка при загрузке данных', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    const handleCreate = useCallback((activityData) => {
        try {
            const newActivity = activityStorage.create(activityData);
            showNotification(`Занятие "${newActivity.title}" создано`);
            setShowForm(false);
        } catch (error) {
            console.error('Error creating activity:', error);
            showNotification('Ошибка при создании', 'error');
        }
    }, []);

    const handleUpdate = useCallback((activityData) => {
        try {
            const updatedActivity = activityStorage.update(activityData.id, activityData);
            showNotification(`Занятие "${updatedActivity.title}" обновлено`);
            setShowForm(false);
            setEditingActivity(null);
        } catch (error) {
            console.error('Error updating activity:', error);
            showNotification('Ошибка при обновлении', 'error');
        }
    }, []);

    const handleDelete = useCallback((id) => {
        const activity = activityStorage.getById(id);
        if (!activity) return;
        
        try {
            activityStorage.delete(id);
            showNotification(`Занятие "${activity.title}" удалено`, 'info');
        } catch (error) {
            console.error('Error deleting activity:', error);
            showNotification('Ошибка при удалении', 'error');
        }
    }, []);

    const handleEdit = useCallback((activity) => {
        setEditingActivity(activity);
        setShowForm(true);
    }, []);

    // Функция печати
    const handlePrint = () => {
        window.print();
    };

    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            localStorage.setItem('activities_filters', JSON.stringify({
                search: value,
                teacher: filterTeacher,
                day: filterDay,
                level: filterLevel
            }));
        }, 300);
    };

    const filteredActivities = useMemo(() => {
        const filters = {};
        if (filterTeacher) filters.teacher = filterTeacher;
        if (filterDay) filters.day = filterDay;
        if (filterLevel) filters.level = filterLevel;
        if (search) filters.search = search;
        
        let filtered = activityStorage.filter(filters);
        
        if (Object.keys(filters).length === 0) {
            filtered = activities;
        }
        
        return filtered;
    }, [activities, search, filterTeacher, filterDay, filterLevel]);

    const teachers = useMemo(() => {
        return [...new Set(activities.map(a => a.teacher))];
    }, [activities]);

    const clearFilters = () => {
        setSearch('');
        setFilterTeacher('');
        setFilterDay('');
        setFilterLevel('');
        showNotification('Фильтры сброшены', 'info');
    };

    const activeFiltersCount = (search ? 1 : 0) + (filterTeacher ? 1 : 0) + (filterDay ? 1 : 0) + (filterLevel ? 1 : 0);

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.animatedBg}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={styles.glassCircle}></div>
                    ))}
                </div>
                <button className={styles.backBtn} onClick={() => navigate('/')}>
                    <FaArrowLeft />
                    <span>Назад</span>
                </button>
                <Header />
                <main className={styles.container}>
                    <div className={styles.loader}>
                        <div className={styles.spinner}></div>
                        <p className={styles.loadingText}>Загрузка...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.animatedBg}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={styles.glassCircle}></div>
                ))}
            </div>
            
            <button className={styles.backBtn} onClick={() => navigate('/')}>
                <FaArrowLeft />
                <span>Назад</span>
            </button>

            <Header />

            <main className={styles.container}>
                {notifications.map(notif => (
                    <Notification
                        key={notif.id}
                        message={notif.message}
                        type={notif.type}
                        onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                    />
                ))}

                <div className={styles.adminBanner}>
                    <FaShieldAlt className={styles.adminBannerIcon} />
                    <div className={styles.adminBannerContent}>
                        <strong>Панель администратора</strong>
                        <span>Полный доступ к расписанию</span>
                    </div>
                </div>

                <div className={styles.headerCompact}>
                    <div className={styles.headerTitle}>
                        <h1>
                            <FaRegCalendarAlt />
                            Внешкольные занятия
                        </h1>
                    </div>
                    
                    <div className={styles.headerActions}>
                        {/* Кнопка печати */}
                        <button 
                            className={styles.iconBtn}
                            onClick={handlePrint}
                            title="Распечатать расписание"
                        >
                            <FaPrint />
                        </button>

                        <button 
                            className={`${styles.btnFilter} ${(showFilters || activeFiltersCount > 0) ? styles.active : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FaFilter />
                            {activeFiltersCount > 0 && <span className={styles.filterBadge}>{activeFiltersCount}</span>}
                        </button>
                        
                        <button 
                            className={styles.btnPrimary}
                            onClick={() => {
                                setEditingActivity(null);
                                setShowForm(true);
                            }}
                        >
                            <FaPlus />
                        </button>
                    </div>
                </div>

                <div className={styles.statsCompact}>
                    <span>Всего: {activities.length}</span>
                    {filteredActivities.length !== activities.length && (
                        <span>Показано: {filteredActivities.length}</span>
                    )}
                </div>

                {showFilters && (
                    <div className={styles.filtersPanel}>
                        <div className={styles.filterGroup}>
                            <FaSearch className={styles.filterIcon} />
                            <input
                                type="text"
                                placeholder="Поиск..."
                                value={search}
                                onChange={e => handleSearchChange(e.target.value)}
                                className={styles.filterInput}
                            />
                        </div>
                        
                        <div className={styles.filterGroup}>
                            <FaUser className={styles.filterIcon} />
                            <select
                                value={filterTeacher}
                                onChange={e => setFilterTeacher(e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="">Все преподаватели</option>
                                {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <FaRegCalendarAlt className={styles.filterIcon} />
                            <select
                                value={filterDay}
                                onChange={e => setFilterDay(e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="">Все дни</option>
                                {WEEK_DAYS.map(day => <option key={day.id} value={day.name}>{day.name}</option>)}
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <FaUser className={styles.filterIcon} />
                            <select
                                value={filterLevel}
                                onChange={e => setFilterLevel(e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="">Все уровни</option>
                                <option value="beginner">Начинающий</option>
                                <option value="intermediate">Средний</option>
                                <option value="advanced">Продвинутый</option>
                            </select>
                        </div>

                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className={styles.btnClear}>
                                <FaTimes /> Сброс
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

                {filteredActivities.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaRegCalendarAlt className={styles.emptyIcon} />
                        <h3>Нет занятий</h3>
                        <p>
                            {activeFiltersCount > 0
                                ? 'Измените параметры поиска'
                                : 'Создайте первое занятие'}
                        </p>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className={styles.btnSecondary}>
                                Сбросить фильтры
                            </button>
                        )}
                        {filteredActivities.length === 0 && activeFiltersCount === 0 && (
                            <button onClick={() => setShowForm(true)} className={styles.btnPrimary}>
                                <FaPlus /> Создать
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.daysRow}>
                        {WEEK_DAYS.map(day => (
                            <DayColumn
                                key={day.id}
                                day={day}
                                activities={filteredActivities}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
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