import React, { useState, useEffect } from 'react';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaCalendarDay
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import '../styles/MainContent.css';
import styles from '../styles/TeacherSchedule.module.css';

const TeacherSchedule = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState('');

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

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="main-content-page">
            <ThemeToggle />
            <BackButton fallbackPath="/" />
            
            <div className="animated-bg">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>
            
            <Header />
            
            <main className="main-content-container">
                <div className="page-header">
                    <div className="title-section">
                        <div className="current-date-display">
                            <FaCalendarDay />
                            <span>{currentDate}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.cardsContainer}>
                    <div className={styles.card}>
                        <h2><FaCalendarAlt /> Моё расписание</h2>
                        <p>Просмотр личного расписания уроков на неделю с указанием классов, предметов и кабинетов</p>
                        <div className="card-button-wrapper">
                            <button 
                                className="btn btn-primary"
                                onClick={() => handleNavigation('/teacher/my-schedule')}
                            >
                                <FaCalendarAlt /> Открыть расписание
                            </button>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h2><FaUsers /> Классное руководство</h2>
                        <p>Управление вашим классом: просмотр расписания класса</p>
                        <div className="card-button-wrapper">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => handleNavigation('/teacher/class-management')}
                            >
                                <FaUsers /> Управление классом
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default TeacherSchedule;