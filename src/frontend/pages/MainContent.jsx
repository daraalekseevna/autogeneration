import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaEdit, FaEye, FaInfoCircle, FaHistory, FaSearch, FaFilter } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/MainContent.css';

// Импортируем конфигурации
import { statusConfig } from '../config/statusConfig';
import { activityConfig } from '../config/activityConfig';

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
        route: '/schedule'
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

// Компонент колонки статуса
const StatusColumn = () => {
    return (
        <div className="status-column">
            <h2 className="column-title">
                <FaInfoCircle className="column-icon" />
                Текущее состояние
            </h2>
            <ul className="status-list">
                {statusConfig.currentStatus.map((item) => {
                    const statusInfo = statusConfig.statusTypes[item.type] || statusConfig.statusTypes.info;
                    
                    return (
                        <li key={item.id} className="status-item">
                            <span 
                                className={`status-indicator ${statusInfo.indicatorClass}`}
                                title={statusInfo.name}
                                style={{ backgroundColor: statusInfo.color }}
                            ></span>
                            <div className="status-content">
                                <span className="status-label">{item.label}:</span>
                                <strong className="status-value">{item.value}</strong>
                                {item.details && (
                                    <div className="status-details">{item.details}</div>
                                )}
                                {item.timestamp && (
                                    <div className="status-timestamp">
                                        {statusConfig.formatDate(item.timestamp)}
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
            
            {/* Статистика */}
            <div className="status-stats">
                <div className="stat-item">
                    <span className="stat-label">Классы:</span>
                    <span className="stat-value">
                        {statusConfig.statistics.totalClasses}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Учителя:</span>
                    <span className="stat-value">
                        {statusConfig.statistics.teachersCount}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Занятия:</span>
                    <span className="stat-value">
                        {statusConfig.statistics.scheduledLessons}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Компонент колонки активности
const ActivityColumn = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    
    // Получаем отфильтрованные активности
    const getFilteredActivities = () => {
        let activities = activityConfig.activityLog;
        
        // Фильтруем по типу
        if (filterType !== 'all') {
            activities = activities.filter(item => item.type === filterType);
        }
        
        // Фильтруем по поиску
        if (searchQuery) {
            activities = activities.filter(item => 
                item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.user.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        return activities.slice(0, 5); // Ограничиваем 5 элементами
    };
    
    const filteredActivities = getFilteredActivities();

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
                            {Object.entries(activityConfig.eventTypes).map(([key, type]) => (
                                <option key={key} value={key}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="activity-log">
                {filteredActivities.map((activity) => {
                    const eventType = activityConfig.eventTypes[activity.type] || activityConfig.eventTypes.system;
                    
                    return (
                        <div key={activity.id} className={`log-entry ${eventType.className}`}>
                            <div className="log-header">
                                <span className="log-time">
                                    {activityConfig.formatTime(activity.time)}
                                </span>
                                <span className="log-type-badge">
                                    {eventType.name}
                                </span>
                                <span className="log-user">
                                    {activity.user !== 'system' ? `@${activity.user}` : 'Система'}
                                </span>
                            </div>
                            <div className="log-text">{activity.text}</div>
                        </div>
                    );
                })}
            </div>
            
            {filteredActivities.length === 0 && (
                <div className="no-activities">
                    События не найдены
                </div>
            )}
            
            <div className="activity-footer">
                <span className="activity-count">
                    Показано {filteredActivities.length} из {activityConfig.activityLog.length} событий
                </span>
            </div>
        </div>
    );
};

// Основной компонент MainContent
const MainContent = () => {
    const [currentDate, setCurrentDate] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        updateCurrentDate();
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

    const handleCardClick = (cardType) => {
        const route = actionCardsConfig[cardType]?.route || '/';
        navigate(route);
    };

    return (
        <div className="main-content-page">
            <div className="animated-bg">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>
            
            <Header />
            
            <main className="main-content-container">
                <section className="quick-actions">
                    <div className="page-header">
                        <div className="title-section">
                            <div className="current-date-display">
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