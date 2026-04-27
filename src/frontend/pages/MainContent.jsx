// MainContent.jsx - с интеграцией реального журнала событий и статистики
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaPlay, FaEdit, FaEye, FaInfoCircle, FaHistory, 
    FaSearch, FaFilter, FaCalendarAlt, FaChalkboardTeacher,
    FaUsers, FaBookOpen, FaSun, FaMoon, FaSync
} from 'react-icons/fa';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { activityAPI } from '../services/activityAPI';
import '../styles/MainContent.css';

const API_URL = 'http://localhost:5000/api';

// Получить заголовки с токеном
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

// Конфигурация карточек действий
const actionCardsConfig = {
    generate: {
        type: 'generate',
        title: 'Автогенерация',
        description: 'Загрузите Excel файл с данными и автоматически создайте расписание на учебный год',
        buttonText: 'Запустить генератор',
        icon: FaPlay,
        buttonClass: 'btn-primary',
        route: '/generate'
    },
    extracurricular: {
        type: 'extracurricular',
        title: 'Внешкольные занятия',
        description: 'Ручное добавление, редактирование и удаление кружков, секций и мероприятий',
        buttonText: 'Управлять занятиями',
        icon: FaEdit,
        buttonClass: 'btn-secondary',
        route: '/extracurricular'
    },
    view: {
        type: 'view',
        title: 'Просмотр расписаний',
        description: 'Просмотр, печать и редактирование готовых расписаний для всех классов',
        buttonText: 'Открыть список',
        icon: FaEye,
        buttonClass: 'btn-accent',
        route: '/admin/schedule'
    }
};

