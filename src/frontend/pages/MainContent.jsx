// MainContent.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaEdit, FaEye, FaInfoCircle, FaHistory } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/MainContent.css';

const ActionCard = ({ type, title, description, buttonText, onButtonClick }) => {
    const cardClass = `card card-${type}`;
    const btnClass = `btn ${type === 'generate' ? 'btn-primary' : type === 'extracurricular' ? 'btn-secondary' : 'btn-accent'}`;

    const getButtonIcon = () => {
        switch(type) {
            case 'generate': return <FaPlay />;
            case 'extracurricular': return <FaEdit />;
            case 'view': return <FaEye />;
            default: return <FaPlay />;
        }
    };

    return (
        <div className={cardClass}>
            <h2>{title}</h2>
            <p>{description}</p>
            <div className="card-button-wrapper">
                <button className={btnClass} onClick={onButtonClick}>
                    {getButtonIcon()}
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

const StatusColumn = () => {
    return (
        <div className="status-column">
            <h2 className="column-title">
                <FaInfoCircle className="column-icon" />
                Текущее состояние
            </h2>
            <ul className="status-list">
                <li>
                    <span className="status-indicator status-ok"></span>
                    Расписание на 2023/24 учебный год: <strong>Сгенерировано</strong>
                </li>
                <li>
                    <span className="status-indicator status-info"></span>
                    Внешкольные занятия: <strong>Добавлено 5 мероприятий</strong>
                </li>
                <li>
                    <span className="status-indicator status-ok"></span>
                    Последняя генерация: <strong>25.10.2023, 14:30</strong>
                </li>
                <li>
                    <span className="status-indicator status-warning"></span>
                    Следующее обновление: <strong>—</strong>
                </li>
            </ul>
        </div>
    );
};

const ActivityColumn = () => {
    const activities = [
        { time: '[25.10.23 14:30]', text: 'Расписание для 5"А" класса было отредактировано вручную.' },
        { time: '[25.10.23 14:25]', text: 'Запущена автоматическая генерация расписаний.' },
        { time: '[24.10.23 16:15]', text: 'Добавлено внешкольное занятие "Шахматный клуб (Пн, Ср 15:00)".' },
        { time: '[24.10.23 10:00]', text: 'В систему загружен новый список учителей.' },
        { time: '[23.10.23 09:30]', text: 'Обновлены данные по кабинетам для занятий.' }
    ];

    return (
        <div className="activity-column">
            <h2 className="column-title">
                <FaHistory className="column-icon" />
                Журнал событий
            </h2>
            <div className="activity-log">
                {activities.map((activity, index) => (
                    <div key={index} className="log-entry">
                        <span className="log-time">{activity.time}</span>
                        {activity.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

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
        switch(cardType) {
            case 'generate':
                navigate('/generate');
                break;
            case 'extracurricular':
                alert('Функция "Внешкольные занятия" в разработке');
                break;
            case 'view':
                navigate('/schedule');
                break;
        }
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
                        <ActionCard
                            type="generate"
                            title="Автогенерация"
                            description="Загрузите Excel файл с данными и автоматически создайте расписание на учебный год"
                            buttonText="Запустить генератор"
                            onButtonClick={() => handleCardClick('generate')}
                        />
                        
                        <ActionCard
                            type="extracurricular"
                            title="Внешкольные занятия"
                            description="Ручное добавление, редактирование и удаление кружков, секций и мероприятий"
                            buttonText="Управлять занятиями"
                            onButtonClick={() => handleCardClick('extracurricular')}
                        />
                        
                        <ActionCard
                            type="view"
                            title="Просмотр расписаний"
                            description="Просмотр, печать и редактирование готовых расписаний для всех классов"
                            buttonText="Открыть список"
                            onButtonClick={() => handleCardClick('view')}
                        />
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