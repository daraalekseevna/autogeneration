// ExcelGenerator.jsx - ЧИСТАЯ ВЕРСИЯ БЕЗ scheduleAPI
import React, { useState, useEffect, useCallback } from 'react'; 
import { 
    FaCog, 
    FaPlay,
    FaClock,
    FaDoorOpen,
    FaSchool,
    FaListAlt,
    FaCheck,
    FaArrowLeft,
    FaTrash,
    FaEye,
    FaCalendarAlt,
    FaHourglassHalf,
    FaChalkboardTeacher,
    FaBell,
    FaPlus,
    FaSun,
    FaMoon,
    FaDatabase,
    FaSpinner,
    FaTimes
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ExcelGenerator.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const MAX_LESSONS = 8;

const INITIAL_SETTINGS = {
    startTime: '08:00',
    lessonDuration: 40,
    maxLessonsPerDay: 7,
    shortBreakDuration: 10,
    breaks: [{ afterLesson: 3, duration: 20 }, { afterLesson: 5, duration: 15 }],
    workDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
    saturdayLessons: false,
    secondShift: false,
    secondShiftClasses: ['2А', '2Б', '3А', '3Б', '4А', '4Б'],
    secondShiftStart: '14:00',
    secondShiftShortBreakDuration: 10,
    secondShiftBreaks: [{ afterLesson: 3, duration: 20 }],
    allowEmptyLessons: false,
    balanceLoad: true
};

const BreaksConfig = ({ breaks, shortBreakDuration, onBreaksChange, onShortBreakChange, disabled = false }) => {
    const addBreak = () => {
        const lastBreak = breaks[breaks.length - 1];
        const newAfterLesson = lastBreak ? Math.min(lastBreak.afterLesson + 1, MAX_LESSONS - 1) : 2;
        onBreaksChange([...breaks, { afterLesson: newAfterLesson, duration: 20 }]);
    };
    
    const removeBreak = (index) => {
        onBreaksChange(breaks.filter((_, i) => i !== index));
    };
    
    const updateBreak = (index, field, value) => {
        const newBreaks = [...breaks];
        newBreaks[index] = { ...newBreaks[index], [field]: parseInt(value) };
        onBreaksChange(newBreaks);
    };
    
    const getAvailableLessons = (currentIndex) => {
        const selectedLessons = breaks.map((b, i) => i !== currentIndex ? b.afterLesson : null);
        const lessons = [];
        for (let i = 2; i <= MAX_LESSONS; i++) {
            if (!selectedLessons.includes(i)) lessons.push(i);
        }
        return lessons;
    };
    
    return (
        <div className="excel-gen-breaks-list">
            <div className="excel-gen-setting-item" style={{ marginBottom: '16px' }}>
                <label>Маленькая перемена (мин)</label>
                <input type="number" min="5" max="30" value={shortBreakDuration} onChange={(e) => onShortBreakChange(parseInt(e.target.value))} disabled={disabled} />
                <div className="excel-gen-setting-description">Ставится после всех уроков, где не указана большая перемена</div>
            </div>
            
            <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Большие перемены</label>
            {breaks.map((breakItem, index) => (
                <div key={index} className="excel-gen-break-item">
                    <div className="excel-gen-break-number">{index + 1}</div>
                    <div className="excel-gen-break-info">
                        <select value={breakItem.afterLesson} onChange={(e) => updateBreak(index, 'afterLesson', e.target.value)} disabled={disabled}>
                            {getAvailableLessons(index).map(lesson => (<option key={lesson} value={lesson}>После {lesson}-го урока</option>))}
                        </select>
                        <input type="number" min="10" max="45" value={breakItem.duration} onChange={(e) => updateBreak(index, 'duration', e.target.value)} disabled={disabled} style={{ width: '100px' }} />
                        <span style={{ fontSize: '0.8rem' }}>мин</span>
                    </div>
                    <button className="excel-gen-break-remove" onClick={() => removeBreak(index)} disabled={disabled}><FaTimes /></button>
                </div>
            ))}
            
            <button className="excel-gen-add-break-btn" onClick={addBreak} disabled={disabled || breaks.length >= MAX_LESSONS - 2}>
                <FaPlus /> Добавить большую перемену
            </button>
            <div className="excel-gen-break-note">* Большие перемены можно ставить после любых уроков (кроме последнего).</div>
        </div>
    );
};

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
    useEffect(() => {
        if (isDark) { document.body.classList.add('dark-theme'); localStorage.setItem('theme', 'dark'); } 
        else { document.body.classList.remove('dark-theme'); localStorage.setItem('theme', 'light'); }
    }, [isDark]);
    return (
        <div className="theme-toggle">
            <button className="theme-btn" onClick={() => setIsDark(prev => !prev)}>
                {isDark ? <FaSun /> : <FaMoon />}
                {isDark ? 'Светлая тема' : 'Темная тема'}
            </button>
        </div>
    );
};