// Компонент карточки действия
const ActionCard = ({ config, onButtonClick }) => {
    const { type, title, description, buttonText, icon: Icon, buttonClass } = config;

    return (
        <div className={`card card-${type}`}>
            <h2>{title}</h2>
            <p>{description}</p>
            <div className="card-button-wrapper">
                <button className={`btn ${buttonClass}`} onClick={() => onButtonClick(type)}>
                    <Icon />
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

// Компонент колонки статуса (с реальными данными из БД)
const StatusColumn = () => {
    const [stats, setStats] = useState({
        totalClasses: 0,
        teachersCount: 0,
        scheduledLessons: 0,
        todayEvents: 0
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/activity/stats`, getAuthHeaders());
            setStats(response.data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error loading stats:', error);
            // Моковые данные на случай ошибки
            setStats({
                totalClasses: 12,
                teachersCount: 25,
                scheduledLessons: 98,
                todayEvents: 5
            });
        } finally {
            setLoading(false);
        }
    };

    const statusItems = [
        { 
            id: 1, 
            label: 'Статус генерации', 
            value: stats.scheduledLessons > 0 ? 'Расписание сгенерировано' : 'Расписание не сгенерировано', 
            type: stats.scheduledLessons > 0 ? 'success' : 'warning',
            details: stats.scheduledLessons > 0 ? `${stats.scheduledLessons} уроков в расписании` : 'Запустите генерацию расписания'
        },
        { 
            id: 2, 
            label: 'Активность сегодня', 
            value: `${stats.todayEvents} событий`, 
            type: 'info'
        },
        { 
            id: 3, 
            label: 'Всего классов', 
            value: stats.totalClasses, 
            type: 'info'
        },
        { 
            id: 4, 
            label: 'Учителей в системе', 
            value: stats.teachersCount, 
            type: 'info'
        }
    ];

    const statusTypes = {
        success: { indicatorClass: 'status-success', name: 'Успешно' },
        info: { indicatorClass: 'status-info', name: 'Информация' },
        warning: { indicatorClass: 'status-warning', name: 'Внимание' }
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="status-column">
                <h2 className="column-title">
                    <FaInfoCircle className="column-icon" />
                    Текущее состояние
                </h2>
                <div className="loading-state">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="status-column">
            <div className="status-header">
                <h2 className="column-title">
                    <FaInfoCircle className="column-icon" />
                    Текущее состояние
                </h2>
                <button className="refresh-status-btn" onClick={loadStats} title="Обновить">
                    <FaSync />
                </button>
            </div>
            <ul className="status-list">
                {statusItems.map((item) => {
                    const statusInfo = statusTypes[item.type] || statusTypes.info;
                    
                    return (
                        <li key={item.id} className="status-item">
                            <span 
                                className={`status-indicator ${statusInfo.indicatorClass}`}
                                title={statusInfo.name}
                            ></span>
                            <div className="status-content">
                                <span className="status-label">{item.label}:</span>
                                <strong className="status-value">{item.value}</strong>
                                {item.details && (
                                    <div className="status-details">{item.details}</div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
            
            <div className="status-stats">
                <div className="stat-item">
                    <FaChalkboardTeacher className="stat-icon" />
                    <span className="stat-label">Классы</span>
                    <span className="stat-value">{stats.totalClasses}</span>
                </div>
                <div className="stat-item">
                    <FaUsers className="stat-icon" />
                    <span className="stat-label">Учителя</span>
                    <span className="stat-value">{stats.teachersCount}</span>
                </div>
                <div className="stat-item">
                    <FaBookOpen className="stat-icon" />
                    <span className="stat-label">Занятия</span>
                    <span className="stat-value">{stats.scheduledLessons}</span>
                </div>
            </div>
        </div>
    );
};

// Компонент колонки активности (с реальными данными)
const ActivityColumn = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [activities, setActivities] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [eventTypes] = useState({
        generate: { name: 'Генерация', className: 'log-generate' },
        extracurricular: { name: 'Внешкольные', className: 'log-extracurricular' },
        view: { name: 'Просмотр', className: 'log-view' },
        edit: { name: 'Редактирование', className: 'log-edit' },
        delete: { name: 'Удаление', className: 'log-delete' },
        create: { name: 'Создание', className: 'log-create' },
        login: { name: 'Вход', className: 'log-login' },
        system: { name: 'Система', className: 'log-system' }
    });

    useEffect(() => {
        loadActivities();
    }, [filterType, searchQuery]);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const filters = { type: filterType, limit: 20 };
            const data = await activityAPI.getActivities(filters);
            setActivities(data.activities || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadActivities();
    };

    const formatTime = (time) => {
        const date = new Date(time);
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (time) => {
        const date = new Date(time);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return `Сегодня, ${formatTime(time)}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Вчера, ${formatTime(time)}`;
        }
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const getEventType = (type) => {
        return eventTypes[type] || eventTypes.system;
    };

    return (
        <div className="activity-column">
            <div className="activity-header">
                <h2 className="column-title">
                    <FaHistory className="column-icon" />
                    Журнал событий
                </h2>
                
                <div className="activity-controls">
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Поиск событий..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    
                    <div className="filter-dropdown">
                        <FaFilter className="filter-icon" />
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">Все события</option>
                            <option value="generate">Генерация</option>
                            <option value="extracurricular">Внешкольные</option>
                            <option value="view">Просмотр</option>
                            <option value="edit">Редактирование</option>
                            <option value="create">Создание</option>
                            <option value="delete">Удаление</option>
                            <option value="login">Вход в систему</option>
                        </select>
                    </div>
                    
                    <button 
                        className={`refresh-btn ${refreshing ? 'refreshing' : ''}`} 
                        onClick={handleRefresh} 
                        title="Обновить"
                    >
                        <FaSync />
                    </button>
                </div>
            </div>

            <div className="activity-log">
                {loading ? (
                    <div className="loading-activities">Загрузка...</div>
                ) : activities.length === 0 ? (
                    <div className="no-activities">События не найдены</div>
                ) : (
                    activities.map((activity) => {
                        const eventType = getEventType(activity.type);
                        
                        return (
                            <div key={activity.id} className={`log-entry ${eventType.className}`}>
                                <div className="log-header">
                                    <span className="log-time">
                                        {formatDate(activity.time)}
                                    </span>
                                    <span className="log-type-badge">
                                        {eventType.name}
                                    </span>
                                    <span className="log-user">
                                        {activity.user !== 'Система' ? `@${activity.user}` : 'Система'}
                                    </span>
                                </div>
                                <div className="log-text">{activity.text}</div>
                                {activity.details && (
                                    <div className="log-details">{activity.details}</div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            
            <div className="activity-footer">
                <span className="activity-count">
                    Показано {activities.length} из {total} событий
                </span>
            </div>
        </div>
    );
};

// Основной компонент MainContent
const MainContent = () => {
    const [currentDate, setCurrentDate] = useState('');
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        updateCurrentDate();
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDarkTheme(true);
            document.body.classList.add('dark-theme');
        } else {
            setIsDarkTheme(false);
            document.body.classList.remove('dark-theme');
        }
    }, []);

    const updateCurrentDate = () => {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = now.toLocaleDateString('ru-RU', options);
        setCurrentDate(dateString);
    };

    const toggleTheme = () => {
        const newTheme = !isDarkTheme;
        setIsDarkTheme(newTheme);
        
        if (newTheme) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleCardClick = (cardType) => {
        const route = actionCardsConfig[cardType]?.route || '/';
        navigate(route);
    };

    return (
        <div className={`main-content-page ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
            <div className="animated-bg">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>
            
            <Header />
            
            <main className="main-content-container">
                <div className="theme-toggle">
                    <button className="theme-btn" onClick={toggleTheme}>
                        {isDarkTheme ? <FaSun /> : <FaMoon />}
                        <span>{isDarkTheme ? 'Светлая тема' : 'Темная тема'}</span>
                    </button>
                </div>
                
                <section className="quick-actions">
                    <div className="page-header">
                        <div className="title-section">
                            <div className="current-date-display">
                                <FaCalendarAlt />
                                <span>{currentDate}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="action-cards">
                        {Object.values(actionCardsConfig).map((config) => (
                            <ActionCard
                                key={config.type}
                                config={config}
                                onButtonClick={handleCardClick}
                            />
                        ))}
                    </div>
                </section>

                <section className="dashboard-info">
                    <StatusColumn />
                    <ActivityColumn />
                </section>
            </main>
            
            <Footer />
        </div>
    );
};

export default MainContent;