// components/tabs/TeachersTab.jsx
import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaChalkboardTeacher, FaEdit, FaTrash, FaBook, FaChevronDown, FaSave, FaTimes, FaSearch, FaCheck, FaUserEdit, FaSchool, FaGraduationCap, FaSpinner, FaPlus, FaPalette, FaBan, FaClock } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 60 уникальных цветов для учителей
const TEACHER_COLORS = [
    { name: 'Розовая пудра', value: '#fbc4c4' },
    { name: 'Мятная свежесть', value: '#b8f2e2' },
    { name: 'Лавандовый туман', value: '#d4b8ff' },
    { name: 'Персиковый закат', value: '#ffd4b8' },
    { name: 'Небесная лазурь', value: '#b8e2ff' },
    { name: 'Фисташковый крем', value: '#d4f0b8' },
    { name: 'Абрикосовый нектар', value: '#ffe0b8' },
    { name: 'Бирюзовая волна', value: '#b8f0f0' },
    { name: 'Коралловый риф', value: '#ffb8b8' },
    { name: 'Сиреневый сад', value: '#e8c4ff' },
    { name: 'Медовая роса', value: '#fff0b8' },
    { name: 'Васильковый луг', value: '#c4d4ff' },
    { name: 'Жемчужный', value: '#f0e6e6' },
    { name: 'Нефритовый', value: '#c4e8d4' },
    { name: 'Лазурный', value: '#d4e8ff' },
    { name: 'Вишнёвый', value: '#e83e3e' },
    { name: 'Изумрудный', value: '#2ecc71' },
    { name: 'Сапфировый', value: '#3498db' },
    { name: 'Янтарный', value: '#f1c40f' },
    { name: 'Аметистовый', value: '#9b59b6' },
    { name: 'Терракотовый', value: '#e67e22' },
    { name: 'Оливковый', value: '#7d8c2a' },
    { name: 'Морская волна', value: '#1abc9c' },
    { name: 'Карминный', value: '#e74c3c' },
    { name: 'Индиго', value: '#3f51b5' },
    { name: 'Горчичный', value: '#d4ac0d' },
    { name: 'Фуксия', value: '#e84393' },
    { name: 'Мандарин', value: '#ff8c42' },
    { name: 'Платиновый', value: '#5d6d7e' },
    { name: 'Баклажановый', value: '#8e44ad' },
    { name: 'Пыльная роза', value: '#c9a0a0' },
    { name: 'Морской бриз', value: '#7eb6b6' },
    { name: 'Лавандовый дым', value: '#a890c0' },
    { name: 'Карамель', value: '#d4a574' },
    { name: 'Джинсовый', value: '#6c8ebf' },
    { name: 'Шалфей', value: '#9bbf8a' },
    { name: 'Марсала', value: '#b85c5c' },
    { name: 'Чайная роза', value: '#c97b7b' },
    { name: 'Полынь', value: '#8faa7b' },
    { name: 'Вереск', value: '#b590c4' },
    { name: 'Горный хрусталь', value: '#7c9a9a' },
    { name: 'Античная бронза', value: '#c4a056' },
    { name: 'Тёмная лаванда', value: '#967bb6' },
    { name: 'Серо-голубой', value: '#8ba3b3' },
    { name: 'Ореховый', value: '#b59a6b' },
    { name: 'Алый', value: '#ff4444' },
    { name: 'Изумрудная зелень', value: '#00c853' },
    { name: 'Электрик', value: '#2979ff' },
    { name: 'Мандарин яркий', value: '#ff9800' },
    { name: 'Орхидея', value: '#e040fb' },
    { name: 'Бирюзовый яркий', value: '#00bcd4' },
    { name: 'Лимонный', value: '#cddc39' },
    { name: 'Клубничный', value: '#ff5252' },
    { name: 'Ментол', value: '#69f0ae' },
    { name: 'Глициния', value: '#c763d8' },
    { name: 'Коралл', value: '#ff7043' },
    { name: 'Циан', value: '#18ffff' },
    { name: 'Маджента', value: '#ff4081' },
    { name: 'Лайм', value: '#aeea00' },
    { name: 'Аквамарин', value: '#64ffda' }
];

