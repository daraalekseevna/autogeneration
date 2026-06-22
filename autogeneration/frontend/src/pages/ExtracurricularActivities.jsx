import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
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
    FaUniversity
} from 'react-icons/fa';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import { extracurricularAPI } from '../services/extracurricularAPI';
import { COLORS, WEEK_DAYS, TIME_SLOTS } from '../config/extracurricularData';
import styles from '../styles/ExtracurricularActivities.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

const ActivityForm = ({ isOpen, onClose, onSubmit, initialData, extendedTeachers }) => {
    const [form, setForm] = useState({
        teacherId: '',
        sectionId: '',
        sectionName: '',
        teacherName: '',
        teacherColor: '#21435A',
        days: [],
        startTime: '15:00',
        endTime: '16:00',
        room: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableSections, setAvailableSections] = useState([]);

    // При выборе учителя, загружаем его секции
    useEffect(() => {
        if (form.teacherId && extendedTeachers) {
            const teacher = extendedTeachers.find(t => t.id === parseInt(form.teacherId));
            if (teacher && teacher.sections) {
                setAvailableSections(teacher.sections);
            } else {
                setAvailableSections([]);
            }
        }
    }, [form.teacherId, extendedTeachers]);

    useEffect(() => {
        if (initialData) {
            setForm({
                teacherId: initialData.teacherId || '',
                sectionId: initialData.sectionId || '',
                sectionName: initialData.sectionName || '',
                teacherName: initialData.teacherName || '',
                teacherColor: initialData.teacherColor || '#21435A',
                days: initialData.days || [],
                startTime: initialData.startTime || '15:00',
                endTime: initialData.endTime || '16:00',
                room: initialData.room || '',
                description: initialData.description || ''
            });
        } else {
            setForm({
                teacherId: '',
                sectionId: '',
                sectionName: '',
                teacherName: '',
                teacherColor: '#21435A',
                days: [],
                startTime: '15:00',
                endTime: '16:00',
                room: '',
                description: ''
            });
        }
        setAvailableSections([]);
        setErrors({});
        setIsSubmitting(false);
    }, [initialData, isOpen, extendedTeachers]);

    const validate = () => {
        const newErrors = {};
        if (!form.teacherId) newErrors.teacherId = 'Выберите преподавателя';
        if (!form.sectionId) newErrors.sectionId = 'Выберите секцию';
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
                const selectedTeacher = extendedTeachers?.find(t => t.id === parseInt(form.teacherId));
                const selectedSection = availableSections.find(s => s.id === parseInt(form.sectionId));
                
                if (!selectedTeacher || !selectedSection) {
                    console.error('Teacher or section not found', { selectedTeacher, selectedSection });
                    throw new Error('Данные не найдены');
                }
                
                const submitData = {
                    teacherId: parseInt(form.teacherId),
                    sectionId: parseInt(form.sectionId),
                    sectionName: selectedSection.section_name,
                    teacherName: selectedTeacher.name || `${selectedTeacher.lastName || ''} ${selectedTeacher.firstName || ''} ${selectedTeacher.middleName || ''}`.trim(),
                    teacherColor: selectedTeacher.color || selectedSection.section_color || '#21435A',
                    days: form.days,
                    startTime: form.startTime,
                    endTime: form.endTime,
                    room: form.room,
                    description: form.description,
                    id: initialData?.id
                };
                
                console.log('Submitting data:', submitData);
                await onSubmit(submitData);
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

    const handleTeacherChange = (teacherId) => {
        const selectedTeacher = extendedTeachers?.find(t => t.id === parseInt(teacherId));
        setForm(prev => ({
            ...prev,
            teacherId,
            sectionId: '',
            sectionName: '',
            teacherName: selectedTeacher?.name || `${selectedTeacher?.lastName || ''} ${selectedTeacher?.firstName || ''} ${selectedTeacher?.middleName || ''}`.trim() || '',
            teacherColor: selectedTeacher?.color || '#21435A'
        }));
        if (errors.teacherId) setErrors(prev => ({ ...prev, teacherId: null }));
    };

    const handleSectionChange = (sectionId) => {
        const selected = availableSections.find(s => s.id === parseInt(sectionId));
        setForm(prev => ({
            ...prev,
            sectionId,
            sectionName: selected?.section_name || '',
            teacherColor: selected?.section_color || prev.teacherColor
        }));
        if (errors.sectionId) setErrors(prev => ({ ...prev, sectionId: null }));
    };

    const formatTime = (time) => {
        return time ? time.substring(0, 5) : time;
    };

    // Группируем учителей по уникальным ID
    const uniqueTeachers = useMemo(() => {
        const seen = new Set();
        return (extendedTeachers || []).filter(t => {
            if (seen.has(t.id)) return false;
            seen.add(t.id);
            return true;
        });
    }, [extendedTeachers]);

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
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>
                                <FaUser className={styles.formIcon} />
                                Преподаватель *
                            </label>
                            <select
                                value={form.teacherId}
                                onChange={e => handleTeacherChange(e.target.value)}
                                className={errors.teacherId ? styles.error : ''}
                                disabled={isSubmitting}
                            >
                                <option value="">Выберите преподавателя</option>
                                {uniqueTeachers.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name || `${t.lastName || ''} ${t.firstName || ''} ${t.middleName || ''}`.trim() || 'Без имени'}
                                    </option>
                                ))}
                            </select>
                            {errors.teacherId && <span className={styles.errorText}>{errors.teacherId}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>
                                <FaUniversity className={styles.formIcon} />
                                Секция / Кружок *
                            </label>
                            <select
                                value={form.sectionId}
                                onChange={e => handleSectionChange(e.target.value)}
                                className={errors.sectionId ? styles.error : ''}
                                disabled={isSubmitting || !form.teacherId}
                            >
                                <option value="">Выберите секцию</option>
                                {availableSections.map(s => (
                                    <option key={s.id} value={s.id}>{s.section_name}</option>
                                ))}
                            </select>
                            {errors.sectionId && <span className={styles.errorText}>{errors.sectionId}</span>}
                            {form.teacherId && availableSections.length === 0 && !isSubmitting && (
                                <span className={styles.warningText}>У выбранного преподавателя нет секций</span>
                            )}
                        </div>
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
                                    <option key={slot.id} value={slot.value}>
                                        {formatTime(slot.value)}
                                    </option>
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
                                    <option key={slot.id} value={slot.value}>
                                        {formatTime(slot.value)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {errors.time && <span className={styles.errorText}>{errors.time}</span>}

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

const ActivityCard = React.memo(({ activity, onEdit, onDelete, canEdit }) => {
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
        borderLeftColor: activity.teacherColor || '#21435A',
        backgroundColor: `${activity.teacherColor || '#21435A'}08`
    };

    const formatTime = (time) => {
        return time ? time.substring(0, 5) : time;
    };

    if (showConfirm) {
        return (
            <div className={`${styles.activityCard} ${styles.deleteMode}`} style={cardStyle}>
                <DeleteConfirmation 
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    activityTitle={activity.sectionName || activity.title}
                />
            </div>
        );
    }

    return (
        <div className={styles.activityCard} style={cardStyle}>
            {canEdit && (
                <div className={styles.cardActions}>
                    <button className={styles.editBtn} onClick={handleEditClick} title="Редактировать">
                        <FaEdit />
                    </button>
                    <button className={styles.deleteBtn} onClick={handleDeleteClick} title="Удалить">
                        <FaTrash />
                    </button>
                </div>
            )}
            <h4 className={styles.activityTitle}>{activity.sectionName || activity.title}</h4>
            <div className={styles.activityInfo}>
                <div><FaRegUser /> {activity.teacherName}</div>
                <div><FaRegClock /> {formatTime(activity.startTime)} — {formatTime(activity.endTime)}</div>
                <div><FaRegBuilding /> {activity.room}</div>
            </div>
        </div>
    );
});

const DayColumn = React.memo(({ day, activities, onEdit, onDelete, canEdit }) => {
    const dayActivities = useMemo(() => 
        activities
            .filter(a => a.days && a.days.includes(day.name))
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
                            canEdit={canEdit}
                        />
                    ))
                )}
            </div>
        </div>
    );
});

