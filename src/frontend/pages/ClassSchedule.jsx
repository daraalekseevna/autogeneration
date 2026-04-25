// src/frontend/pages/ClassSchedule.jsx
import React, { useState, useEffect } from 'react';
import { 
    FaCalendarAlt,
    FaSun, 
    FaMoon,
    FaClock,
    FaBook,
    FaChalkboardTeacher,
    FaMapMarkerAlt,
    FaUserGraduate,
    FaArrowRight
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getScheduleByClassName, getSubjectColor, weekDays, timeSlots } from '../data/classScheduleData';
import '../styles/MainContent.css';
import styles from '../styles/ClassSchedule.module.css';

const ClassSchedule = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState('');
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });
    
    const user = JSON.parse(localStorage.getItem('user')) || { name: '5А класс', role: 'class' };
    const className = user.name || '5А класс';
    const userRole = user.role || 'class';
    
    // Получаем расписание для класса
    const scheduleData = getScheduleByClassName(className);

    useEffect(() => {
        updateCurrentDate();
    }, []);

    useEffect(() => {
        if (isDarkTheme) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkTheme]);

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
        setIsDarkTheme(!isDarkTheme);
    };

    const handleExtracurricularClick = () => {
        navigate('/class/extracurricular');
    };

    const topRowDays = weekDays.slice(0, 3);
    const bottomRowDays = weekDays.slice(3, 6);

    const DayScheduleTable = ({ dayName }) => {
        const lessons = scheduleData[dayName] || [];

        return (
            <div className={styles.dayTableWrapper}>
                <div className={styles.dayTableHeader}>
                    <span className={styles.dayShort}>
                        {dayName === 'Понедельник' ? 'ПН' : 
                         dayName === 'Вторник' ? 'ВТ' : 
                         dayName === 'Среда' ? 'СР' : 
                         dayName === 'Четверг' ? 'ЧТ' : 
                         dayName === 'Пятница' ? 'ПТ' : 'СБ'}
                    </span>
                    <span className={styles.dayFull}>{dayName}</span>
                </div>
                <div className={styles.dayTableContainer}>
                    <table className={styles.scheduleTable}>
                        <thead>
                            <tr>
                                <th className={styles.timeCol}>Урок</th>
                                <th className={styles.timeColFull}>Время</th>
                                <th className={styles.contentCol}>Занятие</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map((slot) => {
                                const lesson = lessons.find(l => l.number === slot.number);
                                
                                return (
                                    <tr key={slot.number} className={styles.scheduleRow}>
                                        <td className={styles.lessonNumCell}>
                                            <div className={styles.lessonNumber}>{slot.number}</div>
                                        </td>
                                        <td className={styles.lessonTimeCell}>
                                            <div className={styles.lessonTime}>
                                                <FaClock />
                                                <span>{slot.time}</span>
                                            </div>
                                        </td>
                                        <td className={styles.lessonContentCell}>
                                            {lesson && lesson.subject ? (
                                                <div 
                                                    className={styles.lessonItem}
                                                    style={{ 
                                                        borderLeftColor: getSubjectColor(lesson.subject),
                                                        backgroundColor: `${getSubjectColor(lesson.subject)}10`
                                                    }}
                                                >
                                                    <div className={styles.lessonInfo}>
                                                        <div className={styles.lessonSubject}>
                                                            <FaBook />
                                                            <span>{lesson.subject}</span>
                                                        </div>
                                                        <div className={styles.lessonTeacher}>
                                                            <FaChalkboardTeacher />
                                                            <span>{lesson.teacher}</span>
                                                        </div>
                                                        <div className={styles.lessonRoom}>
                                                            <FaMapMarkerAlt />
                                                            <span>Каб. {lesson.room}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={styles.emptySlot}>—</div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="main-content-page">
            <div className="animated-bg">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>
            
            <Header />
            
            <div className={styles.themeToggle}>
                <button className={styles.themeBtn} onClick={toggleTheme}>
                    {isDarkTheme ? <FaSun /> : <FaMoon />}
                    <span>{isDarkTheme ? 'Светлая тема' : 'Темная тема'}</span>
                </button>
            </div>
            
            <main className={styles.container}>
                <div className={styles.scheduleHeader}>
                    <div className={styles.classInfo}>
                        <div className={styles.classIcon}>
                            <FaUserGraduate />
                        </div>
                        <div>
                            <h1>{className} класс</h1>
                            <p className={styles.currentDate}>
                                <FaCalendarAlt />
                                <span>{currentDate}</span>
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        className={styles.extracurricularBtn}
                        onClick={handleExtracurricularClick}
                    >
                        <FaArrowRight />
                        <span>Дополнительные занятия</span>
                    </button>
                </div>

                <div className={styles.scheduleGrid}>
                    <div className={styles.topRow}>
                        {topRowDays.map(day => (
                            <DayScheduleTable key={day} dayName={day} />
                        ))}
                    </div>
                    <div className={styles.bottomRow}>
                        {bottomRowDays.map(day => (
                            <DayScheduleTable key={day} dayName={day} />
                        ))}
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default ClassSchedule;