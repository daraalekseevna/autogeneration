// components/tabs/TeachersTab.jsx
import React, { useState, useEffect } from 'react';
import { 
    FaUserPlus, FaChalkboardTeacher, FaEdit, FaTrash, FaBook, FaChevronDown, 
    FaSave, FaTimes, FaSearch, FaCheck, FaUserEdit, FaSchool, FaGraduationCap, 
    FaSpinner, FaPlus, FaPalette, FaBan, FaClock, FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';
import styles from '../styles/TeachersTab.module.css';
import '../styles/SuperAdmin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Цвета для учителей
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
    const [notification, setNotification] = useState({ message: '', type: 'success' });
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

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
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
            showNotification('Заполните фамилию, имя, логин и пароль', 'error');
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
            showNotification(err.response?.data?.message || 'Ошибка', 'error');
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
            showNotification('Ошибка удаления', 'error');
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
            showNotification(err.response?.data?.message || 'Ошибка обновления', 'error');
            throw err;
        }
    };

    const handleUpdateTeacherColor = async (teacherId, newColor) => {
        try {
            await axios.patch(`${API_URL}/superadmin/teachers/${teacherId}/color`, {
                color: newColor
            }, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Цвет обновлен');
            onDataChange();
        } catch (err) {
            console.error('Update color error:', err);
            showNotification('Ошибка обновления цвета', 'error');
            throw err;
        }
    };

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
                showNotification('Ошибка обновления предметов', 'error');
                throw err;
            }
        } else {
            setNewTeacher(prev => ({ ...prev, lessonIds: selectedIds }));
        }
        setLessonSelectorModalOpen(false);
    };

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
                showNotification('Ошибка назначения классов', 'error');
                throw err;
            }
        } else {
            setNewTeacher(prev => ({ ...prev, classIds: selectedClassIds }));
        }
        setClassSelectorModalOpen(false);
    };

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

    const openColorPicker = (teacher = null) => {
        if (teacher) {
            setColorPickerTarget({ 
                type: 'existing', 
                id: teacher.id, 
                currentColor: teacher.color || '#b8e2ff' 
            });
            setTempColor(teacher.color || '#b8e2ff');
        } else {
            setColorPickerTarget({ 
                type: 'new', 
                currentColor: newTeacher.color 
            });
            setTempColor(newTeacher.color);
        }
        setColorPickerModalOpen(true);
    };

    const saveColor = async () => {
        if (!colorPickerTarget) return;
        
        try {
            if (colorPickerTarget.type === 'existing') {
                await handleUpdateTeacherColor(colorPickerTarget.id, tempColor);
                
                // Обновляем editingTeacher если он открыт
                if (editingTeacher && editingTeacher.id === colorPickerTarget.id) {
                    setEditingTeacher(prev => ({ ...prev, color: tempColor }));
                }
            } else {
                setNewTeacher(prev => ({ ...prev, color: tempColor }));
                showNotification('Цвет выбран');
            }
            
            setColorPickerModalOpen(false);
            setColorPickerTarget(null);
        } catch (err) {
            console.error('Error saving color:', err);
            showNotification('Ошибка сохранения цвета', 'error');
        }
    };

    // Палитра цветов
    const ColorPickerModal = () => {
        if (!colorPickerModalOpen) return null;

        return (
            <div className={styles.paletteOverlay} onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setColorPickerModalOpen(false);
                }
            }}>
                <div className={styles.paletteContent}>
                    <div className={styles.paletteHeader}>
                        <span><FaPalette /> Выбор цвета</span>
                        <button className={styles.modalClose} onClick={() => setColorPickerModalOpen(false)}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className={styles.paletteGrid}>
                        {TEACHER_COLORS.map((color) => (
                            <div
                                key={color.value}
                                className={styles.paletteColor}
                                onClick={() => setTempColor(color.value)}
                                style={{
                                    backgroundColor: color.value,
                                    border: tempColor === color.value ? '3px solid #21435A' : '2px solid #e0e0e0',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    width: '40px',
                                    height: '40px',
                                    position: 'relative',
                                }}
                                title={color.name}
                            >
                                {tempColor === color.value && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: '#21435A',
                                        fontSize: '16px',
                                    }}>
                                        <FaCheck />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className={styles.paletteFooter}>
                        <div className={styles.paletteSelected}>
                            <div 
                                className={styles.paletteSelectedBox} 
                                style={{ 
                                    backgroundColor: tempColor,
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                }} 
                            />
                            <span style={{ marginLeft: '10px' }}>{tempColor}</span>
                        </div>
                        <div className={styles.selectorActions}>
                            <button 
                                className={styles.modalCancel} 
                                onClick={() => setColorPickerModalOpen(false)}
                            >
                                Отмена
                            </button>
                            <button 
                                className={styles.modalSave} 
                                onClick={saveColor}
                                style={{
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <FaCheck /> OK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Модалка выбора предметов
    const LessonSelectorModal = () => {
        const [saving, setSaving] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        
        const lessonsArray = Array.isArray(lessons) ? lessons : [];
        const filteredLessons = lessonsArray.filter(l => l && l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const toggleLesson = (lessonId) => {
            setTempLessonIds(prev => 
                prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
            );
        };

        const handleSave = async () => {
            if (saving) return;
            setSaving(true);
            try {
                await handleSaveLessons(tempLessonIds);
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        if (!lessonSelectorModalOpen) return null;

        const teacherName = currentTeacher ? 
            `${currentTeacher.lastName} ${currentTeacher.firstName}` : 
            'нового учителя';

        return (
            <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget && !saving) setLessonSelectorModalOpen(false); }}>
                <div className={styles.modalContent} style={{ maxWidth: '550px' }}>
                    <div className={styles.modalHeader}>
                        <FaBook />
                        <h3>Выбор предметов для {teacherName}</h3>
                        <button className={styles.modalClose} onClick={() => !saving && setLessonSelectorModalOpen(false)} disabled={saving}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        <div className={styles.selectorSearch}>
                            <FaSearch />
                            <input type="text" placeholder="Поиск предметов..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={saving} />
                        </div>
                        <div className={styles.selectorList}>
                            {filteredLessons.length === 0 ? (
                                <div className={styles.noData} style={{ textAlign: 'center', padding: '1rem' }}>
                                    <FaBook /> Нет загруженных уроков
                                </div>
                            ) : (
                                filteredLessons.map((lesson) => (
                                    <div key={lesson.id} className={styles.selectorItem}>
                                        <input type="checkbox" id={`lesson-${lesson.id}`} checked={tempLessonIds.includes(lesson.id)} onChange={() => toggleLesson(lesson.id)} disabled={saving} />
                                        <label htmlFor={`lesson-${lesson.id}`}>
                                            {lesson.name}
                                            {lesson.shortName && <small> ({lesson.shortName})</small>}
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className={styles.selectorFooter}>
                        <div className={styles.selectorCount}>Выбрано: {tempLessonIds.length}</div>
                        <div className={styles.selectorActions}>
                            <button className={styles.modalCancel} onClick={() => !saving && setLessonSelectorModalOpen(false)} disabled={saving}>Отмена</button>
                            <button className={styles.modalSave} onClick={handleSave} disabled={filteredLessons.length === 0 || saving}>
                                <FaCheck /> {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Модалка выбора классов
    const ClassSelectorModal = () => {
        const [saving, setSaving] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        
        const classesArray = Array.isArray(classes) ? classes : [];
        const filteredClasses = classesArray.filter(c => c && c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const toggleClass = (classId) => {
            setTempClassIds(prev => 
                prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
            );
        };

        const handleSave = async () => {
            if (saving) return;
            setSaving(true);
            try {
                await handleSaveClassAssignments(tempClassIds);
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        if (!classSelectorModalOpen) return null;

        const teacherName = currentTeacher ? 
            `${currentTeacher.lastName} ${currentTeacher.firstName}` : 
            'нового учителя';

        return (
            <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget && !saving) setClassSelectorModalOpen(false); }}>
                <div className={styles.modalContent} style={{ maxWidth: '550px' }}>
                    <div className={styles.modalHeader}>
                        <FaSchool />
                        <h3>Назначение классов для {teacherName}</h3>
                        <button className={styles.modalClose} onClick={() => !saving && setClassSelectorModalOpen(false)} disabled={saving}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        <div className={styles.selectorSearch}>
                            <FaSearch />
                            <input type="text" placeholder="Поиск классов..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={saving} />
                        </div>
                        <div className={styles.selectorList} style={{ maxHeight: '350px' }}>
                            {filteredClasses.length === 0 ? (
                                <div className={styles.noData} style={{ textAlign: 'center', padding: '1rem' }}>
                                    <FaSchool /> Нет загруженных классов
                                </div>
                            ) : (
                                filteredClasses.map((cls) => (
                                    <div key={cls.id} className={styles.selectorItem}>
                                        <input type="checkbox" id={`class-${cls.id}`} checked={tempClassIds.includes(cls.id)} onChange={() => toggleClass(cls.id)} disabled={saving} />
                                        <label htmlFor={`class-${cls.id}`}>
                                            {cls.name} класс
                                            {cls.teacher_name && <small> (рук. {cls.teacher_name})</small>}
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className={styles.selectorFooter}>
                        <div className={styles.selectorCount}>
                            <FaSchool /> Выбрано классов: {tempClassIds.length}
                        </div>
                        <div className={styles.selectorActions}>
                            <button className={styles.modalCancel} onClick={() => !saving && setClassSelectorModalOpen(false)} disabled={saving}>Отмена</button>
                            <button className={styles.modalSave} onClick={handleSave} disabled={saving}>
                                <FaCheck /> {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Модалка редактирования учителя
    const EditTeacherModal = () => {
        const [formData, setFormData] = useState({ 
            lastName: '', firstName: '', middleName: '', color: '#b8e2ff',
            maxConsecutiveLessons: 5,
            unavailableDays: []
        });
        const [saving, setSaving] = useState(false);

        useEffect(() => {
            if (editingTeacher) {
                setFormData({
                    lastName: editingTeacher.lastName || '',
                    firstName: editingTeacher.firstName || '',
                    middleName: editingTeacher.middleName || '',
                    color: editingTeacher.color || '#b8e2ff',
                    maxConsecutiveLessons: editingTeacher.maxConsecutiveLessons || 5,
                    unavailableDays: editingTeacher.unavailableDays || []
                });
            }
        }, [editingTeacher]);

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
                showNotification('Заполните фамилию и имя', 'error');
                return;
            }
            setSaving(true);
            try {
                await handleUpdateTeacher({ ...formData, id: editingTeacher?.id });
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        if (!editTeacherModalOpen) return null;

        return (
            <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget && !saving) setEditTeacherModalOpen(false); }}>
                <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
                    <div className={`${styles.modalHeader} ${styles.modalHeaderEdit}`}>
                        <FaUserEdit />
                        <h3>Редактировать учителя</h3>
                        <button className={styles.modalClose} onClick={() => !saving && setEditTeacherModalOpen(false)} disabled={saving}>
                            <FaTimes />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Фамилия *</label>
                                    <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} disabled={saving} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Имя *</label>
                                    <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} disabled={saving} />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Отчество</label>
                                <input type="text" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} disabled={saving} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Цвет уроков</label>
                                <div className={styles.colorSelector}>
                                    <div 
                                        className={styles.colorPreview} 
                                        style={{ background: formData.color }}
                                        onClick={() => openColorPicker({ 
                                            id: editingTeacher?.id, 
                                            color: formData.color 
                                        })}
                                    />
                                    <button 
                                        type="button"
                                        className={styles.colorBtn}
                                        onClick={() => openColorPicker({ 
                                            id: editingTeacher?.id, 
                                            color: formData.color 
                                        })}
                                    >
                                        <FaPalette /> Выбрать цвет
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label><FaBan /> Дни, в которые не ставить уроки</label>
                                <div className={styles.daysGroup}>
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                                        <label key={day} className={styles.day}>
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
                                <small>В выбранные дни учитель не будет вести уроки</small>
                            </div>
                            <div className={styles.formGroup}>
                                <label><FaClock /> Максимум уроков подряд</label>
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
                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.modalCancel} onClick={() => !saving && setEditTeacherModalOpen(false)} disabled={saving}>
                                Отмена
                            </button>
                            <button type="submit" className={styles.modalSave} disabled={saving}>
                                <FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
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
                <button className={styles.editBtn} onClick={() => openClassSelectorModal(teacher)}>
                    <FaPlus size={10} /> Добавить классы
                </button>
            );
        }
        
        return (
            <div className={styles.tags}>
                {teacherClasses.slice(0, 2).map((cls, i) => (
                    <span key={i} className={`${styles.tag} ${styles.tagClass}`}>
                        {cls.name}
                    </span>
                ))}
                {teacherClasses.length > 2 && <span className={`${styles.tag} ${styles.tagMore}`}>+{teacherClasses.length - 2}</span>}
                <button className={styles.editBtn} onClick={() => openClassSelectorModal(teacher)}>
                    <FaEdit size={10} /> Изменить
                </button>
            </div>
        );
    };

    // Отображение ограничений учителя
    const getTeacherConstraintsDisplay = (teacher) => {
        const days = teacher.unavailableDays || [];
        const maxConsecutive = teacher.maxConsecutiveLessons || 5;
        
        if (days.length === 0 && maxConsecutive === 5) {
            return <span className={styles.noData}>—</span>;
        }
        
        return (
            <div className={styles.constraints}>
                {days.length > 0 && (
                    <div className={`${styles.constraint} ${styles.constraintDays}`}>
                        <FaBan size={10} /> Выходные: {days.map(d => DAYS_RU[d] || d).join(', ')}
                    </div>
                )}
                {maxConsecutive !== 5 && (
                    <div className={`${styles.constraint} ${styles.constraintMax}`}>
                        <FaClock size={10} /> Макс. {maxConsecutive} урока(ов) подряд
                    </div>
                )}
            </div>
        );
    };

    const teachersArray = Array.isArray(teachers) ? teachers : [];
    const lessonsArray = Array.isArray(lessons) ? lessons : [];

    if (loadingClasses) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Загрузка данных...</p>
            </div>
        );
    }

    return (
        <>
            {notification.message && (
                <div className={`${styles.notification} ${notification.type === 'success' ? styles.notificationSuccess : styles.notificationError}`}>
                    {notification.type === 'success' ? <FaCheck size={14} /> : <FaExclamationTriangle size={14} />}
                    <span>{notification.message}</span>
                </div>
            )}
            
            <div className={styles.containerModern}>
                <div className={styles.contentGrid}>
                    {/* Форма добавления нового учителя */}
                    <div className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <FaUserPlus size={18} />
                            <h3>Новый учитель</h3>
                        </div>
                        <div className={styles.formBody}>
                            <form onSubmit={handleAddTeacher}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Фамилия *</label>
                                        <input type="text" value={newTeacher.lastName} onChange={e => setNewTeacher({...newTeacher, lastName: e.target.value})} required placeholder="Иванов" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Имя *</label>
                                        <input type="text" value={newTeacher.firstName} onChange={e => setNewTeacher({...newTeacher, firstName: e.target.value})} required placeholder="Иван" />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Отчество</label>
                                    <input type="text" value={newTeacher.middleName} onChange={e => setNewTeacher({...newTeacher, middleName: e.target.value})} placeholder="Иванович" />
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Логин *</label>
                                        <input type="text" value={newTeacher.login} onChange={e => setNewTeacher({...newTeacher, login: e.target.value})} required placeholder="ivanov_i" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Пароль *</label>
                                        <input type="password" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} required placeholder="••••••••" />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Цвет уроков</label>
                                    <div className={styles.colorSelector}>
                                        <div 
                                            className={styles.colorPreview} 
                                            style={{ background: newTeacher.color }}
                                            onClick={() => openColorPicker()}
                                        />
                                        <button 
                                            type="button"
                                            className={styles.colorBtn}
                                            onClick={() => openColorPicker()}
                                        >
                                            <FaPalette /> Выбрать цвет
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label><FaBan /> Дни, в которые не ставить уроки</label>
                                    <div className={styles.daysGroup}>
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                                            <label key={day} className={styles.day}>
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
                                    <small>В выбранные дни учитель не будет вести уроки</small>
                                </div>
                                <div className={styles.formGroup}>
                                    <label><FaClock /> Максимум уроков подряд</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="7" 
                                        value={newTeacher.maxConsecutiveLessons} 
                                        onChange={e => setNewTeacher({...newTeacher, maxConsecutiveLessons: parseInt(e.target.value) || 5})}
                                    />
                                    <small>Сколько уроков подряд может вести учитель (по умолчанию 5)</small>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Предметы</label>
                                    <div className={styles.selectorBtn} onClick={() => openLessonSelectorModal(null)}>
                                        <div className={styles.selectorContent}>
                                            <FaBook />
                                            <span>{newTeacher.lessonIds.length === 0 ? 'Выберите предметы...' : `Выбрано: ${newTeacher.lessonIds.length}`}</span>
                                        </div>
                                        <FaChevronDown />
                                    </div>
                                    {newTeacher.lessonIds.length > 0 && (
                                        <div className={styles.previewTags}>
                                            {newTeacher.lessonIds.map(id => {
                                                const lesson = lessonsArray.find(l => l.id === id);
                                                return lesson ? <span key={id} className={styles.previewTag}>{lesson.name}</span> : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Классы</label>
                                    <div className={styles.selectorBtn} onClick={() => openClassSelectorModal(null)}>
                                        <div className={styles.selectorContent}>
                                            <FaSchool />
                                            <span>{newTeacher.classIds.length === 0 ? 'Выберите классы...' : `Выбрано: ${newTeacher.classIds.length}`}</span>
                                        </div>
                                        <FaChevronDown />
                                    </div>
                                    {newTeacher.classIds.length > 0 && (
                                        <div className={styles.previewTags}>
                                            {newTeacher.classIds.map(id => {
                                                const cls = classes.find(c => c.id === id);
                                                return cls ? <span key={id} className={`${styles.previewTag} ${styles.previewTagGreen}`}>{cls.name}</span> : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className={styles.submitBtn}>
                                    <FaUserPlus size={14} /> Добавить учителя
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    {/* Таблица учителей */}
                    <div className={styles.tableCard}>
                        <div className={styles.tableHeader}>
                            <div className={styles.tableTitle}>
                                <FaChalkboardTeacher size={18} />
                                <h3>Список учителей</h3>
                                <span className={styles.count}>{teachersArray.length}</span>
                            </div>
                        </div>
                        
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>ФИО</th>
                                        <th>Цвет</th>
                                        <th>Предметы</th>
                                        <th>Классы</th>
                                        <th>Ограничения</th>
                                        <th style={{ width: '100px' }}>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachersArray.length > 0 ? teachersArray.map(teacher => (
                                        <tr key={teacher.id} className={styles.row}>
                                            <td><strong>{teacher.name}</strong></td>
                                            <td>
                                                <div 
                                                    className={styles.colorCell} 
                                                    style={{ background: teacher.color || '#b8e2ff' }}
                                                    onClick={() => openColorPicker(teacher)}
                                                    title="Нажмите чтобы изменить цвет"
                                                />
                                            </td>
                                            <td>
                                                <div className={styles.tags}>
                                                    {teacher.lessons?.length > 0 ? teacher.lessons.map((l, i) => (
                                                        <span key={i} className={`${styles.tag} ${styles.tagSubject}`}>{l.name}</span>
                                                    )) : teacher.lessonIds?.length > 0 ? teacher.lessonIds.map(id => {
                                                        const lesson = lessonsArray.find(l => l.id === id);
                                                        return lesson ? <span key={id} className={`${styles.tag} ${styles.tagSubject}`}>{lesson.name}</span> : null;
                                                    }) : <span className={styles.noData}>Нет предметов</span>}
                                                    <button className={styles.editBtn} onClick={() => openLessonSelectorModal(teacher)}>
                                                        <FaEdit size={10} /> Изменить
                                                    </button>
                                                </div>
                                            </td>
                                            <td>{getTeacherClassesDisplay(teacher)}</td>
                                            <td>{getTeacherConstraintsDisplay(teacher)}</td>
                                            <td className={styles.actions}>
                                                <button 
                                                    onClick={() => { setEditingTeacher(teacher); setEditTeacherModalOpen(true); }} 
                                                    className={`${styles.action} ${styles.actionEdit}`} 
                                                    title="Редактировать"
                                                >
                                                    <FaEdit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTeacher(teacher.id)} 
                                                    className={`${styles.action} ${styles.actionDelete}`} 
                                                    title="Удалить"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                              </td>
                                         </tr>
                                    )) : (
                                        <tr className={styles.emptyRow}>
                                            <td colSpan="6">
                                                <div className={styles.emptyState}>
                                                    <div className={styles.emptyIcon}>
                                                        <FaChalkboardTeacher size={48} />
                                                    </div>
                                                    <h4>Нет учителей</h4>
                                                    <p>Добавьте первого учителя, заполнив форму слева</p>
                                                </div>
                                              </td>
                                         </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Модалки */}
            <LessonSelectorModal />
            <ClassSelectorModal />
            <EditTeacherModal />
            <ColorPickerModal />
        </>
    );
};

export default TeachersTab;