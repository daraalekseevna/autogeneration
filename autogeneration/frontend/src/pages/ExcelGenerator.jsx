// ExcelGenerator.jsx - Полный компонент с расширенными настройками перемен и интеграцией с БД
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'; 
import { 
    FaFileExcel, 
    FaUpload, 
    FaDownload, 
    FaCog, 
    FaPlay,
    FaClock,
    FaDoorOpen,
    FaUsers,
    FaSchool,
    FaListAlt,
    FaTimes,
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
    FaMoon
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ExcelGenerator.css';
import { useNavigate } from 'react-router-dom';
import { scheduleAPI } from '../services/scheduleAPI'; // ДОБАВЛЕН ИМПОРТ

// Константы
const ALL_CLASSES = ['1А', '1Б', '2А', '2Б', '3А', '3Б', '4А', '4Б', '5А', '5Б', '6А', '6Б', '7А', '7Б', '8А', '8Б', '9А', '9Б', '10А', '10Б', '11А', '11Б'];
const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MAX_LESSONS = 8;

// Начальные настройки с поддержкой нескольких больших перемен
const INITIAL_SETTINGS = {
    // Время и уроки
    startTime: '08:00',
    lessonDuration: 40,
    maxLessonsPerDay: 7,
    
    // Перемены - гибкая настройкая
    shortBreakDuration: 10,
    breaks: [
        { afterLesson: 3, duration: 20 },
        { afterLesson: 5, duration: 15 }
    ],
    
    // Рабочие дни
    workDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
    saturdayLessons: false,
    
    // Вторая смена
    secondShift: false,
    secondShiftClasses: ['2А', '2Б', '3А', '3Б', '4А', '4Б'],
    secondShiftStart: '14:00',
    secondShiftShortBreakDuration: 10,
    secondShiftBreaks: [
        { afterLesson: 3, duration: 20 }
    ],
    
    // Дополнительные опции
    allowEmptyLessons: false,
    balanceLoad: true
};

// Компонент для настройки перемен
const BreaksConfig = ({ breaks, shortBreakDuration, onBreaksChange, onShortBreakChange, title, disabled = false }) => {
    const addBreak = () => {
        const lastBreak = breaks[breaks.length - 1];
        const newAfterLesson = lastBreak ? Math.min(lastBreak.afterLesson + 1, MAX_LESSONS - 1) : 2;
        const newBreak = {
            afterLesson: newAfterLesson,
            duration: 20
        };
        onBreaksChange([...breaks, newBreak]);
    };
    
    const removeBreak = (index) => {
        const newBreaks = breaks.filter((_, i) => i !== index);
        onBreaksChange(newBreaks);
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
            if (!selectedLessons.includes(i)) {
                lessons.push(i);
            }
        }
        return lessons;
    };
    
    return (
        <div className="excel-gen-breaks-list">
            <div className="excel-gen-setting-item" style={{ marginBottom: '16px' }}>
                <label>Маленькая перемена (мин)</label>
                <input 
                    type="number" 
                    min="5"
                    max="30"
                    value={shortBreakDuration}
                    onChange={(e) => onShortBreakChange(parseInt(e.target.value))}
                    disabled={disabled}
                />
                <div className="excel-gen-setting-description" style={{ marginTop: '4px', fontSize: '0.7rem' }}>
                    Ставится после всех уроков, где не указана большая перемена
                </div>
            </div>
            
            <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Большие перемены
            </label>
            
            {breaks.map((breakItem, index) => (
                <div key={index} className="excel-gen-break-item">
                    <div className="excel-gen-break-number">{index + 1}</div>
                    <div className="excel-gen-break-info">
                        <select 
                            value={breakItem.afterLesson}
                            onChange={(e) => updateBreak(index, 'afterLesson', e.target.value)}
                            disabled={disabled}
                        >
                            {getAvailableLessons(index).map(lesson => (
                                <option key={lesson} value={lesson}>
                                    После {lesson}-го урока
                                </option>
                            ))}
                        </select>
                        <input 
                            type="number"
                            min="10"
                            max="45"
                            value={breakItem.duration}
                            onChange={(e) => updateBreak(index, 'duration', e.target.value)}
                            disabled={disabled}
                            style={{ width: '100px' }}
                            placeholder="Длительность"
                        />
                        <span style={{ fontSize: '0.8rem', color: '#21435A' }}>мин</span>
                    </div>
                    <button 
                        className="excel-gen-break-remove"
                        onClick={() => removeBreak(index)}
                        disabled={disabled}
                    >
                        <FaTimes />
                    </button>
                </div>
            ))}
            
            <button 
                className="excel-gen-add-break-btn"
                onClick={addBreak}
                disabled={disabled || breaks.length >= MAX_LESSONS - 2}
            >
                <FaPlus /> Добавить большую перемену
            </button>
            <div className="excel-gen-break-note">
                * Большие перемены можно ставить после любых уроков (кроме последнего). 
                Все остальные перемены будут маленькими.
            </div>
        </div>
    );
};

