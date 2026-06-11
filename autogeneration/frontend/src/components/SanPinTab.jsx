// components/tabs/SanPinTab.jsx
import React, { useState, useEffect } from 'react';
import { 
    FaBook, FaCalendarWeek, FaBalanceScale, FaSave, FaExclamationTriangle, 
    FaInfoCircle, FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaSpinner,
    FaChartLine, FaLink, FaUsers, FaSync, FaBan, FaCalculator, FaClock,
    FaUniversity, FaBrain, FaHeartbeat, FaFlask, FaLanguage, FaMusic,
    FaPalette, FaDatabase, FaChartBar
} from 'react-icons/fa';
import axios from 'axios';
import PairingRulesTab from '../sanpin/PairingRulesTab';
import GroupDivisionTab from '../sanpin/GroupDivisionTab';
import ParallelSyncTab from '../sanpin/ParallelSyncTab';
import ForbiddenSequencesTab from '../sanpin/ForbiddenSequencesTab';
import '../styles/SanPinTab.css';
import '../styles/SuperAdmin.css';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SUBJECT_TYPES = [
    { value: 'exact', label: 'Точные науки', color: '#3b82f6', icon: FaFlask },
    { value: 'humanities', label: 'Гуманитарные', color: '#10b981', icon: FaLanguage },
    { value: 'neutral', label: 'Нейтральные', color: '#f59e0b', icon: FaBalanceScale }
];

const DIFFICULTY_RANKS = [
    { value: 1, label: '1 - Очень легкий', color: '#10b981' },
    { value: 2, label: '2 - Легкий', color: '#34d399' },
    { value: 3, label: '3 - Ниже среднего', color: '#6ee7b7' },
    { value: 4, label: '4 - Средний', color: '#fbbf24' },
    { value: 5, label: '5 - Средний+', color: '#f59e0b' },
    { value: 6, label: '6 - Выше среднего', color: '#fb923c' },
    { value: 7, label: '7 - Сложный', color: '#ef4444' },
    { value: 8, label: '8 - Очень сложный', color: '#dc2626' },
    { value: 9, label: '9 - Высокой сложности', color: '#b91c1c' },
    { value: 10, label: '10 - Максимальной сложности', color: '#7f1d1d' }
];

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// Иконки для вкладок
const TAB_ICONS = {
    difficulty: FaBalanceScale,
    hours: FaClock,
    dailyLimits: FaChartBar,
    weeklyLimits: FaCalendarWeek,
    summary: FaChartLine,
    pairing: FaLink,
    group: FaUsers,
    parallel: FaSync,
    forbidden: FaBan
};

const TAB_LABELS = {
    difficulty: 'Ранги сложности',
    hours: 'Нагрузка по часам',
    dailyLimits: 'Дневные лимиты',
    weeklyLimits: 'Недельные лимиты',
    summary: 'Сводка нагрузки',
    pairing: 'Спаривание уроков',
    group: 'Групповые занятия',
    parallel: 'Синхронизация',
    forbidden: 'Запрещённые последовательности'
};