const ExcelGenerator = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [generationComplete, setGenerationComplete] = useState(false);
    const [settings, setSettings] = useState(INITIAL_SETTINGS);
    const [dbStats, setDbStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [generationStats, setGenerationStats] = useState({
        classes: 0, teachers: 0, rooms: 0, subjects: 0, conflicts: 0, assignments: 0, time: 0
    });
    
    // Загрузка статистики из БД
    useEffect(() => {
        const loadDbStats = async () => {
            if (!token) return;
            setLoadingStats(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [classesRes, teachersRes, roomsRes, subjectsRes] = await Promise.all([
                    axios.get(`${API_URL}/superadmin/classes`, config),
                    axios.get(`${API_URL}/superadmin/teachers`, config),
                    axios.get(`${API_URL}/superadmin/rooms`, config),
                    axios.get(`${API_URL}/superadmin/lessons`, config)
                ]);
                setDbStats({
                    classes: classesRes.data?.length || 0,
                    teachers: teachersRes.data?.length || 0,
                    rooms: roomsRes.data?.length || 0,
                    subjects: subjectsRes.data?.length || 0
                });
            } catch (error) {
                console.error('Error loading DB stats:', error);
            } finally {
                setLoadingStats(false);
            }
        };
        loadDbStats();
    }, [token]);
    
    // Сохранение настроек
    const saveSettings = useCallback(async () => {
        try {
            await axios.post(`${API_URL}/superadmin/schedule-settings`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Настройки сохранены');
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, [settings, token]);
    
    // Генерация расписания
    const handleGenerate = useCallback(async () => {
        if (!token) {
            alert('Требуется авторизация');
            return;
        }
        
        setIsGenerating(true);
        setGenerationComplete(false);
        setProgress(0);
        setCurrentStep(0);
        
        const startTime = performance.now();
        
        try {
            setProgress(5);
            setCurrentStep(0);
            await new Promise(r => setTimeout(r, 200));
            
            setProgress(15);
            await saveSettings();
            await new Promise(r => setTimeout(r, 200));
            
            setProgress(25);
            setCurrentStep(1);
            
            const response = await axios.post(`${API_URL}/superadmin/generate-schedule`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 300000
            });
            
            if (response.data.success) {
                setProgress(60);
                setCurrentStep(2);
                await new Promise(r => setTimeout(r, 300));
                
                setProgress(85);
                setCurrentStep(3);
                await new Promise(r => setTimeout(r, 200));
                
                setProgress(100);
                setCurrentStep(4);
                
                const endTime = performance.now();
                const generationTime = ((endTime - startTime) / 1000).toFixed(1);
                
                setGenerationStats({
                    classes: dbStats?.classes || 0,
                    teachers: dbStats?.teachers || 0,
                    rooms: dbStats?.rooms || 0,
                    subjects: dbStats?.subjects || 0,
                    conflicts: 0,
                    assignments: 100,
                    time: generationTime
                });
                
                setGenerationComplete(true);
            } else {
                throw new Error(response.data.message || 'Ошибка генерации');
            }
        } catch (error) {
            console.error('Generation error:', error);
            alert(error.response?.data?.message || 'Ошибка при генерации расписания');
            setIsGenerating(false);
        } finally {
            setIsGenerating(false);
        }
    }, [token, saveSettings, dbStats]);
    
    const handleSettingChange = useCallback((key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);
    
    const handleBreaksChange = useCallback((breaks) => {
        setSettings(prev => ({ ...prev, breaks }));
    }, []);
    
    const handleSecondShiftBreaksChange = useCallback((breaks) => {
        setSettings(prev => ({ ...prev, secondShiftBreaks: breaks }));
    }, []);
    
    const handleClassToggle = useCallback((className) => {
        setSettings(prev => ({
            ...prev,
            secondShiftClasses: prev.secondShiftClasses.includes(className)
                ? prev.secondShiftClasses.filter(c => c !== className)
                : [...prev.secondShiftClasses, className]
        }));
    }, []);
    
    const handleWorkDayToggle = useCallback((day) => {
        setSettings(prev => ({
            ...prev,
            workDays: prev.workDays.includes(day) ? prev.workDays.filter(d => d !== day) : [...prev.workDays, day]
        }));
    }, []);
    
    const handleBack = useCallback(() => navigate(-1), [navigate]);
    const handleViewSchedule = useCallback(() => navigate('/admin/schedule', { state: { generated: true } }), [navigate]);
    
    const progressSteps = [
        { name: 'Проверка данных', threshold: 20 },
        { name: 'Генерация', threshold: 50 },
        { name: 'Оптимизация', threshold: 75 },
        { name: 'Формирование', threshold: 90 },
        { name: 'Завершение', threshold: 100 }
    ];
    
    return (
        <div className="excel-gen-page">
            <ThemeToggle />
            <button className="excel-gen-back-btn" onClick={handleBack}><FaArrowLeft /><span>Назад</span></button>
            <Header />
            
            <main className="excel-gen-main-content">
                <div className="excel-gen-page-header">
                    <div className="excel-gen-page-title">
                        <h1><FaDatabase /> Генератор расписаний</h1>
                        <p>Настройте параметры и запустите генерацию на основе данных из базы</p>
                    </div>
                    <div className="excel-gen-page-actions">
                        <button className={`excel-gen-btn ${showSettings ? 'excel-gen-btn-primary' : 'excel-gen-btn-outline'}`} onClick={() => setShowSettings(!showSettings)}>
                            <FaCog /> {showSettings ? 'Скрыть настройки' : 'Настройки'}
                        </button>
                    </div>
                </div>

                {/* Статистика из БД */}
                <div className="excel-gen-stats-section">
                    <h3><FaDatabase /> Данные в системе</h3>
                    <div className="excel-gen-db-stats-grid">
                        <div className="excel-gen-db-stat-card">
                            <FaSchool className="stat-icon" />
                            <div className="stat-value">{loadingStats ? <FaSpinner className="spinner" /> : dbStats?.classes || 0}</div>
                            <div className="stat-label">Классов</div>
                        </div>
                        <div className="excel-gen-db-stat-card">
                            <FaChalkboardTeacher className="stat-icon" />
                            <div className="stat-value">{loadingStats ? <FaSpinner className="spinner" /> : dbStats?.teachers || 0}</div>
                            <div className="stat-label">Учителей</div>
                        </div>
                        <div className="excel-gen-db-stat-card">
                            <FaDoorOpen className="stat-icon" />
                            <div className="stat-value">{loadingStats ? <FaSpinner className="spinner" /> : dbStats?.rooms || 0}</div>
                            <div className="stat-label">Кабинетов</div>
                        </div>
                        <div className="excel-gen-db-stat-card">
                            <FaListAlt className="stat-icon" />
                            <div className="stat-value">{loadingStats ? <FaSpinner className="spinner" /> : dbStats?.subjects || 0}</div>
                            <div className="stat-label">Предметов</div>
                        </div>
                    </div>
                </div>

                {/* Настройки генерации */}
                {showSettings && (
                    <div className="excel-gen-settings-section">
                        <h3 className="excel-gen-settings-title"><FaCog /> Настройки генерации</h3>
                        
                        <div className="excel-gen-settings-grid">
                            <div className="excel-gen-settings-group">
                                <h4><FaClock /> Время уроков</h4>
                                <div className="excel-gen-settings-grid-3cols">
                                    <div className="excel-gen-setting-item">
                                        <label>Начало уроков</label>
                                        <input type="time" value={settings.startTime} onChange={(e) => handleSettingChange('startTime', e.target.value)} />
                                    </div>
                                    <div className="excel-gen-setting-item">
                                        <label>Длительность урока (мин)</label>
                                        <input type="number" min="30" max="90" step="5" value={settings.lessonDuration} onChange={(e) => handleSettingChange('lessonDuration', parseInt(e.target.value))} />
                                    </div>
                                    <div className="excel-gen-setting-item">
                                        <label>Макс. уроков в день</label>
                                        <input type="number" min="4" max="8" value={settings.maxLessonsPerDay} onChange={(e) => handleSettingChange('maxLessonsPerDay', parseInt(e.target.value))} />
                                    </div>
                                </div>
                            </div>

                            <div className="excel-gen-settings-group">
                                <h4><FaHourglassHalf /> Перемены</h4>
                                <BreaksConfig breaks={settings.breaks} shortBreakDuration={settings.shortBreakDuration} onBreaksChange={handleBreaksChange} onShortBreakChange={(val) => handleSettingChange('shortBreakDuration', val)} />
                            </div>

                            <div className="excel-gen-settings-group">
                                <h4><FaCalendarAlt /> Рабочие дни</h4>
                                <div className="excel-gen-days-grid">
                                    {DAYS_SHORT.map(day => (
                                        <div key={day} className="excel-gen-day-item">
                                            <input type="checkbox" id={`day-${day}`} checked={settings.workDays.includes(day)} onChange={() => handleWorkDayToggle(day)} />
                                            <label htmlFor={`day-${day}`}>{day}</label>
                                        </div>
                                    ))}
                                </div>
                                <div className="excel-gen-checkbox">
                                    <input type="checkbox" id="allow-empty" checked={settings.allowEmptyLessons} onChange={(e) => handleSettingChange('allowEmptyLessons', e.target.checked)} />
                                    <label htmlFor="allow-empty">Разрешить "окна" в расписании</label>
                                </div>
                            </div>

                            <div className="excel-gen-settings-group">
                                <h4><FaBell /> Вторая смена</h4>
                                <div className="excel-gen-checkbox">
                                    <input type="checkbox" id="second-shift" checked={settings.secondShift} onChange={(e) => handleSettingChange('secondShift', e.target.checked)} />
                                    <label htmlFor="second-shift">Включить вторую смену</label>
                                </div>
                                {settings.secondShift && (
                                    <>
                                        <div className="excel-gen-setting-item">
                                            <label>Начало второй смены</label>
                                            <input type="time" value={settings.secondShiftStart} onChange={(e) => handleSettingChange('secondShiftStart', e.target.value)} />
                                        </div>
                                        <BreaksConfig breaks={settings.secondShiftBreaks} shortBreakDuration={settings.secondShiftShortBreakDuration} onBreaksChange={handleSecondShiftBreaksChange} onShortBreakChange={(val) => handleSettingChange('secondShiftShortBreakDuration', val)} />
                                    </>
                                )}
                            </div>

                            <div className="excel-gen-settings-group">
                                <h4><FaChalkboardTeacher /> Оптимизация</h4>
                                <div className="excel-gen-checkbox">
                                    <input type="checkbox" id="balance-load" checked={settings.balanceLoad} onChange={(e) => handleSettingChange('balanceLoad', e.target.checked)} />
                                    <label htmlFor="balance-load">Равномерно распределять нагрузку между учителями</label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Прогресс генерации */}
                {isGenerating && (
                    <div className="excel-gen-progress-section">
                        <h3>Генерация расписания...</h3>
                        <div className="excel-gen-progress-container">
                            <div className="excel-gen-progress-bar"><div className="excel-gen-progress-fill" style={{ width: `${progress}%` }} /></div>
                            <div className="excel-gen-progress-text">{progress}%</div>
                        </div>
                        <div className="excel-gen-progress-steps">
                            {progressSteps.map((step, idx) => (
                                <div key={idx} className={`excel-gen-step ${progress >= step.threshold ? 'completed' : ''}`}>
                                    <span className="excel-gen-step-icon">{progress >= step.threshold ? <FaCheck /> : idx + 1}</span>
                                    <span className="excel-gen-step-text">{step.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Результаты генерации */}
                {generationComplete && (
                    <div className="excel-gen-results-section">
                        <div className="excel-gen-results-header">
                            <FaCheck className="excel-gen-success-icon" />
                            <h3>Генерация завершена!</h3>
                            <p>Расписание успешно создано</p>
                        </div>
                        
                        <div className="excel-gen-results-stats">
                            <div className="excel-gen-stat-item"><div className="excel-gen-stat-value">{generationStats.classes}</div><div className="excel-gen-stat-label">Классов</div></div>
                            <div className="excel-gen-stat-item"><div className="excel-gen-stat-value">{generationStats.conflicts}</div><div className="excel-gen-stat-label">Конфликтов</div></div>
                            <div className="excel-gen-stat-item"><div className="excel-gen-stat-value">{generationStats.assignments}%</div><div className="excel-gen-stat-label">Назначений</div></div>
                            <div className="excel-gen-stat-item"><div className="excel-gen-stat-value">{generationStats.time}с</div><div className="excel-gen-stat-label">Время</div></div>
                        </div>
                        
                        <div className="excel-gen-results-actions">
                            <button className="excel-gen-btn excel-gen-btn-primary" onClick={handleViewSchedule}><FaEye /> Просмотреть расписание</button>
                            <button className="excel-gen-btn excel-gen-btn-outline" onClick={() => window.location.reload()}><FaTrash /> Новое расписание</button>
                        </div>
                    </div>
                )}

                {/* Кнопка запуска генерации */}
                {!isGenerating && !generationComplete && (
                    <div className="excel-gen-generate-section">
                        <button 
                            className="excel-gen-btn excel-gen-btn-primary excel-gen-btn-large" 
                            onClick={handleGenerate} 
                            disabled={loadingStats || !dbStats?.classes || dbStats.classes === 0}
                        >
                            <FaPlay /> Запустить генерацию
                        </button>
                        {(!dbStats?.classes || dbStats.classes === 0) && (
                            <p className="excel-gen-generate-hint">
                                Сначала добавьте классы, учителей и предметы в соответствующих разделах
                            </p>
                        )}
                        {dbStats?.classes > 0 && (
                            <p className="excel-gen-generate-hint">
                                Будет сгенерировано расписание для {dbStats.classes} классов
                            </p>
                        )}
                    </div>
                )}
            </main>
            
            <Footer />
        </div>
    );
};

export default ExcelGenerator;