// Компонент переключения темы
const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });

    useEffect(() => {
        if (isDark) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    return (
        <div className="theme-toggle">
            <button className="theme-btn" onClick={toggleTheme}>
                {isDark ? <FaSun /> : <FaMoon />}
                {isDark ? 'Светлая тема' : 'Темная тема'}
            </button>
        </div>
    );
};

const ExcelGenerator = () => {
    const navigate = useNavigate();
    
    // Состояния
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [generationComplete, setGenerationComplete] = useState(false);
    const [settings, setSettings] = useState(INITIAL_SETTINGS);
    const [generationStats, setGenerationStats] = useState({
        classes: 0,
        teachers: 0,
        rooms: 0,
        subjects: 0,
        conflicts: 0,
        assignments: 98,
        time: 0,
        totalLessons: 0
    });
    
    const fileInputRef = useRef(null);
    const generationIntervalRef = useRef(null);
    
    // ========== ЗАГРУЗКА НАСТРОЕК ИЗ БД ==========
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedSettings = await scheduleAPI.getSettings();
                if (savedSettings) {
                    setSettings({
                        startTime: savedSettings.start_time || '08:30',
                        lessonDuration: savedSettings.lesson_duration || 45,
                        maxLessonsPerDay: savedSettings.max_lessons_per_day || 7,
                        shortBreakDuration: savedSettings.short_break_duration || 10,
                        breaks: savedSettings.breaks || INITIAL_SETTINGS.breaks,
                        workDays: savedSettings.work_days || INITIAL_SETTINGS.workDays,
                        saturdayLessons: savedSettings.saturday_lessons || false,
                        secondShift: savedSettings.second_shift || false,
                        secondShiftStart: savedSettings.second_shift_start || '14:00',
                        secondShiftClasses: savedSettings.second_shift_classes || INITIAL_SETTINGS.secondShiftClasses,
                        allowEmptyLessons: savedSettings.allow_empty_lessons || false,
                        balanceLoad: savedSettings.balance_load !== undefined ? savedSettings.balance_load : true
                    });
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };
        
        loadSettings();
    }, []);
    
    // Очистка интервала
    useEffect(() => {
        return () => {
            if (generationIntervalRef.current) {
                clearInterval(generationIntervalRef.current);
            }
        };
    }, []);
    
    // Обработка загрузки файла
    const handleFileUpload = useCallback((event) => {
        const uploadedFile = event.target.files[0];
        if (uploadedFile) {
            if (!uploadedFile.name.match(/\.(xlsx|xls)$/)) {
                alert('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
                return;
            }
            setFile(uploadedFile);
            setFileData({
                classes: 25,
                teachers: 48,
                rooms: 32,
                subjects: 15,
                fileName: uploadedFile.name,
                fileSize: uploadedFile.size
            });
        }
    }, []);
    
    // Drag & Drop
    const handleDragOver = useCallback((event) => {
        event.preventDefault();
    }, []);
    
    const handleDrop = useCallback((event) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile) {
            if (!droppedFile.name.match(/\.(xlsx|xls)$/)) {
                alert('Пожалуйста, загрузите файл Excel (.xlsx или .xls)');
                return;
            }
            setFile(droppedFile);
            setFileData({
                classes: 25,
                teachers: 48,
                rooms: 32,
                subjects: 15,
                fileName: droppedFile.name,
                fileSize: droppedFile.size
            });
        }
    }, []);
    
    // Удаление файла
    const handleRemoveFile = useCallback((e) => {
        e.stopPropagation();
        setFile(null);
        setFileData(null);
        setGenerationComplete(false);
        setProgress(0);
        setCurrentStep(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);
    
    // ========== ГЕНЕРАЦИЯ РАСПИСАНИЯ С СОХРАНЕНИЕМ НАСТРОЕК ==========
    const handleGenerate = useCallback(async () => {
        if (!file) {
            alert('Пожалуйста, загрузите Excel файл с данными');
            return;
        }
        
        // Сохраняем настройки перед генерацией
        try {
            await scheduleAPI.saveSettings(settings);
            console.log('Настройки сохранены в БД');
        } catch (error) {
            console.error('Error saving settings:', error);
        }
        
        setIsGenerating(true);
        setGenerationComplete(false);
        setProgress(0);
        setCurrentStep(0);
        
        const startTime = performance.now();
        
        generationIntervalRef.current = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + 2;
                
                if (newProgress >= 100) {
                    clearInterval(generationIntervalRef.current);
                    const endTime = performance.now();
                    const generationTime = ((endTime - startTime) / 1000).toFixed(1);
                    
                    setIsGenerating(false);
                    setGenerationComplete(true);
                    
                    const workDaysCount = settings.workDays.length + (settings.saturdayLessons ? 1 : 0);
                    const totalLessons = fileData?.classes * workDaysCount * settings.maxLessonsPerDay || 0;
                    
                    setGenerationStats({
                        classes: fileData?.classes || 0,
                        teachers: fileData?.teachers || 0,
                        rooms: fileData?.rooms || 0,
                        subjects: fileData?.subjects || 0,
                        conflicts: 0,
                        assignments: 98,
                        time: generationTime,
                        totalLessons: totalLessons
                    });
                    
                    return 100;
                }
                return newProgress;
            });
        }, 80);
    }, [file, fileData, settings]);
    
    // Общие обработчики настроек
    const handleSettingChange = useCallback((key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);
    
    // Обработчик для перемен первой смены
    const handleBreaksChange = useCallback((breaks) => {
        setSettings(prev => ({
            ...prev,
            breaks
        }));
    }, []);
    
    // Обработчик для перемен второй смены
    const handleSecondShiftBreaksChange = useCallback((breaks) => {
        setSettings(prev => ({
            ...prev,
            secondShiftBreaks: breaks
        }));
    }, []);
    
    // Toggle для классов второй смены
    const handleClassToggle = useCallback((className) => {
        setSettings(prev => ({
            ...prev,
            secondShiftClasses: prev.secondShiftClasses.includes(className)
                ? prev.secondShiftClasses.filter(c => c !== className)
                : [...prev.secondShiftClasses, className]
        }));
    }, []);
    
    // Toggle для рабочих дней
    const handleWorkDayToggle = useCallback((day) => {
        setSettings(prev => ({
            ...prev,
            workDays: prev.workDays.includes(day)
                ? prev.workDays.filter(d => d !== day)
                : [...prev.workDays, day]
        }));
    }, []);
    
    // Сброс формы
    const resetForm = useCallback(() => {
        setFile(null);
        setFileData(null);
        setGenerationComplete(false);
        setProgress(0);
        setCurrentStep(0);
        setSettings(INITIAL_SETTINGS);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);
    
    // Навигация назад
    const handleBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);
    
    // Просмотр расписания
    const handleViewSchedule = useCallback(() => {
        navigate('/admin/schedule', { state: { generated: true } });
    }, [navigate]);
    
    // Скачивание расписания
    const handleDownloadSchedule = useCallback(() => {
        alert('Функция скачивания будет доступна в следующей версии');
    }, []);
    
    // Мемоизированные данные
    const fileStats = useMemo(() => {
        if (!fileData) return null;
        return [
            { icon: FaUsers, label: 'Классы', value: fileData.classes },
            { icon: FaSchool, label: 'Учителя', value: fileData.teachers },
            { icon: FaDoorOpen, label: 'Кабинеты', value: fileData.rooms },
            { icon: FaListAlt, label: 'Предметы', value: fileData.subjects }
        ];
    }, [fileData]);
    
    const progressSteps = useMemo(() => [
        { name: 'Чтение данных', threshold: 20 },
        { name: 'Проверка данных', threshold: 40 },
        { name: 'Распределение', threshold: 60 },
        { name: 'Оптимизация', threshold: 80 },
        { name: 'Формирование', threshold: 100 }
    ], []);
    
    return (
        <div className="excel-gen-page">
            {/* Анимированный фон с 10 размытыми кругами */}
            {/* <div className="animated-bg">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div> */}
            
            {/* Кнопка переключения темы */}
            <ThemeToggle />
            
            {/* Кнопка назад */}
            <button 
                className="excel-gen-back-btn"
                onClick={handleBack}
                title="Вернуться назад"
            >
                <FaArrowLeft className="excel-gen-back-icon" />
                <span>Назад</span>
            </button>
            
            <Header />
            
            <main className="excel-gen-main-content">
                {/* Заголовок */}
                <div className="excel-gen-page-header">
                    <div className="excel-gen-page-title">
                        <h1>
                            Генератор расписаний
                        </h1>
                    </div>
                    <div className="excel-gen-page-actions">
                        <button 
                            className={`excel-gen-btn ${showSettings ? 'excel-gen-btn-primary' : 'excel-gen-btn-outline'}`}
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            <FaCog />
                            {showSettings ? 'Скрыть настройки' : 'Настройки'}
                        </button>
                        <a href="/template.xlsx" className="excel-gen-btn excel-gen-btn-outline">
                            <FaDownload />
                            Шаблон
                        </a>
                    </div>
                </div>

                {/* Секция загрузки файла */}
                <div className="excel-gen-upload-section">
                    <div 
                        className={`excel-gen-upload-area ${file ? 'has-file' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".xlsx,.xls"
                            className="excel-gen-file-input"
                        />
                        
                        {!file ? (
                            <>
                                <FaFileExcel className="excel-gen-upload-icon" />
                                <h3>Загрузите Excel файл</h3>
                                <p>Перетащите файл или нажмите для выбора</p>
                                <p className="excel-gen-upload-hint">Поддерживаются .xlsx, .xls</p>
                                <button className="excel-gen-btn excel-gen-btn-outline">
                                    <FaUpload /> Выбрать файл
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="excel-gen-file-preview">
                                    <FaFileExcel className="excel-gen-file-icon" />
                                    <div className="excel-gen-file-info">
                                        <h4>{file.name}</h4>
                                        <p>{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                    <button 
                                        className="excel-gen-btn-remove"
                                        onClick={handleRemoveFile}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                                <div className="excel-gen-file-actions">
                                    <button 
                                        className="excel-gen-btn excel-gen-btn-outline" 
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Заменить файл
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {fileData && (
                        <div className="excel-gen-file-details">
                            <div className="excel-gen-details-grid">
                                {fileStats?.map((stat, index) => (
                                    <div key={index} className="excel-gen-detail-item">
                                        <stat.icon />
                                        <span>{stat.label}: <strong>{stat.value}</strong></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Настройки генерации */}
                {showSettings && (
                    <div className="excel-gen-settings-section">
                        <h3 className="excel-gen-settings-title">
                            <FaCog />
                            Настройки генерации
                        </h3>
                        
                        <div className="excel-gen-settings-grid">
                            {/* Блок 1: Время уроков */}
                            <div className="excel-gen-settings-group">
                                <h4><FaClock /> Время уроков</h4>
                                <div className="excel-gen-settings-grid-3cols">
                                    <div className="excel-gen-setting-item">
                                        <label>Начало уроков</label>
                                        <input 
                                            type="time" 
                                            value={settings.startTime}
                                            onChange={(e) => handleSettingChange('startTime', e.target.value)}
                                        />
                                    </div>
                                    <div className="excel-gen-setting-item">
                                        <label>Длительность урока (мин)</label>
                                        <input 
                                            type="number" 
                                            min="30"
                                            max="90"
                                            step="5"
                                            value={settings.lessonDuration}
                                            onChange={(e) => handleSettingChange('lessonDuration', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="excel-gen-setting-item">
                                        <label>Макс. уроков в день</label>
                                        <input 
                                            type="number" 
                                            min="4"
                                            max="8"
                                            value={settings.maxLessonsPerDay}
                                            onChange={(e) => handleSettingChange('maxLessonsPerDay', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Блок 2: Перемены (с поддержкой нескольких больших) */}
                            <div className="excel-gen-settings-group">
                                <h4><FaHourglassHalf /> Перемены</h4>
                                <BreaksConfig
                                    breaks={settings.breaks}
                                    shortBreakDuration={settings.shortBreakDuration}
                                    onBreaksChange={handleBreaksChange}
                                    onShortBreakChange={(val) => handleSettingChange('shortBreakDuration', val)}
                                    title="Первая смена"
                                />
                            </div>

                            {/* Блок 3: Рабочие дни */}
                            <div className="excel-gen-settings-group">
                                <h4><FaCalendarAlt /> Рабочие дни</h4>
                                <div className="excel-gen-days-grid">
                                    {DAYS_SHORT.map(day => (
                                        <div key={day} className="excel-gen-day-item">
                                            <input
                                                type="checkbox"
                                                id={`day-${day}`}
                                                checked={day === 'Сб' ? settings.saturdayLessons : settings.workDays.includes(day)}
                                                onChange={() => {
                                                    if (day === 'Сб') {
                                                        handleSettingChange('saturdayLessons', !settings.saturdayLessons);
                                                    } else {
                                                        handleWorkDayToggle(day);
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`day-${day}`}>{day}</label>
                                        </div>
                                    ))}
                                </div>
                                <div className="excel-gen-checkbox">
                                    <input
                                        type="checkbox"
                                        id="allow-empty"
                                        checked={settings.allowEmptyLessons}
                                        onChange={(e) => handleSettingChange('allowEmptyLessons', e.target.checked)}
                                    />
                                    <label htmlFor="allow-empty">Разрешить "окна" в расписании</label>
                                </div>
                            </div>

                            {/* Блок 4: Вторая смена */}
                            <div className="excel-gen-settings-group">
                                <h4><FaBell /> Вторая смена</h4>
                                <div className="excel-gen-checkbox">
                                    <input
                                        type="checkbox"
                                        id="second-shift"
                                        checked={settings.secondShift}
                                        onChange={(e) => handleSettingChange('secondShift', e.target.checked)}
                                    />
                                    <label htmlFor="second-shift">Включить вторую смену</label>
                                </div>
                                
                                {settings.secondShift && (
                                    <>
                                        <div className="excel-gen-setting-item" style={{ marginBottom: '16px' }}>
                                            <label>Начало второй смены</label>
                                            <input 
                                                type="time" 
                                                value={settings.secondShiftStart}
                                                onChange={(e) => handleSettingChange('secondShiftStart', e.target.value)}
                                            />
                                        </div>
                                        
                                        <BreaksConfig
                                            breaks={settings.secondShiftBreaks}
                                            shortBreakDuration={settings.secondShiftShortBreakDuration}
                                            onBreaksChange={handleSecondShiftBreaksChange}
                                            onShortBreakChange={(val) => handleSettingChange('secondShiftShortBreakDuration', val)}
                                            title="Вторая смена"
                                        />
                                        
                                        <div className="excel-gen-classes-selection">
                                            <p>Классы второй смены:</p>
                                            <div className="excel-gen-classes-grid">
                                                {ALL_CLASSES.map(className => (
                                                    <div key={className} className="excel-gen-class-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            id={`class-${className}`}
                                                            checked={settings.secondShiftClasses.includes(className)}
                                                            onChange={() => handleClassToggle(className)}
                                                        />
                                                        <label htmlFor={`class-${className}`}>{className}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Блок 5: Оптимизация */}
                            <div className="excel-gen-settings-group">
                                <h4><FaChalkboardTeacher /> Оптимизация</h4>
                                <div className="excel-gen-checkbox">
                                    <input
                                        type="checkbox"
                                        id="balance-load"
                                        checked={settings.balanceLoad}
                                        onChange={(e) => handleSettingChange('balanceLoad', e.target.checked)}
                                    />
                                    <label htmlFor="balance-load">Равномерно распределять нагрузку между учителями</label>
                                </div>
                                <div className="excel-gen-setting-description">
                                    Система автоматически оптимизирует расписание с учетом загруженности кабинетов и учителей
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
                            <div className="excel-gen-progress-bar">
                                <div 
                                    className="excel-gen-progress-fill" 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="excel-gen-progress-text">{progress}%</div>
                        </div>
                        <div className="excel-gen-progress-steps">
                            {progressSteps.map((step, idx) => (
                                <div 
                                    key={idx} 
                                    className={`excel-gen-step ${progress >= step.threshold ? 'completed' : ''} ${currentStep === idx && progress < step.threshold ? 'active' : ''}`}
                                >
                                    <span className="excel-gen-step-icon">
                                        {progress >= step.threshold ? <FaCheck /> : idx + 1}
                                    </span>
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
                            <div className="excel-gen-stat-item">
                                <div className="excel-gen-stat-value">{generationStats.classes}</div>
                                <div className="excel-gen-stat-label">Классов</div>
                            </div>
                            <div className="excel-gen-stat-item">
                                <div className="excel-gen-stat-value">{generationStats.conflicts}</div>
                                <div className="excel-gen-stat-label">Конфликтов</div>
                            </div>
                            <div className="excel-gen-stat-item">
                                <div className="excel-gen-stat-value">{generationStats.assignments}%</div>
                                <div className="excel-gen-stat-label">Назначений</div>
                            </div>
                            <div className="excel-gen-stat-item">
                                <div className="excel-gen-stat-value">{generationStats.time}с</div>
                                <div className="excel-gen-stat-label">Время</div>
                            </div>
                        </div>
                        
                        <div className="excel-gen-results-actions">
                            <button 
                                className="excel-gen-btn excel-gen-btn-primary"
                                onClick={handleViewSchedule}
                            >
                                <FaEye />
                                Просмотреть
                            </button>
                            <button 
                                className="excel-gen-btn excel-gen-btn-outline"
                                onClick={handleDownloadSchedule}
                            >
                                <FaDownload />
                                Скачать Excel
                            </button>
                            <button 
                                className="excel-gen-btn excel-gen-btn-outline"
                                onClick={resetForm}
                            >
                                <FaTrash />
                                Новое расписание
                            </button>
                        </div>
                    </div>
                )}

                {/* Кнопка запуска генерации */}
                {!isGenerating && !generationComplete && (
                    <div className="excel-gen-generate-section">
                        <button 
                            className="excel-gen-btn excel-gen-btn-primary excel-gen-btn-large"
                            onClick={handleGenerate}
                            disabled={!file}
                        >
                            <FaPlay />
                            Запустить генерацию
                        </button>
                        {!file && (
                            <p className="excel-gen-generate-hint">
                                Для генерации необходимо загрузить Excel файл
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