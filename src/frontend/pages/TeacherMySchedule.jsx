// src/frontend/pages/TeacherMySchedule.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, 
    FaRegCalendarAlt,
    FaRegClock,
    FaRegUser,
    FaRegBuilding,
    FaSun,
    FaMoon,
    FaStar,
    FaBook,
    FaUser,
    FaChalkboardTeacher,
    FaMapMarkerAlt,
    FaClock
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import teacherScheduleStorage from '../services/teacherScheduleStorage';
import { WEEK_DAYS, TIME_SLOTS } from '../config/teacherScheduleData';
import styles from '../styles/TeacherMySchedule.module.css';

// ========== КОМПОНЕНТ КНОПКИ ПЕРЕКЛЮЧЕНИЯ ТЕМЫ ==========
const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
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
        <button className={styles.themeBtn} onClick={toggleTheme}>
            {isDark ? <FaSun /> : <FaMoon />}
            <span>{isDark ? 'Светлая тема' : 'Темная тема'}</span>
        </button>
    );
};

// ========== КОМПОНЕНТ ТАБЛИЦЫ ДНЯ ==========
const DayScheduleTable = ({ day, lessons }) => {
    // Получаем уроки для этого дня
    const dayLessons = lessons.filter(lesson => 
        lesson.days && lesson.days.includes(day.name)
    );

    // Создаем карту уроков по времени
    const lessonsByTime = {};
    dayLessons.forEach(lesson => {
        lessonsByTime[lesson.startTime] = lesson;
    });

    // Слоты времени для уроков (1-7 уроки)
    const timeSlots = [
        { number: 1, time: '08:30' },
        { number: 2, time: '09:25' },
        { number: 3, time: '10:20' },
        { number: 4, time: '11:15' },
        { number: 5, time: '12:10' },
        { number: 6, time: '13:05' },
        { number: 7, time: '14:00' }
    ];

    return (
        <div className={styles.dayTableWrapper}>
            <div className={styles.dayTableHeader}>
                <span className={styles.dayShort}>{day.short}</span>
                <span className={styles.dayFull}>{day.name}</span>
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
                            const lesson = lessonsByTime[slot.time];
                            
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
                                        {lesson ? (
                                            <div 
                                                className={styles.lessonItem}
                                                style={{ 
                                                    borderLeftColor: lesson.color || '#2196F3',
                                                    backgroundColor: `${lesson.color || '#2196F3'}10`
                                                }}
                                            >
                                                <div className={styles.lessonInfo}>
                                                    <div className={styles.lessonSubject}>
                                                        <FaBook />
                                                        <span>{lesson.title}</span>
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

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
const TeacherMySchedule = () => {
    const navigate = useNavigate();
    
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);
        try {
            const data = teacherScheduleStorage.getAll();
            setLessons(data);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Разделяем дни на две строки
    const topRowDays = WEEK_DAYS.slice(0, 3);
    const bottomRowDays = WEEK_DAYS.slice(3, 6);

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.animatedBg}>
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className={styles.glassCircle}></div>
                    ))}
                </div>
                <div className={styles.topBar}>
                    <button className={styles.backBtn} onClick={() => navigate('/teacher')}>
                        <FaArrowLeft /> <span>Назад</span>
                    </button>
                    <ThemeToggle />
                </div>
                <Header />
                <main className={styles.container}>
                    <div className={styles.loader}>
                        <div className={styles.spinner}></div>
                        <p className={styles.loadingText}>Загрузка расписания...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.animatedBg}>
                {[...Array(10)].map((_, i) => (
                    <div key={i} className={styles.glassCircle}></div>
                ))}
            </div>
            
            <div className={styles.topBar}>
                <button className={styles.backBtn} onClick={() => navigate('/teacher')}>
                    <FaArrowLeft /> <span>Назад</span>
                </button>
                <ThemeToggle />
            </div>

            <Header />

            <main className={styles.container}>
                <div className={styles.scheduleHeader}>
                    <h1><FaRegCalendarAlt /> Моё расписание</h1>
                </div>

                <div className={styles.scheduleGrid}>
                    <div className={styles.topRow}>
                        {topRowDays.map(day => (
                            <DayScheduleTable key={day.id} day={day} lessons={lessons} />
                        ))}
                    </div>
                    <div className={styles.bottomRow}>
                        {bottomRowDays.map(day => (
                            <DayScheduleTable key={day.id} day={day} lessons={lessons} />
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TeacherMySchedule;