import React, { useState, useCallback, useEffect } from 'react'; 
import { 
    FaPlay, FaCheck, FaArrowLeft, FaTrash, FaEye, FaDatabase, FaSpinner,
    FaCog, FaClock, FaHourglassHalf, FaCalendarAlt, FaBell, FaPlus, FaTimes,
    FaChild, FaUsers, FaSchool, FaSun, FaMoon, FaSave, FaInfoCircle
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ExcelGenerator.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const MAX_LESSONS = 9;

const BreaksConfig = ({ breaks, shortBreakDuration, onBreaksChange, onShortBreakChange, disabled = false, title = "Перемены" }) => {
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
                <label>Короткая перемена (мин)</label>
                <input type="number" min="5" max="30" value={shortBreakDuration} onChange={(e) => onShortBreakChange(parseInt(e.target.value))} disabled={disabled} />
                <div className="excel-gen-setting-description">Ставится после всех уроков, где не указана большая перемена</div>
            </div>
            
            <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', display: 'block' }}>{title}</label>
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

const ExcelGenerator = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generationComplete, setGenerationComplete] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState(null);
    const [generationStats, setGenerationStats] = useState({ classes: 0, time: 0 });
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dbStats, setDbStats] = useState({ classes: 0 });
    
    // Загрузка настроек из БД
    useEffect(() => {
        const loadData = async () => {
            if (!token) return;
            setLoadingSettings(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                const settingsRes = await axios.get(`${API_URL}/admin/schedule-settings`, config);
                if (settingsRes.data) {
                    setSettings(settingsRes.data);
                }
                
                const classesRes = await axios.get(`${API_URL}/admin/classes`, config);
                setDbStats({ classes: classesRes.data?.length || 0 });
                
            } catch (error) {
                console.error('Error loading data:', error);
                setSettings({
                    startTime: '08:00',
                    lessonDuration: 40,
                    maxLessonsPerDay: 7,
                    shortBreakDuration: 10,
                    breaks: [],
                    workDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
                    saturdayLessons: false,
                    secondShift: false,
                    secondShiftStartLesson: 5,
                    secondShiftLessonDuration: 40,
                    secondShiftMaxLessonsPerDay: 5,
                    secondShiftShortBreakDuration: 10,
                    secondShiftBreaks: [],
                    firstGradeLessonDuration: 35,
                    firstGradeMaxLessonsPerDay: 4,
                    firstGradeShortBreakDuration: 15,
                    firstGradeBreaks: [],
                    allowEmptyLessons: false,
                    balanceLoad: true
                });
            } finally {
                setLoadingSettings(false);
            }
        };
        loadData();
    }, [token]);
    
    const saveSettings = useCallback(async () => {
        if (!token || !settings) return;
        setSaving(true);
        try {
            await axios.post(`${API_URL}/admin/schedule-settings`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Настройки сохранены');
            alert('Настройки сохранены');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Ошибка сохранения настроек: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    }, [settings, token]);
    
    // ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ ГЕНЕРАЦИИ - БЕЗ ТАЙМАУТА
    const handleGenerate = useCallback(async () => {
        if (!token) {
            alert('Требуется авторизация');
            return;
        }
        
        if (dbStats.classes === 0) {
            alert('Нет классов в системе. Сначала добавьте классы.');
            return;
        }
        
        setIsGenerating(true);
        setGenerationComplete(false);
        setProgress(0);
        
        const startTime = performance.now();
        
        try {
            await saveSettings();
            
            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 6, 95));
            }, 180);

            // ✅ УБРАЛ ТАЙМАУТ
            const response = await axios.post(`${API_URL}/admin/generate-schedule`, {}, {
                headers: { Authorization: `Bearer ${token}` }
                // timeout: 300000  // ← ЗАКОММЕНТИРОВАНО
            });

            clearInterval(interval);
            setProgress(100);

            if (response.data.success && response.data.schedule) {
                const endTime = performance.now();
                const generationTime = ((endTime - startTime) / 1000).toFixed(1);

                console.log("📊 Получено расписание:", Object.keys(response.data.schedule).length, "классов");

                localStorage.setItem('generatedSchedule', JSON.stringify(response.data.schedule));
                
                setGenerationStats({
                    classes: Object.keys(response.data.schedule).length,
                    time: generationTime
                });
                
                setGenerationComplete(true);
                
                setTimeout(() => {
                    navigate('/admin/schedule', { 
                        state: { 
                            generated: true, 
                            schedule: response.data.schedule 
                        } 
                    });
                }, 800);

            } else {
                throw new Error(response.data?.message || 'Не удалось получить расписание');
            }
        } catch (error) {
            console.error('Generation error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Ошибка при генерации расписания';
            alert(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    }, [token, saveSettings, navigate, dbStats.classes]);
    
    const handleSettingChange = useCallback((key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);
    
    const handleBreaksChange = useCallback((breaks) => {
        setSettings(prev => ({ ...prev, breaks }));
    }, []);
    
    const handleSecondShiftBreaksChange = useCallback((breaks) => {
        setSettings(prev => ({ ...prev, secondShiftBreaks: breaks }));
    }, []);
    
    const handleFirstGradeBreaksChange = useCallback((breaks) => {
        setSettings(prev => ({ ...prev, firstGradeBreaks: breaks }));
    }, []);
    
    const handleWorkDayToggle = useCallback((day) => {
        setSettings(prev => ({
            ...prev,
            workDays: prev.workDays?.includes(day) 
                ? prev.workDays.filter(d => d !== day) 
                : [...(prev.workDays || []), day]
        }));
    }, []);
    
    const handleBack = useCallback(() => navigate(-1), [navigate]);
    const handleViewSchedule = useCallback(() => navigate('/admin/schedule', { state: { generated: true } }), [navigate]);
    
    if (loadingSettings || !settings) {
        return (
            <div className="excel-gen-page">
                <button className="excel-gen-back-btn" onClick={handleBack}><FaArrowLeft /><span>Назад</span></button>
                <Header />
                <main className="excel-gen-main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', marginBottom: '16px' }} />
                        <p>Загрузка настроек...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }
    
    return (
        <div className="excel-gen-page">
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

                {showSettings && (
                    <div className="excel-gen-settings-section">
                        <h3 className="excel-gen-settings-title"><FaCog /> Настройки генерации</h3>
                        
                        <div className="excel-gen-settings-grid">
                            {/* 1 смена */}
                            <div className="excel-gen-settings-group">
                                <h4><FaSun style={{ marginRight: '8px' }} /> Первая смена</h4>
                                <div className="excel-gen-settings-grid-2cols">
                                    <div className="excel-gen-setting-item">
                                        <label>Начало уроков</label>
                                        <input type="time" value={settings.startTime || '08:00'} onChange={(e) => handleSettingChange('startTime', e.target.value)} />
                                    </div>
                                    <div className="excel-gen-setting-item">
                                        <label>Длительность урока (мин)</label>
                                        <input type="number" min="30" max="90" step="5" value={settings.lessonDuration || 40} onChange={(e) => handleSettingChange('lessonDuration', parseInt(e.target.value))} />
                                    </div>
                                    <div className="excel-gen-setting-item">
                                        <label>Макс. уроков в день</label>
                                        <input type="number" min="4" max="8" value={settings.maxLessonsPerDay || 7} onChange={(e) => handleSettingChange('maxLessonsPerDay', parseInt(e.target.value))} />
                                    </div>
                                </div>
                                <BreaksConfig 
                                    breaks={settings.breaks || []} 
                                    shortBreakDuration={settings.shortBreakDuration || 10} 
                                    onBreaksChange={handleBreaksChange} 
                                    onShortBreakChange={(val) => handleSettingChange('shortBreakDuration', val)} 
                                />
                            </div>

                            {/* 2 смена - ПО НОМЕРУ УРОКА */}
                            <div className="excel-gen-settings-group">
                                <h4><FaMoon style={{ marginRight: '8px' }} /> Вторая смена</h4>
                                <div className="excel-gen-checkbox">
                                    <input type="checkbox" id="second-shift" checked={settings.secondShift || false} onChange={(e) => handleSettingChange('secondShift', e.target.checked)} />
                                    <label htmlFor="second-shift">Включить вторую смену</label>
                                </div>
                                {settings.secondShift && (
                                    <>
                                        <div className="excel-gen-settings-grid-2cols">
                                            <div className="excel-gen-setting-item">
                                                <label>Начинается с урока №</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="6" 
                                                    value={settings.secondShiftStartLesson || 5} 
                                                    onChange={(e) => handleSettingChange('secondShiftStartLesson', parseInt(e.target.value))} 
                                                />
                                                <div className="excel-gen-setting-description">Например, если 5 — уроки будут с 5 по 9</div>
                                            </div>
                                            <div className="excel-gen-setting-item">
                                                <label>Длительность урока (мин)</label>
                                                <input type="number" min="30" max="90" step="5" value={settings.secondShiftLessonDuration || 40} onChange={(e) => handleSettingChange('secondShiftLessonDuration', parseInt(e.target.value))} />
                                            </div>
                                            <div className="excel-gen-setting-item">
                                                <label>Количество уроков</label>
                                                <input type="number" min="3" max="6" value={settings.secondShiftMaxLessonsPerDay || 5} onChange={(e) => handleSettingChange('secondShiftMaxLessonsPerDay', parseInt(e.target.value))} />
                                            </div>
                                        </div>
                                        <div className="excel-gen-info" style={{ marginBottom: '12px', padding: '8px', background: '#e0f2fe', borderRadius: '8px', fontSize: '0.75rem' }}>
                                            <FaInfoCircle style={{ marginRight: '6px' }} />
                                            Уроки второй смены будут отображаться с {settings.secondShiftStartLesson || 5}-го по {((settings.secondShiftStartLesson || 5) + (settings.secondShiftMaxLessonsPerDay || 5) - 1)}-й номер в таблице
                                        </div>
                                        <BreaksConfig 
                                            breaks={settings.secondShiftBreaks || []} 
                                            shortBreakDuration={settings.secondShiftShortBreakDuration || 10} 
                                            onBreaksChange={handleSecondShiftBreaksChange} 
                                            onShortBreakChange={(val) => handleSettingChange('secondShiftShortBreakDuration', val)} 
                                            title="Перемены (2 смена)"
                                        />
                                    </>
                                )}
                            </div>

                            {/* 1 класс (особые настройки) */}
                            <div className="excel-gen-settings-group">
                                <h4><FaChild style={{ marginRight: '8px' }} /> 1 класс (особые условия)</h4>
                                <div className="excel-gen-setting-item">
                                    <label>Длительность урока (мин)</label>
                                    <input type="number" min="30" max="40" step="5" value={settings.firstGradeLessonDuration || 35} onChange={(e) => handleSettingChange('firstGradeLessonDuration', parseInt(e.target.value))} />
                                </div>
                                <div className="excel-gen-setting-item">
                                    <label>Макс. уроков в день</label>
                                    <input type="number" min="3" max="5" value={settings.firstGradeMaxLessonsPerDay || 4} onChange={(e) => handleSettingChange('firstGradeMaxLessonsPerDay', parseInt(e.target.value))} />
                                </div>
                                <BreaksConfig 
                                    breaks={settings.firstGradeBreaks || []} 
                                    shortBreakDuration={settings.firstGradeShortBreakDuration || 15} 
                                    onBreaksChange={handleFirstGradeBreaksChange} 
                                    onShortBreakChange={(val) => handleSettingChange('firstGradeShortBreakDuration', val)} 
                                    title="Перемены (1 класс)"
                                />
                            </div>

                            {/* Рабочие дни */}
                            <div className="excel-gen-settings-group">
                                <h4><FaCalendarAlt style={{ marginRight: '8px' }} /> Рабочие дни</h4>
                                <div className="excel-gen-days-grid">
                                    {DAYS_SHORT.map(day => (
                                        <div key={day} className="excel-gen-day-item">
                                            <input type="checkbox" id={`day-${day}`} checked={(settings.workDays || []).includes(day)} onChange={() => handleWorkDayToggle(day)} />
                                            <label htmlFor={`day-${day}`}>{day}</label>
                                        </div>
                                    ))}
                                </div>
                                <div className="excel-gen-checkbox" style={{ marginTop: '12px' }}>
                                    <input type="checkbox" id="saturday" checked={settings.saturdayLessons || false} onChange={(e) => handleSettingChange('saturdayLessons', e.target.checked)} />
                                    <label htmlFor="saturday">Уроки в субботу</label>
                                </div>
                            </div>

                            {/* Оптимизация */}
                            <div className="excel-gen-settings-group">
                                <h4><FaBell style={{ marginRight: '8px' }} /> Оптимизация</h4>
                                <div className="excel-gen-checkbox">
                                    <input type="checkbox" id="allow-empty" checked={settings.allowEmptyLessons || false} onChange={(e) => handleSettingChange('allowEmptyLessons', e.target.checked)} />
                                    <label htmlFor="allow-empty">Разрешить "окна" в расписании учителей</label>
                                </div>
                                <div className="excel-gen-checkbox">
                                    <input type="checkbox" id="balance-load" checked={settings.balanceLoad !== false} onChange={(e) => handleSettingChange('balanceLoad', e.target.checked)} />
                                    <label htmlFor="balance-load">Равномерно распределять нагрузку между учителями</label>
                                </div>
                            </div>
                        </div>

                        <div className="excel-gen-settings-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="excel-gen-btn excel-gen-btn-primary" onClick={saveSettings} disabled={saving}>
                                <FaSave /> {saving ? 'Сохранение...' : 'Сохранить настройки'}
                            </button>
                        </div>
                    </div>
                )}

                {isGenerating && (
                    <div className="excel-gen-progress-section">
                        <h3>Генерация расписания...</h3>
                        <div className="excel-gen-progress-container">
                            <div className="excel-gen-progress-bar"><div className="excel-gen-progress-fill" style={{ width: `${progress}%` }} /></div>
                            <div className="excel-gen-progress-text">{progress}%</div>
                        </div>
                        <p style={{ textAlign: 'center', marginTop: '16px', color: '#64748b' }}>
                            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                            Это может занять до 1-2 минут...
                        </p>
                    </div>
                )}

                {generationComplete && (
                    <div className="excel-gen-results-section">
                        <div className="excel-gen-results-header">
                            <FaCheck className="excel-gen-success-icon" />
                            <h3>Генерация завершена!</h3>
                            <p>Расписание успешно создано</p>
                        </div>
                        <div className="excel-gen-results-stats">
                            <div className="excel-gen-stat-item"><div className="excel-gen-stat-value">{generationStats.classes}</div><div className="excel-gen-stat-label">Классов</div></div>
                            <div className="excel-gen-stat-item"><div className="excel-gen-stat-value">{generationStats.time}с</div><div className="excel-gen-stat-label">Время</div></div>
                        </div>
                        <div className="excel-gen-results-actions">
                            <button className="excel-gen-btn excel-gen-btn-primary" onClick={handleViewSchedule}><FaEye /> Просмотреть расписание</button>
                            <button className="excel-gen-btn excel-gen-btn-outline" onClick={() => window.location.reload()}><FaTrash /> Новое расписание</button>
                        </div>
                    </div>
                )}

                {!isGenerating && !generationComplete && (
                    <div className="excel-gen-generate-section">
                        <button 
                            className="excel-gen-btn excel-gen-btn-primary excel-gen-btn-large" 
                            onClick={handleGenerate} 
                            disabled={dbStats.classes === 0}
                        >
                            <FaPlay /> Запустить генерацию
                        </button>
                        {dbStats.classes === 0 && (
                            <p className="excel-gen-generate-hint">
                                Сначала добавьте классы в разделе "Классы" панели суперадмина
                            </p>
                        )}
                        {dbStats.classes > 0 && (
                            <p className="excel-gen-generate-hint">
                                Будет сгенерировано расписание для {dbStats.classes} классов<br/>
                                С учётом настроек времени, перемен и смен
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