const ExtracurricularActivities = () => {
    const navigate = useNavigate();
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRole = user?.role || 'guest';
    const canEdit = userRole === 'admin' || userRole === 'superadmin';
    
    const [activities, setActivities] = useState([]);
    const [extendedTeachers, setExtendedTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterDay, setFilterDay] = useState('');
    const [notifications, setNotifications] = useState([]);
    
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        loadData();
        loadExtendedTeachers();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await extracurricularAPI.getAll();
            console.log('Loaded activities:', data);
            setActivities(data);
        } catch (error) {
            console.error('Error loading data:', error);
            showNotification('Ошибка при загрузке данных', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadExtendedTeachers = async () => {
        try {
            const token = localStorage.getItem('token');
            // ✅ ИСПРАВЛЕНО: используем полный URL с API_URL
            const response = await axios.get(`${API_URL}/superadmin/extended-teachers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = response.data;
            console.log('✅ Загружены педагоги доп. образования:', data);
            
            // Трансформируем данные: создаем поле name из ФИО и структурируем секции
            const transformedTeachers = data.map(teacher => {
                // Формируем полное имя
                const fullName = `${teacher.last_name || ''} ${teacher.first_name || ''} ${teacher.middle_name || ''}`.trim();
                
                // Создаем секцию для этого педагога
                const section = {
                    id: teacher.id,
                    section_name: teacher.section_name || '',
                    section_color: teacher.section_color || '#ff6b6b'
                };
                
                return {
                    id: teacher.id,
                    name: fullName || 'Без имени',
                    lastName: teacher.last_name || '',
                    firstName: teacher.first_name || '',
                    middleName: teacher.middle_name || '',
                    color: teacher.section_color || teacher.color || '#ff6b6b',
                    sectionName: teacher.section_name || '',
                    sectionColor: teacher.section_color || '#ff6b6b',
                    schoolTeacherId: teacher.school_teacher_id || null,
                    isSchoolTeacher: !!teacher.school_teacher_id,
                    // Секции - массив с одной секцией (у каждого педагога может быть несколько)
                    sections: teacher.sections || [section]
                };
            });
            
            setExtendedTeachers(transformedTeachers);
        } catch (error) {
            console.error('❌ Error loading extended teachers:', error);
            // Fallback: используем данные из extracurricularAPI
            try {
                const teachers = await extracurricularAPI.getExtendedTeachers();
                console.log('📋 Fallback teachers:', teachers);
                const transformedFallback = teachers.map(teacher => {
                    const fullName = teacher.name || `${teacher.last_name || ''} ${teacher.first_name || ''} ${teacher.middle_name || ''}`.trim();
                    const section = {
                        id: teacher.id,
                        section_name: teacher.section_name || '',
                        section_color: teacher.section_color || '#ff6b6b'
                    };
                    return {
                        ...teacher,
                        name: fullName || 'Без имени',
                        color: teacher.section_color || teacher.color || '#ff6b6b',
                        sections: teacher.sections || [section]
                    };
                });
                setExtendedTeachers(transformedFallback);
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
                setExtendedTeachers([]);
            }
        }
    };

    const showNotification = (message, type = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    const handleCreate = useCallback(async (activityData) => {
        if (!canEdit) return;
        try {
            const newActivity = await extracurricularAPI.create(activityData);
            setActivities(prev => [...prev, newActivity]);
            showNotification(`Занятие "${newActivity.sectionName}" создано`);
            setShowForm(false);
        } catch (error) {
            console.error('Error creating activity:', error);
            showNotification('Ошибка при создании', 'error');
        }
    }, [canEdit]);

    const handleUpdate = useCallback(async (activityData) => {
        if (!canEdit) return;
        try {
            const updatedActivity = await extracurricularAPI.update(activityData.id, activityData);
            setActivities(prev => prev.map(a => a.id === updatedActivity.id ? updatedActivity : a));
            showNotification(`Занятие "${updatedActivity.sectionName}" обновлено`);
            setShowForm(false);
            setEditingActivity(null);
        } catch (error) {
            console.error('Error updating activity:', error);
            showNotification('Ошибка при обновлении', 'error');
        }
    }, [canEdit]);

    const handleDelete = useCallback(async (id) => {
        if (!canEdit) return;
        const activity = activities.find(a => a.id === id);
        if (!activity) return;
        
        try {
            await extracurricularAPI.delete(id);
            setActivities(prev => prev.filter(a => a.id !== id));
            showNotification(`Занятие "${activity.sectionName}" удалено`, 'info');
        } catch (error) {
            console.error('Error deleting activity:', error);
            showNotification('Ошибка при удалении', 'error');
        }
    }, [canEdit, activities]);

    const handleEdit = useCallback((activity) => {
        if (!canEdit) return;
        setEditingActivity(activity);
        setShowForm(true);
    }, [canEdit]);

    const handlePrint = () => {
        const printHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Расписание внеурочной деятельности</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, Helvetica, sans-serif; padding: 20px; background: white; }
                    h1 { text-align: center; font-size: 18px; margin-bottom: 20px; color: #333; }
                    .days-row { display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; }
                    .day-column { flex: 0 0 calc(33.333% - 10px); border: 1px solid #ddd; border-radius: 12px; overflow: hidden; margin-bottom: 15px; background: white; }
                    .day-header { background: #21435A; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; color: white; }
                    .day-short { font-size: 16px; font-weight: bold; }
                    .day-full { font-size: 11px; opacity: 0.8; }
                    .day-count { background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 20px; font-size: 11px; }
                    .day-content { padding: 10px; }
                    .activity-card { border-left: 3px solid; padding: 8px; margin-bottom: 8px; background: #fafafa; border-radius: 8px; break-inside: avoid; }
                    .activity-title { font-weight: bold; font-size: 12px; margin-bottom: 5px; color: #333; }
                    .activity-info { font-size: 10px; color: #666; }
                    .activity-info div { margin-bottom: 2px; }
                    .day-empty { text-align: center; padding: 20px; color: #999; font-size: 11px; }
                    @media print { body { padding: 0; margin: 0; } .day-column { break-inside: avoid; } }
                </style>
            </head>
            <body>
                <h1>Расписание внеурочной деятельности</h1>
                <div class="days-row">
                    ${WEEK_DAYS.map(day => {
                        const dayActivities = filteredActivities.filter(a => a.days && a.days.includes(day.name));
                        return `
                            <div class="day-column">
                                <div class="day-header">
                                    <div>
                                        <div class="day-short">${day.short}</div>
                                        <div class="day-full">${day.full}</div>
                                    </div>
                                    <div class="day-count">${dayActivities.length}</div>
                                </div>
                                <div class="day-content">
                                    ${dayActivities.length === 0 ? `
                                        <div class="day-empty">Нет занятий</div>
                                    ` : `
                                        ${dayActivities.map(activity => `
                                            <div class="activity-card" style="border-left-color: ${activity.teacherColor || '#21435A'}">
                                                <div class="activity-title">${activity.sectionName}</div>
                                                <div class="activity-info">
                                                    <div>${activity.teacherName}</div>
                                                    <div>${activity.startTime?.substring(0,5)} — ${activity.endTime?.substring(0,5)}</div>
                                                    <div>${activity.room}</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHtml);
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.print();
        };
    };

    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            localStorage.setItem('activities_filters', JSON.stringify({
                search: value,
                teacher: filterTeacher,
                day: filterDay
            }));
        }, 300);
    };

    // Создаем список учителей из extendedTeachers
    const teachersList = useMemo(() => {
        const seen = new Set();
        return (extendedTeachers || [])
            .filter(t => {
                if (seen.has(t.id)) return false;
                seen.add(t.id);
                return true;
            })
            .map(t => ({
                ...t,
                name: t.name || `${t.lastName || ''} ${t.firstName || ''} ${t.middleName || ''}`.trim() || 'Без имени'
            }));
    }, [extendedTeachers]);

    const filteredActivities = useMemo(() => {
        let filtered = [...activities];
        
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(a => 
                a.sectionName?.toLowerCase().includes(searchLower) ||
                a.teacherName?.toLowerCase().includes(searchLower) ||
                a.description?.toLowerCase().includes(searchLower)
            );
        }
        
        if (filterTeacher) {
            filtered = filtered.filter(a => a.teacherId === parseInt(filterTeacher));
        }
        
        if (filterDay) {
            filtered = filtered.filter(a => a.days?.includes(filterDay));
        }
        
        return filtered;
    }, [activities, search, filterTeacher, filterDay]);

    const clearFilters = () => {
        setSearch('');
        setFilterTeacher('');
        setFilterDay('');
        showNotification('Фильтры сброшены', 'info');
    };

    const activeFiltersCount = (search ? 1 : 0) + (filterTeacher ? 1 : 0) + (filterDay ? 1 : 0);

    if (loading) {
        return (
            <div className={styles.page}>
                <ThemeToggle />
                <BackButton fallbackPath="/" />
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
            <ThemeToggle />
            <BackButton fallbackPath="/" />
            
            <Header />

            <main className={styles.container}>
                {notifications.map((notif) => (
                    <Notification
                        key={notif.id}
                        message={notif.message}
                        type={notif.type}
                        onClose={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
                    />
                ))}

                <div className={styles.headerCompact}>
                    <div className={styles.headerTitle}>
                        <h1>
                            <FaRegCalendarAlt />
                            Внешкольные занятия
                        </h1>
                    </div>
                    
                    <div className={styles.headerActions}>
                        <button 
                            className={styles.iconBtn}
                            onClick={handlePrint}
                            title="Распечатать расписание"
                        >
                            <FaPrint />
                        </button>

                        {canEdit && (
                            <>
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
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.statsCompact}>
                    <span>Всего: {activities.length}</span>
                    {filteredActivities.length !== activities.length && (
                        <span>Показано: {filteredActivities.length}</span>
                    )}
                </div>

                {canEdit && showFilters && (
                    <div className={styles.filtersPanel}>
                        <div className={styles.filterGroup}>
                            <FaSearch className={styles.filterIcon} />
                            <input
                                type="text"
                                placeholder="Поиск по названию секции..."
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
                                {teachersList.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name || `${t.lastName || ''} ${t.firstName || ''} ${t.middleName || ''}`.trim() || 'Без имени'}
                                    </option>
                                ))}
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
                    extendedTeachers={extendedTeachers}
                />

                {filteredActivities.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaRegCalendarAlt className={styles.emptyIcon} />
                        <h3>Нет занятий</h3>
                        <p>
                            {activeFiltersCount > 0
                                ? 'Измените параметры поиска'
                                : 'Нет добавленных занятий'}
                        </p>
                        {canEdit && activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className={styles.btnSecondary}>
                                Сбросить фильтры
                            </button>
                        )}
                        {canEdit && filteredActivities.length === 0 && activeFiltersCount === 0 && (
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
                                canEdit={canEdit}
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