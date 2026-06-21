import React, { useState, useEffect } from 'react';
import { 
    FaCalendarAlt,
    FaClock,
    FaBook,
    FaChalkboardTeacher,
    FaMapMarkerAlt,
    FaUserGraduate,
    FaSpinner
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import '../styles/MainContent.css';
import styles from '../styles/TeacherMySchedule.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TeacherMySchedule = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState('');
    const [schedule, setSchedule] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [teacherName, setTeacherName] = useState('');
    const [teacherColor, setTeacherColor] = useState('#21435A');

    useEffect(() => {
        updateCurrentDate();
        loadSchedule();
        loadTeacherInfo();
        const interval = setInterval(updateCurrentDate, 60000);
        return () => clearInterval(interval);
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
                if (response.data.color) {
                    setTeacherColor(response.data.color);
                }
            }
        } catch (err) {
            console.error('Error loading teacher info:', err);
        }
    };

    const loadSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/teacher/my-schedule`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.schedule) {
                setSchedule(response.data.schedule);
            } else {
                setSchedule({});
            }
        } catch (err) {
            console.error('Error loading schedule:', err);
            setError('Не удалось загрузить расписание');
            setSchedule({});
        } finally {
            setLoading(false);
        }
    };

    const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

    const DaySchedule = ({ dayName }) => {
        const lessons = schedule[dayName] || [];
        
        return (
            <div className={styles.dayColumn}>
                <div className={styles.dayHeader}>
                    <span className={styles.dayShort}>
                        {dayName === 'Понедельник' ? 'ПН' : 
                         dayName === 'Вторник' ? 'ВТ' : 
                         dayName === 'Среда' ? 'СР' : 
                         dayName === 'Четверг' ? 'ЧТ' : 
                         dayName === 'Пятница' ? 'ПТ' : 'СБ'}
                    </span>
                    <span className={styles.dayFull}>{dayName}</span>
                </div>
                <div className={styles.lessonsList}>
                    {lessons.length > 0 ? (
                        lessons.map((lesson, index) => {
                            const color = lesson.teacherColor || teacherColor || '#21435A';
                            return (
                                <div 
                                    key={index} 
                                    className={styles.lessonCard}
                                    style={{ 
                                        borderLeftColor: color,
                                        backgroundColor: `${color}10`
                                    }}
                                >
                                    <div className={styles.lessonNumber}>{lesson.number}</div>
                                    <div className={styles.lessonContent}>
                                        <div className={styles.lessonSubject}>
                                            <FaBook />
                                            <span>{lesson.subject}</span>
                                        </div>
                                        <div className={styles.lessonClass}>
                                            <FaUserGraduate />
                                            <span>{lesson.className}</span>
                                        </div>
                                        <div className={styles.lessonRoom}>
                                            <FaMapMarkerAlt />
                                            <span>Каб. {lesson.room}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className={styles.emptyLessons}>—</div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="main-content-page">
                <ThemeToggle />
                <BackButton fallbackPath="/teacher" />
                <Header />
                <main className={styles.container}>
                    <div className={styles.loader}>
                        <FaSpinner className={styles.spinner} />
                        <p>Загрузка расписания...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="main-content-page">
                <ThemeToggle />
                <BackButton fallbackPath="/teacher" />
                <Header />
                <main className={styles.container}>
                    <div className={styles.errorContainer}>
                        <p>{error}</p>
                        <button onClick={loadSchedule}>Повторить</button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="main-content-page">
            <ThemeToggle />
            <BackButton fallbackPath="/teacher" />
            
            <Header />
            
            <main className={styles.container}>
                <div className={styles.scheduleHeader}>
                    <div className={styles.teacherInfo}>
                        <div 
                            className={styles.teacherAvatar}
                            style={{ backgroundColor: teacherColor }}
                        >
                            <FaChalkboardTeacher />
                        </div>
                        <div>
                            <h1>Моё расписание</h1>
                            <p className={styles.teacherName}>{teacherName}</p>
                            <p className={styles.currentDate}>
                                <FaCalendarAlt />
                                <span>{currentDate}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className={styles.scheduleGrid}>
                    {weekDays.map(day => (
                        <DaySchedule key={day} dayName={day} />
                    ))}
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default TeacherMySchedule;