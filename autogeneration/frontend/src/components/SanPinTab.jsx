// components/tabs/SanPinTab.jsx
import React, { useState, useEffect } from 'react';
import { 
    FaBook, FaCalendarWeek, FaBalanceScale, FaSave, FaExclamationTriangle, 
    FaInfoCircle, FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaSpinner,
    FaChartLine, FaLink, FaUsers, FaSync, FaBan, FaCalculator
} from 'react-icons/fa';
import axios from 'axios';
import PairingRulesTab from '../sanpin/PairingRulesTab';
import GroupDivisionTab from '../sanpin/GroupDivisionTab';
import ParallelSyncTab from '../sanpin/ParallelSyncTab';
import ForbiddenSequencesTab from '../sanpin/ForbiddenSequencesTab';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SUBJECT_TYPES = [
    { value: 'exact', label: 'Точные науки', color: '#3b82f6' },
    { value: 'humanities', label: 'Гуманитарные', color: '#10b981' },
    { value: 'neutral', label: 'Нейтральные', color: '#f59e0b' }
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
    const [notification, setNotification] = useState('');
    const [editingDifficulty, setEditingDifficulty] = useState(null);
    const [editingHours, setEditingHours] = useState(null);
    const [editingDailyLimit, setEditingDailyLimit] = useState(null);
    const [editingWeeklyLimit, setEditingWeeklyLimit] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);

    useEffect(() => {
        loadAllData();
    }, []);

    const showNotification = (message, isError = false) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
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
            showNotification('Ошибка загрузки данных', true);
        } finally {
            setLoading(false);
        }
    };

    // ============= РАСЧЕТ НЕДЕЛЬНЫХ ЛИМИТОВ ИЗ ДНЕВНЫХ =============
    const calculateWeeklyFromDaily = () => {
        const grades = [...new Set(dailyLimits.map(d => d.grade))];
        const calculated = [];
        
        for (const grade of grades) {
            const gradeLimits = dailyLimits.filter(d => d.grade === grade && DAYS_ORDER.includes(d.day_name));
            let totalMin = 0;
            let totalMax = 0;
            
            for (const day of DAYS_ORDER) {
                const limit = gradeLimits.find(d => d.day_name === day);
                if (limit) {
                    totalMin += limit.min_weight;
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

    // ============= АВТОМАТИЧЕСКОЕ СОХРАНЕНИЕ НЕДЕЛЬНЫХ ЛИМИТОВ =============
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
            showNotification('Ошибка автоматического расчета', true);
        } finally {
            setSaving(false);
        }
    };

    // ============= ОБРАБОТЧИКИ =============
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
        } catch (error) {
            console.error('Error saving difficulty:', error);
            showNotification('Ошибка сохранения', true);
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
            showNotification('Ошибка удаления', true);
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
            showNotification('Ошибка сохранения', true);
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
            showNotification('Ошибка удаления', true);
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
            // Автоматически пересчитываем недельные лимиты
            await autoSaveWeeklyLimits();
        } catch (error) {
            console.error('Error saving daily limit:', error);
            showNotification('Ошибка сохранения', true);
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
            // Автоматически пересчитываем недельные лимиты
            await autoSaveWeeklyLimits();
        } catch (error) {
            console.error('Error deleting daily limit:', error);
            showNotification('Ошибка удаления', true);
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
            showNotification('Ошибка сохранения', true);
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
            showNotification('Ошибка удаления', true);
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

    // Округляем до 1 десятичного знака
    totalHours = Math.round(totalHours * 10) / 10;
    totalPoints = Math.round(totalPoints);

    return { totalHours, totalPoints };
};

    const uniqueGrades = getUniqueGrades();
    const validSubjects = subjects.filter(s => s && s.name);

    // ============= ПОЛУЧЕНИЕ РАССЧИТАННЫХ НЕДЕЛЬНЫХ ЛИМИТОВ =============
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

    // ============= ФОРМЫ =============
    const DifficultyForm = () => {
        const [formData, setFormData] = useState({ grade: '', subject_id: '', difficulty_rank: 5, subject_type: 'neutral' });

        React.useEffect(() => {
            if (editingDifficulty) {
                setFormData({
                    grade: editingDifficulty.grade,
                    subject_id: editingDifficulty.subject_id,
                    difficulty_rank: editingDifficulty.difficulty_rank,
                    subject_type: editingDifficulty.subject_type || 'neutral'
                });
            } else if (selectedGrade) {
                setFormData(prev => ({ ...prev, grade: selectedGrade }));
            } else if (uniqueGrades[0]) {
                setFormData(prev => ({ ...prev, grade: uniqueGrades[0] }));
            }
        }, [editingDifficulty, selectedGrade]);

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!formData.grade || !formData.subject_id) {
                showNotification('Заполните все поля', true);
                return;
            }
            handleSaveDifficulty(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="form-container" style={{ marginBottom: '1.25rem' }}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Класс</label>
                        <select value={formData.grade} onChange={e => setFormData({...formData, grade: parseInt(e.target.value)})} required>
                            <option value="">Выберите класс</option>
                            {uniqueGrades.map(g => <option key={g} value={g}>{g} класс</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Предмет</label>
                        <select value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: parseInt(e.target.value)})} required>
                            <option value="">Выберите предмет</option>
                            {validSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Ранг сложности (1-13)</label>
                        <select value={formData.difficulty_rank} onChange={e => setFormData({...formData, difficulty_rank: parseInt(e.target.value)})}>
                            {DIFFICULTY_RANKS.map(rank => (
                                <option key={rank.value} value={rank.value}>{rank.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Тип предмета</label>
                        <select value={formData.subject_type} onChange={e => setFormData({...formData, subject_type: e.target.value})}>
                            {SUBJECT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="form-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button type="submit" className="btn-save-modal" disabled={saving}>
                        <FaSave /> {saving ? 'Сохранение...' : (editingDifficulty ? 'Обновить' : 'Добавить')}
                    </button>
                    {(editingDifficulty || selectedGrade) && (
                        <button type="button" className="btn-cancel-modal" onClick={() => {
                            setEditingDifficulty(null);
                            setSelectedGrade(null);
                        }}>
                            <FaTimes /> Отмена
                        </button>
                    )}
                </div>
            </form>
        );
    };

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
            } else if (uniqueGrades[0]) {
                setFormData(prev => ({ ...prev, grade: uniqueGrades[0] }));
            }
        }, [editingHours, selectedGrade]);

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!formData.grade || !formData.subject_id) {
                showNotification('Заполните все поля', true);
                return;
            }
            handleSaveHours(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="form-container" style={{ marginBottom: '1.25rem' }}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Класс</label>
                        <select value={formData.grade} onChange={e => setFormData({...formData, grade: parseInt(e.target.value)})} required>
                            <option value="">Выберите класс</option>
                            {uniqueGrades.map(g => <option key={g} value={g}>{g} класс</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Предмет</label>
                        <select value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: parseInt(e.target.value)})} required>
                            <option value="">Выберите предмет</option>
                            {validSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Часов в неделю</label>
                        <input type="number" min="0" max="10" step="0.5" value={formData.hours_per_week} onChange={e => setFormData({...formData, hours_per_week: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="form-group">
                        <label>Часов в год</label>
                        <input type="number" min="0" max="350" value={formData.hours_per_year} onChange={e => setFormData({...formData, hours_per_year: parseInt(e.target.value) || 0})} />
                    </div>
                </div>
                <div className="form-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button type="submit" className="btn-save-modal" disabled={saving}>
                        <FaSave /> {saving ? 'Сохранение...' : (editingHours ? 'Обновить' : 'Добавить')}
                    </button>
                    {(editingHours || selectedGrade) && (
                        <button type="button" className="btn-cancel-modal" onClick={() => {
                            setEditingHours(null);
                            setSelectedGrade(null);
                        }}>
                            <FaTimes /> Отмена
                        </button>
                    )}
                </div>
            </form>
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
            } else if (uniqueGrades[0]) {
                setFormData(prev => ({ ...prev, grade: uniqueGrades[0] }));
            }
        }, [editingDailyLimit]);

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!formData.grade || !formData.day_name) {
                showNotification('Заполните все поля', true);
                return;
            }
            handleSaveDailyLimit(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="form-container" style={{ marginBottom: '1.25rem' }}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Класс</label>
                        <select value={formData.grade} onChange={e => setFormData({...formData, grade: parseInt(e.target.value)})} required>
                            <option value="">Выберите класс</option>
                            {uniqueGrades.map(g => <option key={g} value={g}>{g} класс</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>День недели</label>
                        <select value={formData.day_name} onChange={e => setFormData({...formData, day_name: e.target.value})} required>
                            <option value="">Выберите день</option>
                            {Object.entries(DAYS_RU).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Минимальный вес (баллов)</label>
                        <input type="number" min="0" value={formData.min_weight} onChange={e => setFormData({...formData, min_weight: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="form-group">
                        <label>Максимальный вес (баллов)</label>
                        <input type="number" min="0" value={formData.max_weight} onChange={e => setFormData({...formData, max_weight: parseInt(e.target.value) || 0})} />
                    </div>
                </div>
                <div className="form-group">
                    <label>Максимум уроков в день (опционально)</label>
                    <input type="number" min="1" max="8" value={formData.max_lessons} onChange={e => setFormData({...formData, max_lessons: e.target.value ? parseInt(e.target.value) : ''})} placeholder="Напр: 7" />
                </div>
                <div className="form-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button type="submit" className="btn-save-modal" disabled={saving}>
                        <FaSave /> {saving ? 'Сохранение...' : (editingDailyLimit ? 'Обновить' : 'Добавить')}
                    </button>
                    {editingDailyLimit && (
                        <button type="button" className="btn-cancel-modal" onClick={() => setEditingDailyLimit(null)}>
                            <FaTimes /> Отмена
                        </button>
                    )}
                </div>
            </form>
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
            } else if (uniqueGrades[0]) {
                setFormData(prev => ({ ...prev, grade: uniqueGrades[0] }));
            }
        }, [editingWeeklyLimit]);

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!formData.grade) {
                showNotification('Выберите класс', true);
                return;
            }
            handleSaveWeeklyLimit(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="form-container" style={{ marginBottom: '1.25rem' }}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Класс</label>
                        <select value={formData.grade} onChange={e => setFormData({...formData, grade: parseInt(e.target.value)})} required>
                            <option value="">Выберите класс</option>
                            {uniqueGrades.map(g => <option key={g} value={g}>{g} класс</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Недельный вес (баллов)</label>
                        <input type="number" min="0" value={formData.week_weight} onChange={e => setFormData({...formData, week_weight: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="form-group">
                        <label>Месячный вес (баллов)</label>
                        <input type="number" min="0" value={formData.month_weight} onChange={e => setFormData({...formData, month_weight: parseInt(e.target.value) || 0})} />
                    </div>
                </div>
                <div className="form-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button type="submit" className="btn-save-modal" disabled={saving}>
                        <FaSave /> {saving ? 'Сохранение...' : (editingWeeklyLimit ? 'Обновить' : 'Добавить')}
                    </button>
                    {editingWeeklyLimit && (
                        <button type="button" className="btn-cancel-modal" onClick={() => setEditingWeeklyLimit(null)}>
                            <FaTimes /> Отмена
                        </button>
                    )}
                </div>
            </form>
        );
    };

    // ============= ТАБЛИЦЫ =============
    const DifficultyTable = () => (
        <div className="table-container">
            <div className="table-header-actions">
                <h4><FaBalanceScale /> Ранги сложности предметов</h4>
                <button className="btn-add-small" onClick={() => setSelectedGrade(uniqueGrades[0])}>
                    <FaPlus /> Добавить
                </button>
            </div>
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Класс</th>
                            <th>Предмет</th>
                            <th>Ранг</th>
                            <th>Тип</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueGrades.map(grade => {
                            const gradeDifficulties = subjectDifficulty.filter(d => d.grade === grade);
                            if (gradeDifficulties.length === 0) {
                                return (
                                    <tr key={grade} className="empty-row">
                                        <td colSpan="5">
                                            {grade} класс - нет данных
                                            <button className="btn-link" onClick={() => setSelectedGrade(grade)}>Добавить</button>
                                        </td>
                                    </tr>
                                );
                            }
                            return gradeDifficulties.map((item, idx) => {
                                const subject = subjects.find(s => s.id === item.subject_id);
                                const type = SUBJECT_TYPES.find(t => t.value === item.subject_type);
                                const rankColor = DIFFICULTY_RANKS.find(r => r.value === item.difficulty_rank)?.color || '#6b7280';
                                return (
                                    <tr key={item.id}>
                                        {idx === 0 && <td rowSpan={gradeDifficulties.length} className="grade-cell"><strong>{grade} класс</strong></td>}
                                        <td><strong>{subject?.name || '-'}</strong></td>
                                        <td><span className="difficulty-badge" style={{ background: rankColor }}>{item.difficulty_rank}</span></td>
                                        <td><span className="subject-type-badge" style={{ background: type?.color }}>{type?.label || 'Нейтральный'}</span></td>
                                        <td className="action-cell">
                                            <button onClick={() => setEditingDifficulty(item)} className="action-button edit-button" title="Редактировать"><FaEdit /></button>
                                            <button onClick={() => handleDeleteDifficulty(item.id)} className="action-button delete-button" title="Удалить"><FaTrash /></button>
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

    const HoursTable = () => (
        <div className="table-container">
            <div className="table-header-actions">
                <h4><FaCalendarWeek /> Недельная нагрузка (часы)</h4>
                <button className="btn-add-small" onClick={() => setSelectedGrade(uniqueGrades[0])}>
                    <FaPlus /> Добавить
                </button>
            </div>
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Класс</th>
                            <th>Предмет</th>
                            <th>Часов в неделю</th>
                            <th>Вес (баллы)</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueGrades.map(grade => {
                            const gradeHours = subjectHours.filter(h => h.grade === grade);
                            if (gradeHours.length === 0) {
                                return (
                                    <tr key={grade} className="empty-row">
                                        <td colSpan="5">
                                            {grade} класс - нет данных
                                            <button className="btn-link" onClick={() => setSelectedGrade(grade)}>Добавить</button>
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
                                        {idx === 0 && <td rowSpan={gradeHours.length} className="grade-cell"><strong>{grade} класс</strong></td>}
                                        <td><strong>{subject?.name || '-'}</strong></td>
                                        <td><span className="limit-value">{item.hours_per_week || 0}</span></td>
                                        <td className="weight-cell">{weight}</td>
                                        <td className="action-cell">
                                            <button onClick={() => setEditingHours(item)} className="action-button edit-button" title="Редактировать"><FaEdit /></button>
                                            <button onClick={() => handleDeleteHours(item.id)} className="action-button delete-button" title="Удалить"><FaTrash /></button>
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

    const DailyLimitsTable = () => {
        const DAYS_RU = { monday: 'Понедельник', tuesday: 'Вторник', wednesday: 'Среда', thursday: 'Четверг', friday: 'Пятница', saturday: 'Суббота', sunday: 'Воскресенье' };
        
        return (
            <div className="table-container">
                <div className="table-header-actions">
                    <h4><FaChartLine /> Дневные лимиты нагрузки</h4>
                    <button className="btn-add-small" onClick={() => setEditingDailyLimit({})}>
                        <FaPlus /> Добавить лимит
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Класс</th>
                                <th>День недели</th>
                                <th>Мин. баллов</th>
                                <th>Макс. баллов</th>
                                <th>Макс. уроков</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyLimits.length === 0 ? (
                                <tr className="empty-row">
                                    <td colSpan="6">Нет данных. Добавьте дневные лимиты.</td>
                                </tr>                            ) : (
                                dailyLimits.map(limit => (
                                    <tr key={limit.id}>
                                        <td><strong>{limit.grade} класс</strong></td>
                                        <td><span className="day-badge">{DAYS_RU[limit.day_name] || limit.day_name}</span></td>
                                        <td>{limit.min_weight}</td>
                                        <td>{limit.max_weight}</td>
                                        <td>{limit.max_lessons || '-'}</td>
                                        <td className="action-cell">
                                            <button onClick={() => setEditingDailyLimit(limit)} className="action-button edit-button" title="Редактировать"><FaEdit /></button>
                                            <button onClick={() => handleDeleteDailyLimit(limit.id)} className="action-button delete-button" title="Удалить"><FaTrash /></button>
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

    const WeeklyLimitsTable = () => {
        const displayLimits = getWeeklyLimitsDisplay();
        
        return (
            <div className="table-container">
                <div className="table-header-actions">
                    <h4><FaCalendarWeek /> Недельные и месячные лимиты</h4>
                    <div>
                        <button 
                            className="btn-add-small" 
                            onClick={() => autoSaveWeeklyLimits()} 
                            style={{ marginRight: '0.5rem', background: 'var(--info)' }}
                            title="Пересчитать из дневных лимитов"
                        >
                            <FaCalculator /> Пересчитать из дневных
                        </button>
                        <button className="btn-add-small" onClick={() => setEditingWeeklyLimit({})}>
                            <FaPlus /> Добавить вручную
                        </button>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Класс</th>
                                <th>Недельный вес (баллов)</th>
                                <th>Месячный вес (баллов)</th>
                                <th>Источник</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayLimits.length === 0 ? (
                                <tr className="empty-row">
                                    <td colSpan="5">Нет данных. Нажмите "Пересчитать" для автоматического расчета.</td>
                                </tr>
                            ) : (
                                displayLimits.map(limit => (
                                    <tr key={limit.grade}>
                                        <td><strong>{limit.grade} класс</strong></td>
                                        <td><span className="limit-value">{limit.week_weight}</span></td>
                                        <td><span className="limit-value">{limit.month_weight}</span></td>
                                        <td>
                                            {limit.is_auto ? (
                                                <span className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                                                    <FaCalculator /> Авто (из дневных)
                                                </span>
                                            ) : (
                                                <span className="status-badge success">
                                                    <FaCheck /> Вручную
                                                </span>
                                            )}
                                        </td>
                                        <td className="action-cell">
                                            {!limit.is_auto && (
                                                <button onClick={() => {
                                                    const existing = weeklyLimits.find(w => w.grade === limit.grade);
                                                    if (existing) setEditingWeeklyLimit(existing);
                                                }} className="action-button edit-button" title="Редактировать">
                                                    <FaEdit />
                                                </button>
                                            )}
                                            {!limit.is_auto && (
                                                <button onClick={() => {
                                                    const existing = weeklyLimits.find(w => w.grade === limit.grade);
                                                    if (existing) handleDeleteWeeklyLimit(existing.id);
                                                }} className="action-button delete-button" title="Удалить">
                                                    <FaTrash />
                                                </button>
                                            )}
                                            {limit.is_auto && (
                                                <span className="info-note" style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem' }}>
                                                    <FaInfoCircle /> Рассчитано автоматически
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="info-note">
                    <FaInfoCircle /> Недельный вес = сумма максимальных баллов за понедельник-пятницу. Месячный вес = недельный × 4.
                    При изменении дневных лимитов недельные пересчитываются автоматически.
                </div>
            </div>
        );
    };

    const LoadSummary = () => (
        <div className="table-container">
            <div className="table-header-actions">
                <h4><FaChartLine /> Сводка недельной нагрузки</h4>
            </div>
            <div className="table-responsive">
                <table className="data-table">
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
                            return (
                                <tr key={grade} className={isOverload ? 'overload-row' : ''}>
                                    <td><strong>{grade} класс</strong></td>
                                   <td>{totalHours.toFixed(1)} ч.</td>
<td className="weight-cell"><strong>{totalPoints}</strong> баллов</td>
                                    <td>
                                        {totalPoints > 0 ? (
                                            isOverload ? (
                                                <span className="status-badge warning"><FaExclamationTriangle /> Превышение!</span>
                                            ) : (
                                                <span className="status-badge success"><FaCheck /> Загружено</span>
                                            )
                                        ) : (
                                            <span className="status-badge muted">Нет данных</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="info-note">
                <FaInfoCircle /> Вес = часы в неделю × ранг сложности. Превышение недельного лимита подсвечивается оранжевым.
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="sanpin-loading">
                <FaSpinner className="spinner" />
                <p>Загрузка...</p>
            </div>
        );
    }

    return (
        <div className="sanpin-container">
            {notification && <div className={`notification ${notification.includes('Ошибка') ? 'error' : 'success'}`}>{notification}</div>}

            <div className="sanpin-header">
                <h2><FaBalanceScale /> Настройка нагрузки и сложности предметов</h2>
                <p>Управление рангами сложности, недельной нагрузкой, дневными лимитами и правилами генерации</p>
            </div>

            <div className="sanpin-tabs">
                <button className={`sanpin-tab ${activeTab === 'difficulty' ? 'active' : ''}`} onClick={() => setActiveTab('difficulty')}>
                    <FaBalanceScale /> Ранги сложности
                </button>
                <button className={`sanpin-tab ${activeTab === 'hours' ? 'active' : ''}`} onClick={() => setActiveTab('hours')}>
                    <FaCalendarWeek /> Нагрузка по часам
                </button>
                <button className={`sanpin-tab ${activeTab === 'dailyLimits' ? 'active' : ''}`} onClick={() => setActiveTab('dailyLimits')}>
                    <FaChartLine /> Дневные лимиты
                </button>
                <button className={`sanpin-tab ${activeTab === 'weeklyLimits' ? 'active' : ''}`} onClick={() => setActiveTab('weeklyLimits')}>
                    <FaCalendarWeek /> Недельные лимиты
                </button>
                <button className={`sanpin-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                    <FaChartLine /> Сводка нагрузки
                </button>
                <button className={`sanpin-tab ${activeTab === 'pairing' ? 'active' : ''}`} onClick={() => setActiveTab('pairing')}>
                    <FaLink /> Спаривание уроков
                </button>
                <button className={`sanpin-tab ${activeTab === 'group' ? 'active' : ''}`} onClick={() => setActiveTab('group')}>
                    <FaUsers /> Групповые занятия
                </button>
                <button className={`sanpin-tab ${activeTab === 'parallel' ? 'active' : ''}`} onClick={() => setActiveTab('parallel')}>
                    <FaSync /> Синхронизация
                </button>
                <button className={`sanpin-tab ${activeTab === 'forbidden' ? 'active' : ''}`} onClick={() => setActiveTab('forbidden')}>
                    <FaBan /> Запрещённые последовательности
                </button>
            </div>

            {activeTab === 'difficulty' && (
                <>
                    <DifficultyForm />
                    <DifficultyTable />
                    <div className="info-note">
                        <FaInfoCircle /> Ранг сложности (1-13) влияет на вес урока. Чем выше ранг, тем сложнее предмет.
                    </div>
                </>
            )}

            {activeTab === 'hours' && (
                <>
                    <HoursForm />
                    <HoursTable />
                    <div className="info-note">
                        <FaInfoCircle /> Вес = часы в неделю × ранг сложности. Используется для балансировки расписания.
                    </div>
                </>
            )}

            {activeTab === 'dailyLimits' && (
                <>
                    <DailyLimitForm />
                    <DailyLimitsTable />
                    <div className="info-note">
                        <FaInfoCircle /> Дневные лимиты определяют допустимый диапазон суммарных баллов трудности. 
                        Среда — пик, понедельник и пятница — минимум. При сохранении недельные лимиты пересчитываются автоматически.
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
    );
};

export default SanPinTab;