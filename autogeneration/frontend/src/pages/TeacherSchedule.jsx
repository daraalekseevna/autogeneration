import React, { useState, useEffect } from 'react';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaCalendarDay,
  FaChalkboardTeacher
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import '../styles/MainContent.css';
import styles from '../styles/TeacherSchedule.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TeacherSchedule = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState('');
    const [teacherName, setTeacherName] = useState('');

    useEffect(() => {
        updateCurrentDate();
        loadTeacherInfo();
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
        setCurrentDate(dateString.charAt(0).toUpperCase() + dateString.slice(1));
    };

    const loadTeacherInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/teacher/my-info`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) {
                setTeacherName(response.data.fullName || 'Учитель');
            }
        } catch (err) {
            console.error('Error loading teacher info:', err);
        }
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="main-content-page">
            <ThemeToggle />
            <BackButton fallbackPath="/" />
            
            <Header />
            
            <main className="main-content-container">
                <div className="page-header">
                    <div className="title-section">
                        <h1>Личный кабинет учителя</h1>
                        {teacherName && <p className="teacher-name"><FaChalkboardTeacher /> {teacherName}</p>}
                        <div className="current-date-display">
                            <FaCalendarDay />
                            <span>{currentDate}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.cardsContainer}>
                    <div className={styles.card}>
                        <h2><FaCalendarAlt /> Моё расписание</h2>
                        <p>Просмотр вашего личного расписания уроков на неделю с указанием классов, предметов и кабинетов</p>
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