const DAYS_RU = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье'
};

const TeachersTab = ({ teachers = [], lessons = [], token, onDataChange }) => {
    const [newTeacher, setNewTeacher] = useState({ 
        lastName: '', firstName: '', middleName: '', 
        lessonIds: [], classIds: [],
        login: '', password: '', color: '#b8e2ff',
        maxConsecutiveLessons: 5,
        unavailableDays: []
    });
    const [editTeacherModalOpen, setEditTeacherModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [lessonSelectorModalOpen, setLessonSelectorModalOpen] = useState(false);
    const [classSelectorModalOpen, setClassSelectorModalOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [tempLessonIds, setTempLessonIds] = useState([]);
    const [tempClassIds, setTempClassIds] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [notification, setNotification] = useState('');
    const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
    const [tempColor, setTempColor] = useState('#b8e2ff');
    const [colorPickerTarget, setColorPickerTarget] = useState(null);

    // Загружаем список классов из БД
    useEffect(() => {
        const loadClasses = async () => {
            if (!token) return;
            setLoadingClasses(true);
            try {
                const response = await axios.get(`${API_URL}/superadmin/classes`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClasses(response.data || []);
            } catch (err) {
                console.error('Error loading classes:', err);
            } finally {
                setLoadingClasses(false);
            }
        };
        loadClasses();
    }, [token]);

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const clearTeacherForm = () => setNewTeacher({ 
        lastName: '', firstName: '', middleName: '', 
        lessonIds: [], classIds: [], 
        login: '', password: '', color: '#b8e2ff',
        maxConsecutiveLessons: 5,
        unavailableDays: []
    });

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        if (!newTeacher.lastName || !newTeacher.firstName || !newTeacher.login || !newTeacher.password) {
            showNotification('Заполните фамилию, имя, логин и пароль');
            return;
        }
        try {
            await axios.post(`${API_URL}/superadmin/teachers`, {
                lastName: newTeacher.lastName,
                firstName: newTeacher.firstName,
                middleName: newTeacher.middleName,
                lessonIds: newTeacher.lessonIds,
                classIds: newTeacher.classIds,
                login: newTeacher.login,
                password: newTeacher.password,
                color: newTeacher.color,
                maxConsecutiveLessons: newTeacher.maxConsecutiveLessons || 5,
                unavailableDays: newTeacher.unavailableDays || []
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Учитель добавлен');
            clearTeacherForm();
            onDataChange();
        } catch (err) {
            console.error('Add teacher error:', err);
            showNotification(err.response?.data?.message || 'Ошибка');
        }
    };

    const handleDeleteTeacher = async (id) => {
        if (!window.confirm('Удалить учителя?')) return;
        try {
            await axios.delete(`${API_URL}/superadmin/teachers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Учитель удалён');
            onDataChange();
        } catch (err) {
            console.error('Delete teacher error:', err);
            showNotification('Ошибка удаления');
        }
    };

    const handleUpdateTeacher = async (teacherData) => {
        try {
            await axios.put(`${API_URL}/superadmin/teachers/${teacherData.id}`, {
                lastName: teacherData.lastName,
                firstName: teacherData.firstName,
                middleName: teacherData.middleName || '',
                color: teacherData.color,
                maxConsecutiveLessons: teacherData.maxConsecutiveLessons || 5,
                unavailableDays: teacherData.unavailableDays || []
            }, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Учитель обновлен');
            onDataChange();
            setEditTeacherModalOpen(false);
            setEditingTeacher(null);
        } catch (err) {
            console.error('Update error:', err);
            showNotification(err.response?.data?.message || 'Ошибка обновления');
            throw err;
        }
    };

    const handleUpdateTeacherColor = async (teacherId, newColor) => {
        try {
            await axios.put(`${API_URL}/superadmin/teachers/${teacherId}`, {
                color: newColor
            }, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Цвет обновлен');
            onDataChange();
        } catch (err) {
            console.error('Update color error:', err);
            showNotification('Ошибка обновления цвета');
            throw err;
        }
    };

    // Сохранение предметов
    const handleSaveLessons = async (selectedIds) => {
        if (currentTeacher) {
            try {
                await axios.put(`${API_URL}/superadmin/teachers/${currentTeacher.id}`, { lessonIds: selectedIds }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotification('Предметы обновлены');
                onDataChange();
            } catch (err) {
                console.error('Update lessons error:', err);
                showNotification('Ошибка обновления предметов');
                throw err;
            }
        } else {
            setNewTeacher(prev => ({ ...prev, lessonIds: selectedIds }));
        }
        setLessonSelectorModalOpen(false);
    };

    // Сохранение классов для учителя
    const handleSaveClassAssignments = async (selectedClassIds) => {
        if (currentTeacher) {
            try {
                await axios.put(`${API_URL}/superadmin/teachers/${currentTeacher.id}/class-assignments`, { 
                    classIds: selectedClassIds 
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotification('Классы назначены');
                onDataChange();
            } catch (err) {
                console.error('Update class assignments error:', err);
                showNotification('Ошибка назначения классов');
                throw err;
            }
        } else {
            setNewTeacher(prev => ({ ...prev, classIds: selectedClassIds }));
        }
        setClassSelectorModalOpen(false);
    };

    // Открыть модалку выбора предметов
    const openLessonSelectorModal = (teacher = null) => {
        if (teacher) {
            setCurrentTeacher(teacher);
            setTempLessonIds(teacher.lessonIds || []);
        } else {
            setCurrentTeacher(null);
            setTempLessonIds(newTeacher.lessonIds);
        }
        setLessonSelectorModalOpen(true);
    };

    // Открыть модалку выбора классов
    const openClassSelectorModal = (teacher = null) => {
        if (teacher) {
            setCurrentTeacher(teacher);
            loadTeacherClassAssignments(teacher.id);
        } else {
            setCurrentTeacher(null);
            setTempClassIds(newTeacher.classIds);
        }
        setClassSelectorModalOpen(true);
    };

    // Загрузить классы для учителя
    const loadTeacherClassAssignments = async (teacherId) => {
        try {
            const response = await axios.get(`${API_URL}/superadmin/teachers/${teacherId}/class-assignments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTempClassIds(response.data || []);
        } catch (err) {
            console.error('Error loading class assignments:', err);
            setTempClassIds([]);
        }
    };

    // Открыть палитру цветов
    const openColorPicker = (teacher = null) => {
        if (teacher) {
            setColorPickerTarget({ type: 'existing', id: teacher.id, currentColor: teacher.color || '#b8e2ff' });
            setTempColor(teacher.color || '#b8e2ff');
        } else {
            setColorPickerTarget({ type: 'new', currentColor: newTeacher.color });
            setTempColor(newTeacher.color);
        }
        setColorPickerModalOpen(true);
    };

    // Сохранить выбранный цвет
    const saveColor = async () => {
        if (colorPickerTarget?.type === 'existing') {
            await handleUpdateTeacherColor(colorPickerTarget.id, tempColor);
        } else {
            setNewTeacher(prev => ({ ...prev, color: tempColor }));
            showNotification('Цвет выбран');
        }
        setColorPickerModalOpen(false);
        setColorPickerTarget(null);
    };

    // Компонент модальной палитры цветов
    const ColorPickerModal = ({ isOpen, onClose, onSave, currentColor, onColorChange }) => {
        const [selectedColor, setSelectedColor] = useState(currentColor || '#b8e2ff');

        useEffect(() => {
            if (isOpen) {
                setSelectedColor(currentColor || '#b8e2ff');
                document.body.style.overflow = 'hidden';
            }
            return () => {
                document.body.style.overflow = 'unset';
            };
        }, [isOpen, currentColor]);

        const handleColorSelect = (colorValue) => {
            setSelectedColor(colorValue);
            onColorChange(colorValue);
        };

        const handleSave = () => {
            onSave();
            onClose();
        };

        if (!isOpen) return null;

        return (
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <div 
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        width: '400px',
                        maxWidth: '90%',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#21435A',
                        color: 'white'
                    }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaPalette size={14} /> Выбор цвета
                        </span>
                        <button 
                            onClick={onClose} 
                            type="button"
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                border: 'none',
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <FaTimes size={12} />
                        </button>
                    </div>
                    <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gap: '10px',
                            justifyItems: 'center'
                        }}>
                            {TEACHER_COLORS.map((color) => (
                                <div 
                                    key={color.value}
                                    onClick={() => handleColorSelect(color.value)}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: color.value,
                                        cursor: 'pointer',
                                        border: selectedColor === color.value ? '3px solid #21435A' : '2px solid transparent',
                                        boxShadow: selectedColor === color.value ? '0 0 0 2px white, 0 0 0 4px #21435A' : '0 1px 3px rgba(0,0,0,0.1)',
                                        transition: 'all 0.15s ease'
                                    }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                    <div style={{
                        padding: '10px 16px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f8fafc'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: selectedColor,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: '2px solid white'
                            }}></div>
                            <span style={{ fontSize: '0.7rem', color: '#475569' }}>{selectedColor}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={onClose} 
                                type="button"
                                style={{
                                    padding: '6px 14px',
                                    background: 'transparent',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: '#475569'
                                }}
                            >
                                Отмена
                            </button>
                            <button 
                                onClick={handleSave} 
                                type="button"
                                style={{
                                    padding: '6px 16px',
                                    background: '#21435A',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'white',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <FaCheck size={10} /> OK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Модалка выбора предметов
    const LessonSelectorModal = ({ isOpen, onClose, lessonsList = [], selectedIds, onSave, teacherName }) => {
        const [tempSelectedIds, setTempSelectedIds] = useState(selectedIds || []);
        const [searchTerm, setSearchTerm] = useState('');
        const [saving, setSaving] = useState(false);

        React.useEffect(() => {
            if (isOpen) {
                setTempSelectedIds(selectedIds || []);
                setSearchTerm('');
            }
        }, [isOpen, selectedIds]);

        const lessonsArray = Array.isArray(lessonsList) ? lessonsList : [];
        const filteredLessons = lessonsArray.filter(l => l && l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const toggleLesson = (lessonId) => {
            setTempSelectedIds(prev => prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);
        };

        const handleSave = async () => {
            if (saving) return;
            setSaving(true);
            try {
                await onSave(tempSelectedIds);
                onClose();
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="subject-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="subject-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="subject-modal-header">
                        <h3><FaBook /> Выбор предметов для {teacherName}</h3>
                        <button className="subject-modal-close" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                    </div>
                    <div className="subject-modal-search">
                        <FaSearch className="search-icon" />
                        <input type="text" placeholder="Поиск предметов..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={saving} />
                    </div>
                    <div className="subject-modal-list">
                        {filteredLessons.length === 0 ? (
                            <div className="subject-modal-empty"><FaBook /><p>Нет загруженных уроков</p></div>
                        ) : (
                            filteredLessons.map((lesson) => (
                                <div key={lesson.id} className="subject-modal-item">
                                    <input type="checkbox" id={`lesson-${lesson.id}`} checked={tempSelectedIds.includes(lesson.id)} onChange={() => toggleLesson(lesson.id)} disabled={saving} />
                                    <label htmlFor={`lesson-${lesson.id}`} className="subject-modal-item-name">
                                        {lesson.name}
                                        {lesson.shortName && <span className="lesson-short-name-hint"> ({lesson.shortName})</span>}
                                    </label>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="subject-modal-footer">
                        <div className="subject-modal-selected-count">Выбрано: {tempSelectedIds.length}</div>
                        <div className="subject-modal-actions">
                            <button className="subject-modal-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                            <button className="subject-modal-save" onClick={handleSave} disabled={filteredLessons.length === 0 || saving}><FaCheck /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Модалка выбора классов для учителя
    const ClassSelectorModal = ({ isOpen, onClose, classesList = [], selectedIds = [], onSave, teacherName }) => {
        const [tempSelectedIds, setTempSelectedIds] = useState(selectedIds || []);
        const [searchTerm, setSearchTerm] = useState('');
        const [saving, setSaving] = useState(false);

        React.useEffect(() => {
            if (isOpen) {
                setTempSelectedIds(selectedIds || []);
                setSearchTerm('');
            }
        }, [isOpen, selectedIds]);

        const classesArray = Array.isArray(classesList) ? classesList : [];
        const filteredClasses = classesArray.filter(c => 
            c && c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const toggleClass = (classId) => {
            setTempSelectedIds(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
        };

        const handleSave = async () => {
            if (saving) return;
            setSaving(true);
            try {
                await onSave(tempSelectedIds);
                onClose();
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="subject-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="subject-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                    <div className="subject-modal-header">
                        <h3><FaSchool /> Назначение классов для {teacherName}</h3>
                        <button className="subject-modal-close" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                    </div>
                    <div className="subject-modal-search">
                        <FaSearch className="search-icon" />
                        <input type="text" placeholder="Поиск классов..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={saving} />
                    </div>
                    <div className="subject-modal-list" style={{ maxHeight: '400px' }}>
                        {filteredClasses.length === 0 ? (
                            <div className="subject-modal-empty"><FaSchool /><p>Нет загруженных классов</p></div>
                        ) : (
                            filteredClasses.map((cls) => (
                                <div key={cls.id} className="subject-modal-item">
                                    <input 
                                        type="checkbox" 
                                        id={`class-${cls.id}`} 
                                        checked={tempSelectedIds.includes(cls.id)} 
                                        onChange={() => toggleClass(cls.id)} 
                                        disabled={saving} 
                                    />
                                    <label htmlFor={`class-${cls.id}`} className="subject-modal-item-name">
                                        {cls.name} класс
                                        {cls.teacher_name && <small style={{ marginLeft: '8px', color: '#94a3b8' }}>(рук. {cls.teacher_name})</small>}
                                    </label>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="subject-modal-footer">
                        <div className="subject-modal-selected-count">
                            <FaSchool /> Выбрано классов: {tempSelectedIds.length}
                        </div>
                        <div className="subject-modal-actions">
                            <button className="subject-modal-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                            <button className="subject-modal-save" onClick={handleSave} disabled={saving}>
                                <FaCheck /> {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Модалка редактирования учителя
    const EditTeacherModal = ({ isOpen, onClose, onSave, teacher }) => {
        const [formData, setFormData] = useState({ 
            lastName: '', firstName: '', middleName: '', color: '#b8e2ff',
            maxConsecutiveLessons: 5,
            unavailableDays: []
        });
        const [saving, setSaving] = useState(false);

        React.useEffect(() => {
            if (teacher && isOpen) {
                const parts = teacher.name?.split(' ') || [];
                setFormData({
                    lastName: parts[0] || '',
                    firstName: parts[1] || '',
                    middleName: parts.slice(2).join(' ') || '',
                    color: teacher.color || '#b8e2ff',
                    maxConsecutiveLessons: teacher.maxConsecutiveLessons || 5,
                    unavailableDays: teacher.unavailableDays || []
                });
            }
        }, [teacher, isOpen]);

        const handleDayToggle = (day) => {
            setFormData(prev => ({
                ...prev,
                unavailableDays: prev.unavailableDays.includes(day)
                    ? prev.unavailableDays.filter(d => d !== day)
                    : [...prev.unavailableDays, day]
            }));
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (saving) return;
            if (!formData.lastName || !formData.firstName) {
                alert('Заполните фамилию и имя');
                return;
            }
            setSaving(true);
            try {
                await onSave({ ...formData, id: teacher?.id });
                onClose();
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="subject-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="subject-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                    <div className="subject-modal-header">
                        <h3><FaUserEdit /> Редактировать учителя</h3>
                        <button className="subject-modal-close" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="room-modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Фамилия *</label>
                                    <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} disabled={saving} />
                                </div>
                                <div className="form-group">
                                    <label>Имя *</label>
                                    <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} disabled={saving} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Отчество</label>
                                <input type="text" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} disabled={saving} />
                            </div>
                            <div className="form-group">
                                <label>Цвет уроков</label>
                                <div className="color-selector-wrapper">
                                    <div 
                                        className="color-preview" 
                                        style={{ background: formData.color, cursor: 'pointer' }}
                                        onClick={() => openColorPicker({ id: teacher?.id, color: formData.color })}
                                    ></div>
                                    <button 
                                        type="button"
                                        className="color-picker-button"
                                        onClick={() => openColorPicker({ id: teacher?.id, color: formData.color })}
                                    >
                                        <FaPalette /> Выбрать цвет
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label><FaBan style={{ marginRight: '5px' }} /> Дни, в которые не ставить уроки</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.unavailableDays.includes(day)}
                                                onChange={() => handleDayToggle(day)}
                                                disabled={saving}
                                            />
                                            {DAYS_RU[day]}
                                        </label>
                                    ))}
                                </div>
                                <small style={{ color: '#64748b' }}>В выбранные дни учитель не будет вести уроки</small>
                            </div>
                            <div className="form-group">
                                <label><FaClock style={{ marginRight: '5px' }} /> Максимум уроков подряд</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="7" 
                                    value={formData.maxConsecutiveLessons} 
                                    onChange={e => setFormData({...formData, maxConsecutiveLessons: parseInt(e.target.value) || 5})}
                                    disabled={saving}
                                />
                                <small>Сколько уроков подряд может вести учитель (по умолчанию 5)</small>
                            </div>
                        </div>
                        <div className="room-modal-footer">
                            <button type="button" className="btn-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                            <button type="submit" className="btn-save" disabled={saving}><FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Отображение классов учителя в таблице
    const getTeacherClassesDisplay = (teacher) => {
        const classIds = teacher.classIds || [];
        const teacherClasses = classes.filter(c => classIds.includes(c.id));
        
        if (teacherClasses.length === 0) {
            return (
                <button 
                    className="add-classes-btn"
                    onClick={() => openClassSelectorModal(teacher)}
                >
                    <FaPlus size={10} /> Добавить классы
                </button>
            );
        }
        
        return (
            <div className="subjects-tags">
                {teacherClasses.slice(0, 2).map((cls, i) => (
                    <span key={i} className="class-tag">
                        {cls.name}
                    </span>
                ))}
                {teacherClasses.length > 2 && <span className="more-tag">+{teacherClasses.length - 2}</span>}
                <button 
                    className="edit-classes-btn"
                    onClick={() => openClassSelectorModal(teacher)}
                >
                    <FaEdit size={10} /> Изменить
                </button>
            </div>
        );
    };

const getTeacherConstraintsDisplay = (teacher) => {
    // Используем правильные имена полей из API (с подчёркиванием)
    const days = teacher.unavailable_days || [];
    const maxConsecutive = teacher.max_consecutive_lessons || 5;
    
    // Отладка - проверяем что приходит
    console.log('Teacher:', teacher.name, 'unavailable_days:', days, 'max_consecutive:', maxConsecutive);
    
    // Если нет ограничений
    if (days.length === 0 && maxConsecutive === 5) {
        return <span className="no-subjects">—</span>;
    }
    
    return (
        <div style={{ fontSize: '0.7rem' }}>
            {days.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                    <FaBan style={{ color: '#ef4444', marginRight: '4px' }} />
                    <span style={{ color: '#ef4444' }}>
                        Выходные: {days.map(d => DAYS_RU[d] || d).join(', ')}
                    </span>
                </div>
            )}
            {maxConsecutive !== 5 && (
                <div>
                    <FaClock style={{ color: '#f59e0b', marginRight: '4px' }} />
                    <span>Макс. {maxConsecutive} урока(ов) подряд</span>
                </div>
            )}
        </div>
    );
};
    const teachersArray = Array.isArray(teachers) ? teachers : [];
    const lessonsArray = Array.isArray(lessons) ? lessons : [];

    if (loadingClasses) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <FaSpinner className="spinner" style={{ fontSize: '2rem', color: '#21435A', animation: 'spin 1s linear infinite' }} />
                <p>Загрузка данных...</p>
            </div>
        );
    }

    return (
        <>
            {notification && <div className="notification">{notification}</div>}
            <div className="content-grid">
                {/* Форма добавления нового учителя */}
                <div className="form-container">
                    <h3 className="form-title"><FaUserPlus /> Новый учитель</h3>
                    <form onSubmit={handleAddTeacher}>
                        <div className="form-row">
                            <div className="form-group"><label>Фамилия *</label><input type="text" value={newTeacher.lastName} onChange={e => setNewTeacher({...newTeacher, lastName: e.target.value})} required /></div>
                            <div className="form-group"><label>Имя *</label><input type="text" value={newTeacher.firstName} onChange={e => setNewTeacher({...newTeacher, firstName: e.target.value})} required /></div>
                        </div>
                        <div className="form-group"><label>Отчество</label><input type="text" value={newTeacher.middleName} onChange={e => setNewTeacher({...newTeacher, middleName: e.target.value})} /></div>
                        <div className="form-row">
                            <div className="form-group"><label>Логин *</label><input type="text" value={newTeacher.login} onChange={e => setNewTeacher({...newTeacher, login: e.target.value})} required /></div>
                            <div className="form-group"><label>Пароль *</label><input type="password" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} required /></div>
                        </div>
                        <div className="form-group">
                            <label>Цвет уроков</label>
                            <div className="color-selector-wrapper">
                                <div 
                                    className="color-preview" 
                                    style={{ background: newTeacher.color, cursor: 'pointer' }}
                                    onClick={() => openColorPicker()}
                                ></div>
                                <button 
                                    type="button"
                                    className="color-picker-button"
                                    onClick={() => openColorPicker()}
                                >
                                    <FaPalette /> Выбрать цвет
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label><FaBan style={{ marginRight: '5px' }} /> Дни, в которые не ставить уроки</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                                    <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={newTeacher.unavailableDays.includes(day)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setNewTeacher({...newTeacher, unavailableDays: [...newTeacher.unavailableDays, day]});
                                                } else {
                                                    setNewTeacher({...newTeacher, unavailableDays: newTeacher.unavailableDays.filter(d => d !== day)});
                                                }
                                            }}
                                        />
                                        {DAYS_RU[day]}
                                    </label>
                                ))}
                            </div>
                            <small style={{ color: '#64748b' }}>В выбранные дни учитель не будет вести уроки</small>
                        </div>
                        <div className="form-group">
                            <label><FaClock style={{ marginRight: '5px' }} /> Максимум уроков подряд</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="7" 
                                value={newTeacher.maxConsecutiveLessons} 
                                onChange={e => setNewTeacher({...newTeacher, maxConsecutiveLessons: parseInt(e.target.value) || 5})}
                            />
                            <small>Сколько уроков подряд может вести учитель (по умолчанию 5)</small>
                        </div>
                        <div className="form-group">
                            <label>Предметы</label>
                            <div className="subject-selector-button" onClick={() => openLessonSelectorModal(null)}>
                                <div className="subject-selector-content"><FaBook /><span>{newTeacher.lessonIds.length === 0 ? 'Выберите предметы...' : `Выбрано: ${newTeacher.lessonIds.length}`}</span></div>
                                <FaChevronDown />
                            </div>
                            {newTeacher.lessonIds.length > 0 && (
                                <div className="subject-preview">
                                    {newTeacher.lessonIds.map(id => {
                                        const lesson = lessonsArray.find(l => l.id === id);
                                        return lesson ? <span key={id} className="subject-preview-tag">{lesson.name}</span> : null;
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Классы</label>
                            <div className="subject-selector-button" onClick={() => openClassSelectorModal(null)}>
                                <div className="subject-selector-content"><FaSchool /><span>{newTeacher.classIds.length === 0 ? 'Выберите классы...' : `Выбрано: ${newTeacher.classIds.length}`}</span></div>
                                <FaChevronDown />
                            </div>
                            {newTeacher.classIds.length > 0 && (
                                <div className="subject-preview">
                                    {newTeacher.classIds.map(id => {
                                        const cls = classes.find(c => c.id === id);
                                        return cls ? <span key={id} className="subject-preview-tag" style={{ background: '#10b981' }}>{cls.name}</span> : null;
                                    })}
                                </div>
                            )}
                        </div>
                        <button type="submit" className="submit-button">Добавить учителя</button>
                    </form>
                </div>
                
                {/* Таблица учителей */}
                <div className="table-container">
                    <h3 className="table-title"><FaChalkboardTeacher /> Список учителей ({teachersArray.length})</h3>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ФИО</th>
                                    <th>Цвет</th>
                                    <th>Предметы</th>
                                    <th>Классы</th>
                                    <th>Ограничения</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
<tbody>
    {teachersArray.map(teacher => (
        <tr key={teacher.id}>
            <td><strong>{teacher.name}</strong></td>
            <td>
                <div 
                    className="color-cell" 
                    style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px', 
                        background: teacher.color || '#b8e2ff', 
                        margin: '0 auto',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s'
                    }}
                    onClick={() => openColorPicker(teacher)}
                    title="Нажмите чтобы изменить цвет"
                ></div>
            </td>
            <td>
                <div className="subjects-tags">
                    {teacher.lessons?.length > 0 ? teacher.lessons.map((l, i) => <span key={i} className="subject-tag">{l.name}</span>) :
                     teacher.lessonIds?.length > 0 ? teacher.lessonIds.map(id => {
                        const lesson = lessonsArray.find(l => l.id === id);
                        return lesson ? <span key={id} className="subject-tag">{lesson.name}</span> : null;
                    }) : <span className="no-subjects">Нет предметов</span>}
                    <button className="edit-subjects-btn" onClick={() => openLessonSelectorModal(teacher)}><FaEdit /> Изменить</button>
                </div>
            </td>
            <td>{getTeacherClassesDisplay(teacher)}</td>
            <td>{getTeacherConstraintsDisplay(teacher)}</td>
            <td className="action-cell">
                <button onClick={() => { setEditingTeacher(teacher); setEditTeacherModalOpen(true); }} className="action-button edit-button"><FaEdit /></button>
                <button onClick={() => handleDeleteTeacher(teacher.id)} className="action-button delete-button" style={{ background: '#dc2626' }}><FaTrash /></button>
            </td>
        </tr>
    ))}
    {teachersArray.length === 0 && (
        <tr className="empty-row">
            <td colSpan="6">
                <FaChalkboardTeacher />
                <p>Нет учителей</p>
                <button onClick={() => document.querySelector('.form-container input')?.focus()}>Добавить учителя</button>
            </td>
        </tr>
    )}
</tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {/* Модалки */}
            <LessonSelectorModal 
                isOpen={lessonSelectorModalOpen} 
                onClose={() => setLessonSelectorModalOpen(false)} 
                lessonsList={lessonsArray} 
                selectedIds={tempLessonIds} 
                onSave={handleSaveLessons} 
                teacherName={currentTeacher?.name || 'нового учителя'} 
            />
            
            <ClassSelectorModal 
                isOpen={classSelectorModalOpen} 
                onClose={() => setClassSelectorModalOpen(false)} 
                classesList={classes} 
                selectedIds={tempClassIds} 
                onSave={handleSaveClassAssignments} 
                teacherName={currentTeacher?.name || 'нового учителя'} 
            />
            
            <EditTeacherModal 
                isOpen={editTeacherModalOpen} 
                onClose={() => setEditTeacherModalOpen(false)} 
                onSave={handleUpdateTeacher} 
                teacher={editingTeacher} 
            />

            <ColorPickerModal
                isOpen={colorPickerModalOpen}
                onClose={() => setColorPickerModalOpen(false)}
                onSave={saveColor}
                currentColor={tempColor}
                onColorChange={setTempColor}
            />
        </>
    );
};

export default TeachersTab;