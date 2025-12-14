import React, { useState, useRef, useEffect } from 'react'; 
import { 
    FaCalendarAlt, 
    FaFileExcel, 
    FaUpload, 
    FaDownload, 
    FaCog, 
    FaPlay,
    FaClock,
    FaDoorOpen,
    FaUsers,
    FaSchool,
    FaBell,
    FaListAlt,
    FaTimes,
    FaCheck
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ExcelGenerator.css';

const ExcelGenerator = () => {
    const [file, setFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [generationComplete, setGenerationComplete] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const [settings, setSettings] = useState({
        startTime: '08:30',
        lessonDuration: 45,
        breakDuration: 10,
        longBreakDuration: 20,
        longBreakAfter: 3,
        secondShift: false,
        secondShiftClasses: ['2А', '2Б', '3А', '3Б', '4А', '4Б'],
        secondShiftStart: '14:00',
        maxLessonsPerDay: 7,
        workDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
        saturdayLessons: false,
        allowEmptyLessons: false,
        prioritySubjects: ['Математика', 'Русский язык']
    });

    const handleFileUpload = (event) => {
        const uploadedFile = event.target.files[0];
        if (uploadedFile) {
            if (!uploadedFile.name.match(/\.(xlsx|xls)$/)) {
                alert('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
                return;
            }
            setFile(uploadedFile);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile) {
            if (!droppedFile.name.match(/\.(xlsx|xls)$/)) {
                alert('Пожалуйста, загрузите файл Excel (.xlsx или .xls)');
                return;
            }
            setFile(droppedFile);
        }
    };

    const handleGenerate = () => {
        if (!file) {
            alert('Пожалуйста, загрузите файл Excel');
            return;
        }

        setIsGenerating(true);
        setProgress(0);
        
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsGenerating(false);
                    setGenerationComplete(true);
                    return 100;
                }
                return prev + 2;
            });
        }, 100);
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleClassToggle = (className) => {
        const newClasses = settings.secondShiftClasses.includes(className)
            ? settings.secondShiftClasses.filter(c => c !== className)
            : [...settings.secondShiftClasses, className];
        
        handleSettingChange('secondShiftClasses', newClasses);
    };

    const handleWorkDayToggle = (day) => {
        const newDays = settings.workDays.includes(day)
            ? settings.workDays.filter(d => d !== day)
            : [...settings.workDays, day];
        
        handleSettingChange('workDays', newDays);
    };

    const handlePrioritySubjectToggle = (subject) => {
        const newSubjects = settings.prioritySubjects.includes(subject)
            ? settings.prioritySubjects.filter(s => s !== subject)
            : [...settings.prioritySubjects, subject];
        
        handleSettingChange('prioritySubjects', newSubjects);
    };

    const resetForm = () => {
        setFile(null);
        setGenerationComplete(false);
        setProgress(0);
    };

    const allClasses = ['1А', '1Б', '2А', '2Б', '3А', '3Б', '4А', '4Б', '5А', '5Б', '6А', '6Б', '7А', '7Б', '8А', '8Б', '9А', '9Б', '10А', '10Б', '11А', '11Б'];
    const allSubjects = ['Математика', 'Русский язык', 'Английский язык', 'Литература', 'История', 'Биология', 'Химия', 'Физика', 'География', 'Физкультура', 'Информатика', 'Музыка', 'ИЗО', 'Технология'];

    return (
        <div className={`excel-gen-page ${isLoaded ? 'loaded' : ''}`}>
            <div className="excel-gen-bg">
                <div className="excel-gen-glass-circle"></div>
                <div className="excel-gen-glass-circle"></div>
                <div className="excel-gen-glass-circle"></div>
                <div className="excel-gen-glass-circle"></div>
                <div className="excel-gen-glass-circle"></div>
                <div className="excel-gen-glass-circle"></div>
                <div className="excel-gen-glass-circle"></div>
                <div className="excel-gen-glass-circle"></div>
                <div className="excel-gen-glass-circle"></div>
                <div className="excel-gen-glass-circle"></div>
            </div>
            <Header />
            <main className="excel-gen-main-content">
                <div className="excel-gen-page-header">
                    <div className="excel-gen-page-actions">
                        <button 
                            className={`excel-gen-btn ${showSettings ? 'excel-gen-btn-secondary' : 'excel-gen-btn-outline'}`}
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            <FaCog />
                            {showSettings ? 'Скрыть настройки' : 'Настройки'}
                        </button>
                        
                        <a href="/template.xlsx" className="excel-gen-btn excel-gen-btn-outline">
                            <FaDownload />
                            Скачать шаблон
                        </a>
                    </div>
                </div>

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
                                <h3>Загрузите Excel файл с данными</h3>
                                <p>Перетащите файл сюда или нажмите для выбора</p>
                                <p className="excel-gen-upload-hint">
                                    <small>Поддерживаемые форматы: .xlsx, .xls</small>
                                </p>
                                <button className="excel-gen-btn excel-gen-btn-outline excel-gen-upload-btn">
                                    <FaUpload />
                                    Выбрать файл
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                                <div className="excel-gen-file-actions">
                                    <button className="excel-gen-btn excel-gen-btn-outline" onClick={() => fileInputRef.current?.click()}>
                                        Заменить файл
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {file && (
                        <div className="excel-gen-file-details">
                            <div className="excel-gen-details-grid">
                                <div className="excel-gen-detail-item">
                                    <FaUsers />
                                    <span>Классы: <strong>25</strong></span>
                                </div>
                                <div className="excel-gen-detail-item">
                                    <FaSchool />
                                    <span>Учителя: <strong>48</strong></span>
                                </div>
                                <div className="excel-gen-detail-item">
                                    <FaDoorOpen />
                                    <span>Кабинеты: <strong>32</strong></span>
                                </div>
                                <div className="excel-gen-detail-item">
                                    <FaListAlt />
                                    <span>Предметы: <strong>15</strong></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {showSettings && (
                    <div className="excel-gen-settings-section">
                        <h3 className="excel-gen-settings-title">
                            <FaCog />
                            Настройки генерации
                        </h3>
                        
                        <div className="excel-gen-settings-grid">
                            <div className="excel-gen-settings-group">
                                <h4><FaClock /> Расписание уроков</h4>
                                <div className="excel-gen-settings-row">
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
                                            value={settings.lessonDuration}
                                            onChange={(e) => handleSettingChange('lessonDuration', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                                
                                <div className="excel-gen-settings-row">
                                    <div className="excel-gen-setting-item">
                                        <label>Обычная перемена (мин)</label>
                                        <input 
                                            type="number" 
                                            min="5"
                                            max="30"
                                            value={settings.breakDuration}
                                            onChange={(e) => handleSettingChange('breakDuration', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="excel-gen-setting-item">
                                        <label>Большая перемена (мин)</label>
                                        <input 
                                            type="number" 
                                            min="10"
                                            max="45"
                                            value={settings.longBreakDuration}
                                            onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="excel-gen-setting-item">
                                        <label>Большая перемена после урока</label>
                                        <select 
                                            value={settings.longBreakAfter}
                                            onChange={(e) => handleSettingChange('longBreakAfter', parseInt(e.target.value))}
                                        >
                                            {[2, 3, 4, 5].map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="excel-gen-settings-group">
                                <h4><FaCalendarAlt /> Рабочие дни</h4>
                                <div className="excel-gen-days-grid">
                                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
                                        <div key={day} className="excel-gen-day-item">
                                            <input
                                                type="checkbox"
                                                id={`day-${day}`}
                                                checked={settings.workDays.includes(day) || (day === 'Сб' && settings.saturdayLessons)}
                                                onChange={() => {
                                                    if (day === 'Сб') {
                                                        handleSettingChange('saturdayLessons', !settings.saturdayLessons);
                                                    } else {
                                                        handleWorkDayToggle(day);
                                                    }
                                                }}
                                                disabled={day === 'Сб' ? false : undefined}
                                            />
                                            <label htmlFor={`day-${day}`}>{day}</label>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="excel-gen-setting-checkbox">
                                    <input
                                        type="checkbox"
                                        id="allow-empty"
                                        checked={settings.allowEmptyLessons}
                                        onChange={(e) => handleSettingChange('allowEmptyLessons', e.target.checked)}
                                    />
                                    <label htmlFor="allow-empty">Разрешить "окна" в расписании учителей</label>
                                </div>
                            </div>

                            <div className="excel-gen-settings-group">
                                <h4><FaBell /> Вторая смена</h4>
                                <div className="excel-gen-setting-checkbox">
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
                                        <div className="excel-gen-setting-item">
                                            <label>Начало второй смены</label>
                                            <input 
                                                type="time" 
                                                value={settings.secondShiftStart}
                                                onChange={(e) => handleSettingChange('secondShiftStart', e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className="excel-gen-classes-selection">
                                            <p>Классы второй смены:</p>
                                            <div className="excel-gen-classes-grid">
                                                {allClasses.map(className => (
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

                            <div className="excel-gen-settings-group">
                                <h4><FaListAlt /> Приоритетные предметы</h4>
                                <p className="excel-gen-setting-description">
                                    Эти предметы будут ставиться на первые уроки
                                </p>
                                <div className="excel-gen-subjects-grid">
                                    {allSubjects.map(subject => (
                                        <div key={subject} className="excel-gen-subject-checkbox">
                                            <input
                                                type="checkbox"
                                                id={`subject-${subject}`}
                                                checked={settings.prioritySubjects.includes(subject)}
                                                onChange={() => handlePrioritySubjectToggle(subject)}
                                            />
                                            <label htmlFor={`subject-${subject}`}>{subject}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isGenerating && (
                    <div className="excel-gen-progress-section">
                        <h3>Идет генерация расписания...</h3>
                        <div className="excel-gen-progress-container">
                            <div className="excel-gen-progress-bar">
                                <div 
                                    className="excel-gen-progress-fill" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="excel-gen-progress-text">{progress}%</div>
                        </div>
                        <div className="excel-gen-progress-steps">
                            <div className={`excel-gen-step ${progress > 20 ? 'completed' : ''}`}>
                                <span className="excel-gen-step-icon">
                                    {progress > 20 ? <FaCheck /> : '1'}
                                </span>
                                <span className="excel-gen-step-text">Чтение данных</span>
                            </div>
                            <div className={`excel-gen-step ${progress > 40 ? 'completed' : ''}`}>
                                <span className="excel-gen-step-icon">
                                    {progress > 40 ? <FaCheck /> : '2'}
                                </span>
                                <span className="excel-gen-step-text">Проверка данных</span>
                            </div>
                            <div className={`excel-gen-step ${progress > 60 ? 'completed' : ''}`}>
                                <span className="excel-gen-step-icon">
                                    {progress > 60 ? <FaCheck /> : '3'}
                                </span>
                                <span className="excel-gen-step-text">Распределение</span>
                            </div>
                            <div className={`excel-gen-step ${progress > 80 ? 'completed' : ''}`}>
                                <span className="excel-gen-step-icon">
                                    {progress > 80 ? <FaCheck /> : '4'}
                                </span>
                                <span className="excel-gen-step-text">Формирование</span>
                            </div>
                            <div className={`excel-gen-step ${progress === 100 ? 'completed' : ''}`}>
                                <span className="excel-gen-step-icon">
                                    {progress === 100 ? <FaCheck /> : '5'}
                                </span>
                                <span className="excel-gen-step-text">Завершение</span>
                            </div>
                        </div>
                    </div>
                )}

                {generationComplete && (
                    <div className="excel-gen-results-section">
                        <div className="excel-gen-results-header">
                            <FaCheck className="excel-gen-success-icon" />
                            <h3>Генерация завершена!</h3>
                            <p>Расписание успешно создано для всех классов</p>
                        </div>
                        
                        <div className="excel-gen-results-stats">
                            <div className="excel-gen-stat-item">
                                <div className="excel-gen-stat-value">25</div>
                                <div className="excel-gen-stat-label">Классов</div>
                            </div>
                            <div className="excel-gen-stat-item">
                                <div className="excel-gen-stat-value">0</div>
                                <div className="excel-gen-stat-label">Конфликтов</div>
                            </div>
                            <div className="excel-gen-stat-item">
                                <div className="excel-gen-stat-value">98%</div>
                                <div className="excel-gen-stat-label">Назначений</div>
                            </div>
                            <div className="excel-gen-stat-item">
                                <div className="excel-gen-stat-value">4.2с</div>
                                <div className="excel-gen-stat-label">Время</div>
                            </div>
                        </div>
                        
                        <div className="excel-gen-results-actions">
                            <button className="excel-gen-btn excel-gen-btn-primary">
                                <FaListAlt />
                                Просмотреть расписания
                            </button>
                            <button className="excel-gen-btn excel-gen-btn-secondary">
                                <FaDownload />
                                Скачать в Excel
                            </button>
                            <button className="excel-gen-btn excel-gen-btn-outline" onClick={resetForm}>
                                Создать новое
                            </button>
                        </div>
                    </div>
                )}

                {!isGenerating && !generationComplete && (
                    <div className="excel-gen-generate-section">
                        <button 
                            className="excel-gen-btn excel-gen-btn-primary excel-gen-btn-large"
                            onClick={handleGenerate}
                            disabled={!file}
                        >
                            <FaPlay />
                            Запустить генерацию расписания
                        </button>
                      
                    </div>
                )}
            </main>
            
            <Footer />
        </div>
    );
};

export default ExcelGenerator;