const SanPinTab = ({ token }) => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [subjectDifficulty, setSubjectDifficulty] = useState([]);
    const [subjectHours, setSubjectHours] = useState([]);
    const [dailyLimits, setDailyLimits] = useState([]);
    const [weeklyLimits, setWeeklyLimits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('difficulty');
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [editingDifficulty, setEditingDifficulty] = useState(null);
    const [editingHours, setEditingHours] = useState(null);
    const [editingDailyLimit, setEditingDailyLimit] = useState(null);
    const [editingWeeklyLimit, setEditingWeeklyLimit] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addFormData, setAddFormData] = useState({ grade: '', subject_id: '', difficulty_rank: 5, subject_type: 'neutral' });

    useEffect(() => {
        loadAllData();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const loadAllData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const [classesRes, subjectsRes, difficultyRes, hoursRes, dailyLimitsRes, weeklyLimitsRes] = await Promise.all([
                axios.get(`${API_URL}/superadmin/classes`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/lessons`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/sanpin/subject-difficulty`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/sanpin/subject-hours`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/daily-load-limits`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/weekly-load-limits`, config).catch(() => ({ data: [] }))
            ]);

            setClasses(classesRes.data || []);
            setSubjects(subjectsRes.data || []);
            setSubjectDifficulty(difficultyRes.data || []);
            setSubjectHours(hoursRes.data || []);
            setDailyLimits(dailyLimitsRes.data || []);
            setWeeklyLimits(weeklyLimitsRes.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            showNotification('Ошибка загрузки данных', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateWeeklyFromDaily = () => {
        const grades = [...new Set(dailyLimits.map(d => d.grade))];
        const calculated = [];
        
        for (const grade of grades) {
            const gradeLimits = dailyLimits.filter(d => d.grade === grade && DAYS_ORDER.includes(d.day_name));
            let totalMax = 0;
            
            for (const day of DAYS_ORDER) {
                const limit = gradeLimits.find(d => d.day_name === day);
                if (limit) {
                    totalMax += limit.max_weight;
                }
            }
            
            calculated.push({
                grade,
                week_weight: totalMax,
                month_weight: totalMax * 4,
                calculated_from_daily: true
            });
        }
        
        return calculated;
    };

    const autoSaveWeeklyLimits = async () => {
        const calculated = calculateWeeklyFromDaily();
        if (calculated.length === 0) return;
        
        setSaving(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            for (const item of calculated) {
                const existing = weeklyLimits.find(w => w.grade === item.grade);
                
                if (existing) {
                    await axios.put(`${API_URL}/superadmin/weekly-load-limits/${existing.id}`, {
                        grade: item.grade,
                        week_weight: item.week_weight,
                        month_weight: item.month_weight
                    }, config);
                } else {
                    await axios.post(`${API_URL}/superadmin/weekly-load-limits`, {
                        grade: item.grade,
                        week_weight: item.week_weight,
                        month_weight: item.month_weight
                    }, config);
                }
            }
            
            await loadAllData();
            showNotification('Недельные лимиты автоматически пересчитаны из дневных');
        } catch (error) {
            console.error('Error auto-saving weekly limits:', error);
            showNotification('Ошибка автоматического расчета', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDifficulty = async (data) => {
        setSaving(true);
        try {
            if (editingDifficulty) {
                await axios.put(`${API_URL}/superadmin/sanpin/subject-difficulty/${editingDifficulty.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotification('Ранг сложности обновлен');
            } else {
                await axios.post(`${API_URL}/superadmin/sanpin/subject-difficulty`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotification('Ранг сложности добавлен');
            }
            await loadAllData();
            setEditingDifficulty(null);
            setSelectedGrade(null);
            setAddModalOpen(false);
            setAddFormData({ grade: '', subject_id: '', difficulty_rank: 5, subject_type: 'neutral' });
        } catch (error) {
            console.error('Error saving difficulty:', error);
            showNotification('Ошибка сохранения', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDifficulty = async (id) => {
        if (!window.confirm('Удалить запись?')) return;
        setSaving(true);
        try {
            await axios.delete(`${API_URL}/superadmin/sanpin/subject-difficulty/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Запись удалена');
            await loadAllData();
        } catch (error) {
            console.error('Error deleting difficulty:', error);
            showNotification('Ошибка удаления', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveHours = async (data) => {
        setSaving(true);
        try {
            if (editingHours) {
                await axios.put(`${API_URL}/superadmin/sanpin/subject-hours/${editingHours.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotification('Нагрузка обновлена');
            } else {
                await axios.post(`${API_URL}/superadmin/sanpin/subject-hours`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotification('Нагрузка добавлена');
            }
            await loadAllData();
            setEditingHours(null);
            setSelectedGrade(null);
        } catch (error) {
            console.error('Error saving hours:', error);
            showNotification('Ошибка сохранения', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteHours = async (id) => {
        if (!window.confirm('Удалить запись?')) return;
        setSaving(true);
        try {
            await axios.delete(`${API_URL}/superadmin/sanpin/subject-hours/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Запись удалена');
            await loadAllData();
        } catch (error) {
            console.error('Error deleting hours:', error);
            showNotification('Ошибка удаления', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDailyLimit = async (data) => {
        setSaving(true);
        try {
            if (editingDailyLimit) {
                await axios.put(`${API_URL}/superadmin/daily-load-limits/${editingDailyLimit.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotification('Дневной лимит обновлен');
            } else {
                await axios.post(`${API_URL}/superadmin/daily-load-limits`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotification('Дневной лимит добавлен');
            }
            await loadAllData();
            setEditingDailyLimit(null);
            await autoSaveWeeklyLimits();
        } catch (error) {
            console.error('Error saving daily limit:', error);
            showNotification('Ошибка сохранения', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDailyLimit = async (id) => {
        if (!window.confirm('Удалить запись?')) return;
        setSaving(true);
        try {
            await axios.delete(`${API_URL}/superadmin/daily-load-limits/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Запись удалена');
            await loadAllData();
            await autoSaveWeeklyLimits();
        } catch (error) {
            console.error('Error deleting daily limit:', error);
            showNotification('Ошибка удаления', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveWeeklyLimit = async (data) => {
        setSaving(true);
        try {
            if (editingWeeklyLimit) {
                await axios.put(`${API_URL}/superadmin/weekly-load-limits/${editingWeeklyLimit.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotification('Недельный лимит обновлен');
            } else {
                await axios.post(`${API_URL}/superadmin/weekly-load-limits`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotification('Недельный лимит добавлен');
            }
            await loadAllData();
            setEditingWeeklyLimit(null);
        } catch (error) {
            console.error('Error saving weekly limit:', error);
            showNotification('Ошибка сохранения', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWeeklyLimit = async (id) => {
        if (!window.confirm('Удалить запись?')) return;
        setSaving(true);
        try {
            await axios.delete(`${API_URL}/superadmin/weekly-load-limits/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Запись удалена');
            await loadAllData();
        } catch (error) {
            console.error('Error deleting weekly limit:', error);
            showNotification('Ошибка удаления', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getUniqueGrades = () => {
        const grades = [...new Set(classes.map(c => c.number))];
        return grades.sort((a, b) => a - b);
    };

    const getDifficultyForSubject = (grade, subjectId) => {
        return subjectDifficulty.find(d => d.grade === grade && d.subject_id === subjectId);
    };

    const calculateWeeklyLoad = (grade) => {
        const gradeHours = subjectHours.filter(h => h.grade === grade);
        let totalHours = 0;
        let totalPoints = 0;

        gradeHours.forEach(hour => {
            const hoursPerWeek = parseFloat(hour.hours_per_week) || 0;
            const difficulty = getDifficultyForSubject(grade, hour.subject_id);
            const rank = difficulty?.difficulty_rank || 3;
            const points = hoursPerWeek * rank;
            
            totalHours += hoursPerWeek;
            totalPoints += points;
        });

        totalHours = Math.round(totalHours * 10) / 10;
        totalPoints = Math.round(totalPoints);

        return { totalHours, totalPoints };
    };

    const uniqueGrades = getUniqueGrades();
    const validSubjects = subjects.filter(s => s && s.name);

    const getWeeklyLimitsDisplay = () => {
        const calculated = calculateWeeklyFromDaily();
        const result = [];
        
        for (const grade of uniqueGrades) {
            const saved = weeklyLimits.find(w => w.grade === grade);
            const calculatedForGrade = calculated.find(c => c.grade === grade);
            
            result.push({
                grade,
                week_weight: saved?.week_weight || calculatedForGrade?.week_weight || 0,
                month_weight: saved?.month_weight || calculatedForGrade?.month_weight || 0,
                is_auto: !saved && !!calculatedForGrade
            });
        }
        
        return result;
    };

    // Компонент вкладок
    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            className={`sanpin-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
        >
            <Icon size={16} />
            <span>{label}</span>
        </button>
    );

    // Модальное окно добавления
    const AddDifficultyModal = () => {
        if (!addModalOpen) return null;

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!addFormData.grade || !addFormData.subject_id) {
                showNotification('Заполните все поля', 'error');
                return;
            }
            handleSaveDifficulty(addFormData);
        };

        return (
            <div className="modal-overlay-fixed" onClick={() => !saving && setAddModalOpen(false)}>
                <div className="modal-content-fixed" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                    <div className="modal-header-fixed">
                        <div className="modal-header-icon">
                            <FaPlus size={18} />
                        </div>
                        <h3>Добавить ранг сложности</h3>
                        <button className="modal-close-fixed" onClick={() => !saving && setAddModalOpen(false)} disabled={saving}>
                            <FaTimes />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body-fixed">
                            <div className="form-group">
                                <label>Класс</label>
                                <select 
                                    value={addFormData.grade} 
                                    onChange={e => setAddFormData({...addFormData, grade: parseInt(e.target.value)})} 
                                    required
                                    disabled={saving}
                                >
                                    <option value="">Выберите класс</option>
                                    {uniqueGrades.map(g => <option key={g} value={g}>{g} класс</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Предмет</label>
                                <select 
                                    value={addFormData.subject_id} 
                                    onChange={e => setAddFormData({...addFormData, subject_id: parseInt(e.target.value)})} 
                                    required
                                    disabled={saving}
                                >
                                    <option value="">Выберите предмет</option>
                                    {validSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ранг сложности (1-10)</label>
                                    <select 
                                        value={addFormData.difficulty_rank} 
                                        onChange={e => setAddFormData({...addFormData, difficulty_rank: parseInt(e.target.value)})}
                                        disabled={saving}
                                    >
                                        {DIFFICULTY_RANKS.map(rank => (
                                            <option key={rank.value} value={rank.value}>{rank.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Тип предмета</label>
                                    <select 
                                        value={addFormData.subject_type} 
                                        onChange={e => setAddFormData({...addFormData, subject_type: e.target.value})}
                                        disabled={saving}
                                    >
                                        {SUBJECT_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-fixed">
                            <button type="button" className="btn-cancel-modal" onClick={() => !saving && setAddModalOpen(false)} disabled={saving}>
                                Отмена
                            </button>
                            <button type="submit" className="btn-save-modal" disabled={saving}>
                                <FaSave /> {saving ? 'Сохранение...' : 'Добавить'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Модальное окно редактирования
    const EditDifficultyModal = () => {
        if (!editingDifficulty) return null;

        const [formData, setFormData] = useState({
            grade: editingDifficulty.grade,
            subject_id: editingDifficulty.subject_id,
            difficulty_rank: editingDifficulty.difficulty_rank,
            subject_type: editingDifficulty.subject_type || 'neutral'
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            handleSaveDifficulty(formData);
        };

        return (
            <div className="modal-overlay-fixed" onClick={() => !saving && setEditingDifficulty(null)}>
                <div className="modal-content-fixed" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                    <div className="modal-header-fixed" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <div className="modal-header-icon">
                            <FaEdit size={18} />
                        </div>
                        <h3>Редактировать ранг сложности</h3>
                        <button className="modal-close-fixed" onClick={() => !saving && setEditingDifficulty(null)} disabled={saving}>
                            <FaTimes />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body-fixed">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Класс</label>
                                    <select value={formData.grade} onChange={e => setFormData({...formData, grade: parseInt(e.target.value)})} required disabled={saving}>
                                        {uniqueGrades.map(g => <option key={g} value={g}>{g} класс</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Предмет</label>
                                    <select value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: parseInt(e.target.value)})} required disabled={saving}>
                                        {validSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ранг сложности (1-10)</label>
                                    <select value={formData.difficulty_rank} onChange={e => setFormData({...formData, difficulty_rank: parseInt(e.target.value)})} disabled={saving}>
                                        {DIFFICULTY_RANKS.map(rank => (
                                            <option key={rank.value} value={rank.value}>{rank.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Тип предмета</label>
                                    <select value={formData.subject_type} onChange={e => setFormData({...formData, subject_type: e.target.value})} disabled={saving}>
                                        {SUBJECT_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-fixed">
                            <button type="button" className="btn-cancel-modal" onClick={() => !saving && setEditingDifficulty(null)} disabled={saving}>
                                Отмена
                            </button>
                            <button type="submit" className="btn-save-modal" disabled={saving}>
                                <FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Таблица рангов сложности
    const DifficultyTable = () => (
        <div className="sanpin-table-card">
            <div className="sanpin-table-header">
                <div className="sanpin-table-title">
                    <FaBalanceScale size={18} />
                    <h3>Ранги сложности предметов</h3>
                </div>
                <button className="sanpin-add-btn" onClick={() => {
                    setAddFormData({ grade: uniqueGrades[0] || '', subject_id: '', difficulty_rank: 5, subject_type: 'neutral' });
                    setAddModalOpen(true);
                }}>
                    <FaPlus size={12} /> Добавить
                </button>
            </div>
            <div className="sanpin-table-wrapper">
                <table className="sanpin-table">
                    <thead>
                        <tr>
                            <th>Класс</th>
                            <th>Предмет</th>
                            <th>Ранг сложности</th>
                            <th>Тип предмета</th>
                            <th style={{ width: '100px' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueGrades.map(grade => {
                            const gradeDifficulties = subjectDifficulty.filter(d => d.grade === grade);
                            if (gradeDifficulties.length === 0) {
                                return (
                                    <tr key={grade} className="sanpin-empty-row">
                                        <td colSpan="5">
                                            <span className="empty-message">
                                                {grade} класс — нет данных
                                            </span>
                                            <button className="sanpin-link-btn" onClick={() => {
                                                setAddFormData({ grade: grade, subject_id: '', difficulty_rank: 5, subject_type: 'neutral' });
                                                setAddModalOpen(true);
                                            }}>Добавить</button>
                                        </td>
                                    </tr>
                                );
                            }
                            return gradeDifficulties.map((item, idx) => {
                                const subject = subjects.find(s => s.id === item.subject_id);
                                const type = SUBJECT_TYPES.find(t => t.value === item.subject_type);
                                const rankColor = DIFFICULTY_RANKS.find(r => r.value === item.difficulty_rank)?.color || '#6b7280';
                                const TypeIcon = type?.icon || FaBalanceScale;
                                return (
                                    <tr key={item.id}>
                                        {idx === 0 && (
                                            <td rowSpan={gradeDifficulties.length} className="grade-group-cell">
                                                <span className="grade-badge">{grade} класс</span>
                                            </td>
                                        )}
                                        <td><span className="subject-name">{subject?.name || '-'}</span></td>
                                        <td>
                                            <span className="difficulty-rank" style={{ background: rankColor }}>
                                                {item.difficulty_rank}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="subject-type-badge" style={{ background: type?.color }}>
                                                <TypeIcon size={10} />
                                                {type?.label || 'Нейтральный'}
                                            </span>
                                        </td>
                                        <td className="action-cell">
                                            <button onClick={() => setEditingDifficulty(item)} className="sanpin-action-btn edit" title="Редактировать">
                                                <FaEdit size={12} />
                                            </button>
                                            <button onClick={() => handleDeleteDifficulty(item.id)} className="sanpin-action-btn delete" title="Удалить">
                                                <FaTrash size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            });
                        })}
                        {uniqueGrades.length === 0 && (
                            <tr className="sanpin-empty-row">
                                <td colSpan="5">
                                    <span className="empty-message">Нет классов. Сначала добавьте классы во вкладке "Классы"</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Таблица часов
    const HoursTable = () => (
        <div className="sanpin-table-card">
            <div className="sanpin-table-header">
                <div className="sanpin-table-title">
                    <FaClock size={18} />
                    <h3>Недельная нагрузка (часы)</h3>
                </div>
                <button className="sanpin-add-btn" onClick={() => setSelectedGrade(uniqueGrades[0])}>
                    <FaPlus size={12} /> Добавить
                </button>
            </div>
            <div className="sanpin-table-wrapper">
                <table className="sanpin-table">
                    <thead>
                        <tr>
                            <th>Класс</th>
                            <th>Предмет</th>
                            <th>Часов в неделю</th>
                            <th>Вес (баллы)</th>
                            <th style={{ width: '100px' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueGrades.map(grade => {
                            const gradeHours = subjectHours.filter(h => h.grade === grade);
                            if (gradeHours.length === 0) {
                                return (
                                    <tr key={grade} className="sanpin-empty-row">
                                        <td colSpan="5">
                                            <span className="empty-message">{grade} класс — нет данных</span>
                                            <button className="sanpin-link-btn" onClick={() => setSelectedGrade(grade)}>Добавить</button>
                                        </td>
                                    </tr>
                                );
                            }
                            return gradeHours.map((item, idx) => {
                                const subject = subjects.find(s => s.id === item.subject_id);
                                const difficulty = getDifficultyForSubject(grade, item.subject_id);
                                const weight = (item.hours_per_week || 0) * (difficulty?.difficulty_rank || 3);
                                return (
                                    <tr key={item.id}>
                                        {idx === 0 && (
                                            <td rowSpan={gradeHours.length} className="grade-group-cell">
                                                <span className="grade-badge">{grade} класс</span>
                                            </td>
                                        )}
                                        <td><span className="subject-name">{subject?.name || '-'}</span></td>
                                        <td><span className="hours-value">{item.hours_per_week || 0}</span></td>
                                        <td className="weight-cell">{Math.round(weight)}</td>
                                        <td className="action-cell">
                                            <button onClick={() => setEditingHours(item)} className="sanpin-action-btn edit" title="Редактировать">
                                                <FaEdit size={12} />
                                            </button>
                                            <button onClick={() => handleDeleteHours(item.id)} className="sanpin-action-btn delete" title="Удалить">
                                                <FaTrash size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const HoursForm = () => {
        const [formData, setFormData] = useState({ grade: '', subject_id: '', hours_per_week: 0, hours_per_year: 0 });

        React.useEffect(() => {
            if (editingHours) {
                setFormData({
                    grade: editingHours.grade,
                    subject_id: editingHours.subject_id,
                    hours_per_week: editingHours.hours_per_week || 0,
                    hours_per_year: editingHours.hours_per_year || 0
                });
            } else if (selectedGrade) {
                setFormData(prev => ({ ...prev, grade: selectedGrade }));
            }
        }, [editingHours, selectedGrade]);

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!formData.grade || !formData.subject_id) {
                showNotification('Заполните все поля', 'error');
                return;
            }
            handleSaveHours(formData);
        };

        if (!editingHours && !selectedGrade) return null;

        return (
            <div className="sanpin-form-card">
                <div className="sanpin-form-header">
                    <div className="sanpin-form-icon">
                        {editingHours ? <FaEdit size={16} /> : <FaPlus size={16} />}
                    </div>
                    <h4>{editingHours ? 'Редактирование нагрузки' : 'Добавление нагрузки'}</h4>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="sanpin-form-row">
                        <div className="sanpin-form-group">
                            <label>Класс</label>
                            <select value={formData.grade} onChange={e => setFormData({...formData, grade: parseInt(e.target.value)})} required>
                                {uniqueGrades.map(g => <option key={g} value={g}>{g} класс</option>)}
                            </select>
                        </div>
                        <div className="sanpin-form-group">
                            <label>Предмет</label>
                            <select value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: parseInt(e.target.value)})} required>
                                <option value="">Выберите предмет</option>
                                {validSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="sanpin-form-row">
                        <div className="sanpin-form-group">
                            <label>Часов в неделю</label>
                            <input type="number" min="0" max="10" step="0.5" value={formData.hours_per_week} onChange={e => setFormData({...formData, hours_per_week: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="sanpin-form-group">
                            <label>Часов в год</label>
                            <input type="number" min="0" max="350" value={formData.hours_per_year} onChange={e => setFormData({...formData, hours_per_year: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>
                    <div className="sanpin-form-actions">
                        <button type="button" className="sanpin-cancel-btn" onClick={() => {
                            setEditingHours(null);
                            setSelectedGrade(null);
                        }}>
                            <FaTimes /> Отмена
                        </button>
                        <button type="submit" className="sanpin-submit-btn" disabled={saving}>
                            <FaSave /> {saving ? 'Сохранение...' : (editingHours ? 'Обновить' : 'Добавить')}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    const DailyLimitForm = () => {
        const DAYS_RU = { monday: 'Понедельник', tuesday: 'Вторник', wednesday: 'Среда', thursday: 'Четверг', friday: 'Пятница', saturday: 'Суббота', sunday: 'Воскресенье' };
        const [formData, setFormData] = useState({ grade: '', day_name: '', min_weight: 0, max_weight: 0, max_lessons: '' });

        React.useEffect(() => {
            if (editingDailyLimit) {
                setFormData({
                    grade: editingDailyLimit.grade,
                    day_name: editingDailyLimit.day_name,
                    min_weight: editingDailyLimit.min_weight || 0,
                    max_weight: editingDailyLimit.max_weight || 0,
                    max_lessons: editingDailyLimit.max_lessons || ''
                });
            }
        }, [editingDailyLimit]);

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!formData.grade || !formData.day_name) {
                showNotification('Заполните все поля', 'error');
                return;
            }
            handleSaveDailyLimit(formData);
        };

        if (!editingDailyLimit) return null;

        return (
            <div className="sanpin-form-card">
                <div className="sanpin-form-header">
                    <div className="sanpin-form-icon">
                        <FaEdit size={16} />
                    </div>
                    <h4>Редактирование дневного лимита</h4>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="sanpin-form-row">
                        <div className="sanpin-form-group">
                            <label>Класс</label>
                            <select value={formData.grade} onChange={e => setFormData({...formData, grade: parseInt(e.target.value)})} required>
                                {uniqueGrades.map(g => <option key={g} value={g}>{g} класс</option>)}
                            </select>
                        </div>
                        <div className="sanpin-form-group">
                            <label>День недели</label>
                            <select value={formData.day_name} onChange={e => setFormData({...formData, day_name: e.target.value})} required>
                                {Object.entries(DAYS_RU).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="sanpin-form-row">
                        <div className="sanpin-form-group">
                            <label>Минимальный вес (баллов)</label>
                            <input type="number" min="0" value={formData.min_weight} onChange={e => setFormData({...formData, min_weight: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="sanpin-form-group">
                            <label>Максимальный вес (баллов)</label>
                            <input type="number" min="0" value={formData.max_weight} onChange={e => setFormData({...formData, max_weight: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>
                    <div className="sanpin-form-group">
                        <label>Максимум уроков в день (опционально)</label>
                        <input type="number" min="1" max="8" value={formData.max_lessons} onChange={e => setFormData({...formData, max_lessons: e.target.value ? parseInt(e.target.value) : ''})} placeholder="Напр: 7" />
                    </div>
                    <div className="sanpin-form-actions">
                        <button type="button" className="sanpin-cancel-btn" onClick={() => setEditingDailyLimit(null)}>
                            <FaTimes /> Отмена
                        </button>
                        <button type="submit" className="sanpin-submit-btn" disabled={saving}>
                            <FaSave /> {saving ? 'Сохранение...' : 'Обновить'}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    const DailyLimitsTable = () => {
        const DAYS_RU = { monday: 'Понедельник', tuesday: 'Вторник', wednesday: 'Среда', thursday: 'Четверг', friday: 'Пятница', saturday: 'Суббота', sunday: 'Воскресенье' };
        
        return (
            <div className="sanpin-table-card">
                <div className="sanpin-table-header">
                    <div className="sanpin-table-title">
                        <FaChartBar size={18} />
                        <h3>Дневные лимиты нагрузки</h3>
                    </div>
                    <button className="sanpin-add-btn" onClick={() => setEditingDailyLimit({})}>
                        <FaPlus size={12} /> Добавить лимит
                    </button>
                </div>
                <div className="sanpin-table-wrapper">
                    <table className="sanpin-table">
                        <thead>
                            <tr>
                                <th>Класс</th>
                                <th>День недели</th>
                                <th>Мин. баллов</th>
                                <th>Макс. баллов</th>
                                <th>Макс. уроков</th>
                                <th style={{ width: '100px' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyLimits.length === 0 ? (
                                <tr className="sanpin-empty-row">
                                    <td colSpan="6">
                                        <span className="empty-message">Нет данных. Добавьте дневные лимиты</span>
                                    </td>
                                </tr>
                            ) : (
                                dailyLimits.map(limit => (
                                    <tr key={limit.id}>
                                        <td><span className="grade-badge small">{limit.grade} класс</span></td>
                                        <td><span className="day-badge">{DAYS_RU[limit.day_name] || limit.day_name}</span></td>
                                        <td><span className="limit-value">{limit.min_weight}</span></td>
                                        <td><span className="limit-value">{limit.max_weight}</span></td>
                                        <td>{limit.max_lessons || '—'}</td>
                                        <td className="action-cell">
                                            <button onClick={() => setEditingDailyLimit(limit)} className="sanpin-action-btn edit" title="Редактировать">
                                                <FaEdit size={12} />
                                            </button>
                                            <button onClick={() => handleDeleteDailyLimit(limit.id)} className="sanpin-action-btn delete" title="Удалить">
                                                <FaTrash size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const WeeklyLimitForm = () => {
        const [formData, setFormData] = useState({ grade: '', week_weight: 0, month_weight: 0 });

        React.useEffect(() => {
            if (editingWeeklyLimit) {
                setFormData({
                    grade: editingWeeklyLimit.grade,
                    week_weight: editingWeeklyLimit.week_weight || 0,
                    month_weight: editingWeeklyLimit.month_weight || 0
                });
            }
        }, [editingWeeklyLimit]);

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!formData.grade) {
                showNotification('Выберите класс', 'error');
                return;
            }
            handleSaveWeeklyLimit(formData);
        };

        if (!editingWeeklyLimit) return null;

        return (
            <div className="sanpin-form-card">
                <div className="sanpin-form-header">
                    <div className="sanpin-form-icon">
                        <FaEdit size={16} />
                    </div>
                    <h4>Редактирование недельного лимита</h4>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="sanpin-form-row">
                        <div className="sanpin-form-group">
                            <label>Класс</label>
                            <select value={formData.grade} onChange={e => setFormData({...formData, grade: parseInt(e.target.value)})} required>
                                {uniqueGrades.map(g => <option key={g} value={g}>{g} класс</option>)}
                            </select>
                        </div>
                        <div className="sanpin-form-group">
                            <label>Недельный вес (баллов)</label>
                            <input type="number" min="0" value={formData.week_weight} onChange={e => setFormData({...formData, week_weight: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="sanpin-form-group">
                            <label>Месячный вес (баллов)</label>
                            <input type="number" min="0" value={formData.month_weight} onChange={e => setFormData({...formData, month_weight: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>
                    <div className="sanpin-form-actions">
                        <button type="button" className="sanpin-cancel-btn" onClick={() => setEditingWeeklyLimit(null)}>
                            <FaTimes /> Отмена
                        </button>
                        <button type="submit" className="sanpin-submit-btn" disabled={saving}>
                            <FaSave /> {saving ? 'Сохранение...' : 'Обновить'}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    const WeeklyLimitsTable = () => {
        const displayLimits = getWeeklyLimitsDisplay();
        
        return (
            <div className="sanpin-table-card">
                <div className="sanpin-table-header">
                    <div className="sanpin-table-title">
                        <FaCalendarWeek size={18} />
                        <h3>Недельные и месячные лимиты</h3>
                    </div>
                    <div className="sanpin-header-actions">
                        <button className="sanpin-secondary-btn" onClick={() => autoSaveWeeklyLimits()} title="Пересчитать из дневных лимитов">
                            <FaCalculator size={12} /> Пересчитать
                        </button>
                        <button className="sanpin-add-btn" onClick={() => setEditingWeeklyLimit({})}>
                            <FaPlus size={12} /> Добавить вручную
                        </button>
                    </div>
                </div>
                <div className="sanpin-table-wrapper">
                    <table className="sanpin-table">
                        <thead>
                            <tr>
                                <th>Класс</th>
                                <th>Недельный вес</th>
                                <th>Месячный вес</th>
                                <th>Источник</th>
                                <th style={{ width: '100px' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayLimits.length === 0 ? (
                                <tr className="sanpin-empty-row">
                                    <td colSpan="5">
                                        <span className="empty-message">Нет данных. Нажмите "Пересчитать" для автоматического расчета</span>
                                    </td>
                                </tr>
                            ) : (
                                displayLimits.map(limit => (
                                    <tr key={limit.grade}>
                                        <td><span className="grade-badge small">{limit.grade} класс</span></td>
                                        <td><span className="limit-value">{limit.week_weight}</span></td>
                                        <td><span className="limit-value">{limit.month_weight}</span></td>
                                        <td>
                                            {limit.is_auto ? (
                                                <span className="auto-badge">
                                                    <FaCalculator size={10} /> Авто
                                                </span>
                                            ) : (
                                                <span className="manual-badge">
                                                    <FaCheck size={10} /> Вручную
                                                </span>
                                            )}
                                        </td>
                                        <td className="action-cell">
                                            {!limit.is_auto && (
                                                <>
                                                    <button onClick={() => {
                                                        const existing = weeklyLimits.find(w => w.grade === limit.grade);
                                                        if (existing) setEditingWeeklyLimit(existing);
                                                    }} className="sanpin-action-btn edit" title="Редактировать">
                                                        <FaEdit size={12} />
                                                    </button>
                                                    <button onClick={() => {
                                                        const existing = weeklyLimits.find(w => w.grade === limit.grade);
                                                        if (existing) handleDeleteWeeklyLimit(existing.id);
                                                    }} className="sanpin-action-btn delete" title="Удалить">
                                                        <FaTrash size={12} />
                                                    </button>
                                                </>
                                            )}
                                            {limit.is_auto && (
                                                <span className="info-hint">Авто-расчёт</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="sanpin-table-note">
                    <FaInfoCircle size={12} />
                    <span>Недельный вес = сумма максимальных баллов за понедельник-пятницу. Месячный вес = недельный × 4.</span>
                </div>
            </div>
        );
    };

    const LoadSummary = () => (
        <div className="sanpin-table-card">
            <div className="sanpin-table-header">
                <div className="sanpin-table-title">
                    <FaChartLine size={18} />
                    <h3>Сводка недельной нагрузки</h3>
                </div>
            </div>
            <div className="sanpin-table-wrapper">
                <table className="sanpin-table">
                    <thead>
                        <tr>
                            <th>Класс</th>
                            <th>Всего часов</th>
                            <th>Общий вес (баллы)</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueGrades.map(grade => {
                            const { totalHours, totalPoints } = calculateWeeklyLoad(grade);
                            const weeklyLimit = getWeeklyLimitsDisplay().find(w => w.grade === grade);
                            const isOverload = weeklyLimit && totalPoints > weeklyLimit.week_weight;
                            const percent = weeklyLimit?.week_weight ? Math.round((totalPoints / weeklyLimit.week_weight) * 100) : 0;
                            return (
                                <tr key={grade} className={isOverload ? 'overload-row' : ''}>
                                    <td><span className="grade-badge">{grade} класс</span></td>
                                    <td>{totalHours.toFixed(1)} ч.</td>
                                    <td className="weight-cell"><strong>{Math.round(totalPoints)}</strong> баллов</td>
                                    <td>
                                        {totalPoints > 0 ? (
                                            isOverload ? (
                                                <div className="status-badge warning">
                                                    <FaExclamationTriangle size={12} />
                                                    <span>Превышение! {percent}%</span>
                                                </div>
                                            ) : (
                                                <div className="status-badge success">
                                                    <FaCheck size={12} />
                                                    <span>Норма ({percent}%)</span>
                                                </div>
                                            )
                                        ) : (
                                            <div className="status-badge muted">Нет данных</div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="sanpin-table-note">
                <FaInfoCircle size={12} />
                <span>Вес = часы в неделю × ранг сложности. Превышение недельного лимита подсвечивается.</span>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="sanpin-loading">
                <div className="spinner"></div>
                <p>Загрузка данных...</p>
            </div>
        );
    }

    return (
        <div className="sanpin-container">
            {notification.message && (
                <div className={`sanpin-notification ${notification.type}`}>
                    {notification.type === 'success' ? <FaCheck size={14} /> : <FaExclamationTriangle size={14} />}
                    <span>{notification.message}</span>
                </div>
            )}

            <div className="sanpin-header">
                <div className="sanpin-header-text">
                    <h1>Тарификация</h1>
                    <p>Управление рангами сложности, недельной нагрузкой, дневными лимитами и правилами генерации</p>
                </div>
            </div>

            <div className="sanpin-tabs-wrapper">
                {Object.entries(TAB_ICONS).map(([id, Icon]) => (
                    <TabButton key={id} id={id} icon={Icon} label={TAB_LABELS[id]} />
                ))}
            </div>

            <div className="sanpin-tab-content">
                {activeTab === 'difficulty' && (
                    <>
                        <DifficultyTable />
                        <EditDifficultyModal />
                        <AddDifficultyModal />
                        <div className="sanpin-info-card">
                            <FaInfoCircle size={14} />
                            <span>Ранг сложности (1-10) влияет на вес урока. Чем выше ранг, тем сложнее предмет.</span>
                        </div>
                    </>
                )}

                {activeTab === 'hours' && (
                    <>
                        <HoursForm />
                        <HoursTable />
                        <div className="sanpin-info-card">
                            <FaInfoCircle size={14} />
                            <span>Вес = часы в неделю × ранг сложности. Используется для балансировки расписания.</span>
                        </div>
                    </>
                )}

                {activeTab === 'dailyLimits' && (
                    <>
                        <DailyLimitForm />
                        <DailyLimitsTable />
                        <div className="sanpin-info-card">
                            <FaInfoCircle size={14} />
                            <span>Дневные лимиты определяют допустимый диапазон суммарных баллов трудности. 
                            Среда — пик, понедельник и пятница — минимум. При сохранении недельные лимиты пересчитываются автоматически.</span>
                        </div>
                    </>
                )}

                {activeTab === 'weeklyLimits' && (
                    <>
                        <WeeklyLimitForm />
                        <WeeklyLimitsTable />
                    </>
                )}

                {activeTab === 'summary' && <LoadSummary />}
                {activeTab === 'pairing' && <PairingRulesTab token={token} />}
                {activeTab === 'group' && <GroupDivisionTab token={token} />}
                {activeTab === 'parallel' && <ParallelSyncTab token={token} />}
                {activeTab === 'forbidden' && <ForbiddenSequencesTab token={token} />}
            </div>
        </div>
    );
};

export default SanPinTab;