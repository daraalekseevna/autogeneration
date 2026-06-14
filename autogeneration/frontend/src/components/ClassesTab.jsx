// components/tabs/ClassesTab.jsx
import React, { useState, useEffect } from 'react';
import { 
    FaUserPlus, FaSchool, FaEdit, FaTrash, FaSync, FaGraduationCap, 
    FaSave, FaTimes, FaUserEdit, FaCopy, FaEye, FaEyeSlash, FaInfoCircle,
    FaCheck, FaExclamationTriangle, FaSun, FaMoon, FaClock
} from 'react-icons/fa';
import axios from 'axios';
import styles from '../styles/ClassesTab.module.css';
import '../styles/SuperAdmin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ClassesTab = ({ classes = [], teachers = [], token, onDataChange }) => {
    const [newClass, setNewClass] = useState({ 
        number: '', 
        letter: '', 
        shift: 1, 
        teacherId: '', 
        login: '',
        password: '',
        maxLessonsPerDay: ''
    });
    const [editClassModalOpen, setEditClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: 'success' });
    const [teachersList, setTeachersList] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState({});
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        const loadTeachers = async () => {
            if (teachers && teachers.length > 0) {
                setTeachersList(teachers);
                return;
            }
            
            if (!token) return;
            
            setLoadingTeachers(true);
            try {
                const response = await axios.get(`${API_URL}/superadmin/teachers`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeachersList(response.data || []);
            } catch (err) {
                console.error('Error loading teachers:', err);
                setTeachersList([]);
            } finally {
                setLoadingTeachers(false);
            }
        };
        
        loadTeachers();
    }, [teachers, token]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 4000);
    };

    const clearClassForm = () => {
        setNewClass({ 
            number: '', 
            letter: '', 
            shift: 1, 
            teacherId: '', 
            login: '',
            password: '',
            maxLessonsPerDay: ''
        });
        setShowPassword(false);
    };

    const handleCopyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(`${type} скопирован!`);
        setTimeout(() => setCopySuccess(''), 2000);
    };

    const toggleShowPassword = (classId) => {
        setShowPasswords(prev => ({
            ...prev,
            [classId]: !prev[classId]
        }));
    };

    const handleAddClass = async (e) => {
        e.preventDefault();
        
        if (!newClass.number || !newClass.letter) {
            showNotification('Заполните номер и букву класса', 'error');
            return;
        }
        
        if (!newClass.login || !newClass.password) {
            showNotification('Заполните логин и пароль', 'error');
            return;
        }
        
        const existingClass = classes.find(c => 
            parseInt(c.number) === parseInt(newClass.number) && 
            c.letter === newClass.letter.toUpperCase()
        );
        
        if (existingClass) {
            showNotification(`Класс ${newClass.number}${newClass.letter.toUpperCase()} уже существует!`, 'error');
            return;
        }
        
        try {
            const classData = {
                number: parseInt(newClass.number),
                letter: newClass.letter.toUpperCase(),
                shift: parseInt(newClass.shift),
                teacherId: newClass.teacherId || null,
                login: newClass.login.trim(),
                password: newClass.password,
                maxLessonsPerDay: newClass.maxLessonsPerDay ? parseInt(newClass.maxLessonsPerDay) : null
            };
            
            await axios.post(`${API_URL}/superadmin/classes`, classData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            showNotification(`Класс ${newClass.number}${newClass.letter.toUpperCase()} добавлен!`, 'success');
            clearClassForm();
            onDataChange();
            
        } catch (err) {
            console.error('Ошибка:', err.response?.data || err.message);
            showNotification(err.response?.data?.message || 'Ошибка при добавлении класса', 'error');
        }
    };

    const handleUpdateClass = async (classData) => {
        try {
            const updateData = {
                shift: classData.shift,
                teacherId: classData.teacherId,
                maxLessonsPerDay: classData.maxLessonsPerDay
            };
            
            if (classData.login && classData.login !== classData.oldLogin) {
                updateData.login = classData.login;
            }
            if (classData.password) {
                updateData.password = classData.password;
            }
            
            await axios.put(`${API_URL}/superadmin/classes/${classData.id}`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            showNotification('Класс обновлен', 'success');
            onDataChange();
            setEditClassModalOpen(false);
            setEditingClass(null);
        } catch (err) {
            console.error('Update error:', err);
            showNotification(err.response?.data?.message || 'Ошибка обновления', 'error');
        }
    };

    const handleChangeShift = async (classId, currentShift) => {
        const newShift = currentShift === 1 ? 2 : 1;
        try {
            await axios.put(`${API_URL}/superadmin/classes/${classId}`, { shift: newShift }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification(`Смена изменена на ${newShift}`, 'success');
            onDataChange();
        } catch (err) {
            showNotification('Ошибка изменения смены', 'error');
        }
    };

    const handleDeleteClass = async (id, className) => {
        if (!window.confirm(`Удалить класс ${className}?`)) return;
        try {
            await axios.delete(`${API_URL}/superadmin/classes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification(`Класс ${className} удалён`, 'success');
            onDataChange();
        } catch (err) {
            showNotification('Ошибка удаления класса', 'error');
        }
    };

    const stats = {
        shift1: Array.isArray(classes) ? classes.filter(c => c.shift === 1).length : 0,
        shift2: Array.isArray(classes) ? classes.filter(c => c.shift === 2).length : 0,
        classesWithoutTeacher: Array.isArray(classes) ? classes.filter(c => !c.teacher_name).length : 0
    };

    // Модалка редактирования
    const EditClassModal = ({ isOpen, onClose, onSave, classData }) => {
        const [formData, setFormData] = useState({ 
            shift: 1, 
            teacherId: '', 
            maxLessonsPerDay: '',
            login: '',
            password: ''
        });
        const [saving, setSaving] = useState(false);
        const [localTeachers, setLocalTeachers] = useState([]);
        const [showEditPassword, setShowEditPassword] = useState(false);

        useEffect(() => {
            if (isOpen && teachersList.length > 0) {
                setLocalTeachers(teachersList);
            } else if (isOpen && token) {
                const fetchTeachers = async () => {
                    try {
                        const response = await axios.get(`${API_URL}/superadmin/teachers`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setLocalTeachers(response.data || []);
                    } catch (err) {
                        console.error('Error fetching teachers:', err);
                    }
                };
                fetchTeachers();
            }
        }, [isOpen, token, teachersList]);

        useEffect(() => {
            if (classData && isOpen) {
                setFormData({ 
                    shift: classData.shift || 1, 
                    teacherId: classData.teacher_id || classData.teacherId || '',
                    maxLessonsPerDay: classData.max_lessons_per_day || '',
                    login: classData.login || '',
                    password: ''
                });
            }
        }, [classData, isOpen]);

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (saving) return;
            setSaving(true);
            try {
                await onSave({ 
                    ...formData, 
                    id: classData?.id,
                    maxLessonsPerDay: formData.maxLessonsPerDay ? parseInt(formData.maxLessonsPerDay) : null,
                    oldLogin: classData?.login,
                    password: formData.password || undefined
                });
                onClose();
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                        <FaUserEdit />
                        <h3>Редактировать класс {classData?.name}</h3>
                        <button className={styles.modalClose} onClick={() => !saving && onClose()} disabled={saving}>
                            <FaTimes />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Логин для входа</label>
                                <input 
                                    type="text"
                                    value={formData.login}
                                    onChange={e => setFormData({...formData, login: e.target.value})}
                                    placeholder="Введите логин"
                                    disabled={saving}
                                />
                                <small>Логин для входа в систему</small>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Пароль (оставьте пустым, чтобы не менять)</label>
                                <div className={styles.passwordInputWrapper}>
                                    <input 
                                        type={showEditPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        placeholder="Новый пароль"
                                        disabled={saving}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowEditPassword(!showEditPassword)}
                                        className={styles.togglePasswordBtn}
                                        title={showEditPassword ? "Скрыть пароль" : "Показать пароль"}
                                    >
                                        {showEditPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <small>Если оставить пустым, пароль не изменится</small>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Смена</label>
                                <div className={styles.shiftToggle}>
                                    <button
                                        type="button"
                                        className={`${styles.shiftToggleBtn} ${formData.shift === 1 ? styles.active : ''}`}
                                        onClick={() => setFormData({...formData, shift: 1})}
                                        disabled={saving}
                                    >
                                        <div className={styles.shiftToggleIcon}>
                                            <FaSun size={18} />
                                        </div>
                                        <div className={styles.shiftToggleText}>
                                            <span className={styles.shiftToggleTitle}>1 смена</span>
                                            <span className={styles.shiftToggleDesc}>Утром</span>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.shiftToggleBtn} ${formData.shift === 2 ? styles.active : ''}`}
                                        onClick={() => setFormData({...formData, shift: 2})}
                                        disabled={saving}
                                    >
                                        <div className={styles.shiftToggleIcon}>
                                            <FaMoon size={18} />
                                        </div>
                                        <div className={styles.shiftToggleText}>
                                            <span className={styles.shiftToggleTitle}>2 смена</span>
                                            <span className={styles.shiftToggleDesc}>Днём</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Классный руководитель</label>
                                <select value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} disabled={saving}>
                                    <option value="">Не назначен</option>
                                    {localTeachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name || `${t.last_name} ${t.first_name}`}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Максимум уроков в день</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="8"
                                    value={formData.maxLessonsPerDay} 
                                    onChange={e => setFormData({...formData, maxLessonsPerDay: e.target.value})}
                                    placeholder="По умолчанию из настроек"
                                    disabled={saving}
                                />
                                <small>Оставьте пустым для использования общих настроек</small>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.modalCancel} onClick={() => !saving && onClose()} disabled={saving}>
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

    const classesArray = Array.isArray(classes) ? classes : [];

    return (
        <div className={styles.tabWrapper}>
            {notification.message && (
                <div className={`${styles.notification} ${styles[notification.type]}`}>
                    {notification.type === 'success' ? <FaCheck size={14} /> : <FaExclamationTriangle size={14} />}
                    <span>{notification.message}</span>
                </div>
            )}
            
            {copySuccess && (
                <div className={styles.copySuccess}>
                    {copySuccess}
                </div>
            )}
            
            <div className={styles.container}>
                <div className={styles.contentGrid}>
                    {/* ============= ФОРМА ДОБАВЛЕНИЯ КЛАССА ============= */}
                    <div className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <FaUserPlus size={18} />
                            <h3>Добавить новый класс</h3>
                        </div>
                        <div className={styles.formBody}>
                            <form onSubmit={handleAddClass}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Номер класса *</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="11" 
                                            value={newClass.number} 
                                            onChange={e => setNewClass({...newClass, number: e.target.value})} 
                                            required 
                                            placeholder="1"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Буква *</label>
                                        <input 
                                            type="text" 
                                            maxLength="1" 
                                            value={newClass.letter} 
                                            onChange={e => setNewClass({...newClass, letter: e.target.value.toUpperCase()})} 
                                            required 
                                            placeholder="А"
                                        />
                                    </div>
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label>Логин для входа *</label>
                                    <input 
                                        type="text" 
                                        value={newClass.login} 
                                        onChange={e => setNewClass({...newClass, login: e.target.value})} 
                                        required 
                                        placeholder="Введите логин (например: 1a_class)"
                                    />
                                    <small>Логин для входа в систему</small>
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label>Пароль для входа *</label>
                                    <div className={styles.passwordInputWrapper}>
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            value={newClass.password} 
                                            onChange={e => setNewClass({...newClass, password: e.target.value})} 
                                            required 
                                            placeholder="Введите пароль"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className={styles.togglePasswordBtn}
                                            title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                                        >
                                            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                    <small>Сохраните этот пароль! Он понадобится для входа.</small>
                                </div>
                                
                                {/* КРАСИВЫЙ ПЕРЕКЛЮЧАТЕЛЬ СМЕН */}
                                <div className={styles.formGroup}>
                                    <label>Смена</label>
                                    <div className={styles.shiftToggle}>
                                        <button
                                            type="button"
                                            className={`${styles.shiftToggleBtn} ${newClass.shift === 1 ? styles.active : ''}`}
                                            onClick={() => setNewClass({...newClass, shift: 1})}
                                        >
                                            <div className={styles.shiftToggleIcon}>
                                                <FaSun size={18} />
                                            </div>
                                            <div className={styles.shiftToggleText}>
                                                <span className={styles.shiftToggleTitle}>1 смена</span>
                                                <span className={styles.shiftToggleDesc}>Утром</span>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.shiftToggleBtn} ${newClass.shift === 2 ? styles.active : ''}`}
                                            onClick={() => setNewClass({...newClass, shift: 2})}
                                        >
                                            <div className={styles.shiftToggleIcon}>
                                                <FaMoon size={18} />
                                            </div>
                                            <div className={styles.shiftToggleText}>
                                                <span className={styles.shiftToggleTitle}>2 смена</span>
                                                <span className={styles.shiftToggleDesc}>Днём</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label>Классный руководитель</label>
                                    <select value={newClass.teacherId} onChange={e => setNewClass({...newClass, teacherId: e.target.value})}>
                                        <option value="">Не назначен</option>
                                        {teachersList.map(t => (
                                            <option key={t.id} value={t.id}>{t.name || `${t.last_name} ${t.first_name}`}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label>Максимум уроков в день (опционально)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="8"
                                        value={newClass.maxLessonsPerDay} 
                                        onChange={e => setNewClass({...newClass, maxLessonsPerDay: e.target.value})}
                                        placeholder="Оставьте пустым для использования общих настроек"
                                    />
                                </div>
                                
                                <button type="submit" className={styles.submitBtn}>
                                    <FaUserPlus size={14} /> Добавить класс
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    {/* ============= ТАБЛИЦА КЛАССОВ ============= */}
                    <div className={styles.tableCard}>
                        <div className={styles.tableHeader}>
                            <div className={styles.tableTitle}>
                                <FaSchool size={18} />
                                <h3>Список классов</h3>
                            </div>
                            <div className={styles.statsSummary}>
                                <span className={styles.statBadge}>
                                    <FaSun size={12} /> {stats.shift1}
                                </span>
                                <span className={styles.statBadge}>
                                    <FaMoon size={12} /> {stats.shift2}
                                </span>
                            </div>
                        </div>
                        
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Класс</th>
                                        <th>Смена</th>
                                        <th>Руководитель</th>
                                        <th>Логин / Пароль</th>
                                        <th>Макс. уроков</th>
                                        <th style={{ width: '180px' }}>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classesArray.length > 0 ? (
                                        classesArray.map(c => (
                                            <tr key={c.id} className={styles.row}>
                                                <td className={styles.classNameCell}>
                                                    <FaGraduationCap size={14} /> 
                                                    <strong>{c.name}</strong>
                                                </td>
                                                
                                                <td className={styles.shiftCell}>
                                                    <div className={`${styles.shiftBadge} ${c.shift === 1 ? styles.shiftMorning : styles.shiftEvening}`}>
                                                        {c.shift === 1 ? <FaSun size={12} /> : <FaMoon size={12} />}
                                                        <span>{c.shift === 1 ? '1 смена' : '2 смена'}</span>
                                                        <small>{c.shift === 1 ? '08:00' : '14:00'}</small>
                                                    </div>
                                                </td>
                                                
                                                <td className={styles.teacherCell}>
                                                    {c.teacher_name ? (
                                                        <span className={styles.teacherName}>{c.teacher_name}</span>
                                                    ) : (
                                                        <span className={styles.noTeacher}>—</span>
                                                    )}
                                                </td>
                                                
                                                <td className={styles.credentialsCell}>
                                                    <div className={styles.credentialLine}>
                                                        <code>{c.login || '—'}</code>
                                                        {c.login && (
                                                            <button 
                                                                onClick={() => handleCopyToClipboard(c.login, 'Логин')}
                                                                className={styles.copyBtn}
                                                                title="Скопировать логин"
                                                            >
                                                                <FaCopy size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className={styles.credentialLine}>
                                                        <span className={styles.passwordValue}>
                                                            {showPasswords[c.id] ? c.password : '••••••••'}
                                                        </span>
                                                        <div className={styles.passwordActions}>
                                                            <button 
                                                                onClick={() => toggleShowPassword(c.id)}
                                                                className={styles.togglePasswordBtn}
                                                                title={showPasswords[c.id] ? "Скрыть пароль" : "Показать пароль"}
                                                            >
                                                                {showPasswords[c.id] ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                                                            </button>
                                                            {c.password && (
                                                                <button 
                                                                    onClick={() => handleCopyToClipboard(c.password, 'Пароль')}
                                                                    className={styles.copyBtn}
                                                                    title="Скопировать пароль"
                                                                >
                                                                    <FaCopy size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                 </td>
                                                
                                                <td className={styles.textCenter}>
                                                    {c.max_lessons_per_day ? (
                                                        <span className={styles.lessonsLimit}>{c.max_lessons_per_day}</span>
                                                    ) : (
                                                        <span className={styles.noData}>—</span>
                                                    )}
                                                </td>
                                                
                                                <td className={styles.actionsCell}>
                                                    <button 
                                                        onClick={() => { setEditingClass(c); setEditClassModalOpen(true); }} 
                                                        className={`${styles.actionBtn} ${styles.editBtn}`} 
                                                        title="Редактировать класс"
                                                    >
                                                        <FaEdit size={14} />
                                                        <span>Изменить</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleChangeShift(c.id, c.shift)} 
                                                        className={`${styles.actionBtn} ${styles.shiftBtn}`} 
                                                        title={c.shift === 1 ? "Перевести во 2 смену" : "Перевести в 1 смену"}
                                                    >
                                                        <FaSync size={14} />
                                                        <span>Смена</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClass(c.id, c.name)} 
                                                        className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                                                        title="Удалить класс"
                                                    >
                                                        <FaTrash size={14} />
                                                        <span>Удалить</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className={styles.emptyRow}>
                                            <td colSpan="6">
                                                <div className={styles.emptyState}>
                                                    <div className={styles.emptyIcon}>
                                                        <FaSchool size={48} />
                                                    </div>
                                                    <h4>Нет добавленных классов</h4>
                                                    <p>Добавьте первый класс, заполнив форму слева</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Статистика */}
                        <div className={styles.statsContainer}>
                            <div className={styles.statsGrid}>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>{classesArray.length}</div>
                                    <div className={styles.statLabel}>Всего классов</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>{stats.shift1}</div>
                                    <div className={styles.statLabel}>1 смена</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>{stats.shift2}</div>
                                    <div className={styles.statLabel}>2 смена</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>{stats.classesWithoutTeacher}</div>
                                    <div className={styles.statLabel}>Без руководителя</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <EditClassModal 
                isOpen={editClassModalOpen} 
                onClose={() => setEditClassModalOpen(false)} 
                onSave={handleUpdateClass} 
                classData={editingClass}
            />
        </div>
    );
};

export default ClassesTab;