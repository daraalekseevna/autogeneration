// src/frontend/pages/TeacherMySchedule.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, 
    FaRegCalendarAlt,
    FaSun,
    FaMoon,
    FaStar,
    FaBook,
    FaChalkboardTeacher,
    FaMapMarkerAlt,
    FaClock
} from 'react-icons/fa';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { WEEK_DAYS } from '../config/teacherScheduleData';
import styles from '../styles/TeacherMySchedule.module.css';

const API_URL = 'http://localhost:5000/api';

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

// ========== КАРТОЧКА УРОКА ==========
const LessonCard = ({ lesson }) => {
    const cardColor = lesson.color || '#21435A';
    
    const cardStyle = {
        borderLeftColor: cardColor,
        backgroundColor: `${cardColor}10`
    };

    return (
        <div className={styles.lessonCard} style={cardStyle}>
            <div className={styles.lessonCardSubject}>
                <FaBook />
                <span>{lesson.title}</span>
            </div>
            <div className={styles.lessonCardRoom}>
                <FaMapMarkerAlt />
                <span>Каб. {lesson.room}</span>
            </div>
        </div>
    );
};

// ========== КАРТОЧКА ДОПОЛНИТЕЛЬНОГО ЗАНЯТИЯ ==========
const ExtracurricularCard = ({ activity }) => {
    const cardColor = activity.color || '#ffa502';
    
    const cardStyle = {
        borderLeftColor: cardColor,
        backgroundColor: `${cardColor}10`
    };

    // Форматирование времени (убираем секунды)
    const formatTime = (time) => {
        if (!time) return '';
        return time.length > 5 ? time.substring(0, 5) : time;
    };

    return (
        <div className={styles.extracurricularCard} style={cardStyle}>
            <div className={styles.extracurricularCardTime}>
                <FaClock />
                <span>{formatTime(activity.startTime)} - {formatTime(activity.endTime)}</span>
            </div>
            <div className={styles.extracurricularCardInfo}>
                <div className={styles.extracurricularCardHeader}>
                    <FaStar className={styles.extracurricularStar} style={{ color: cardColor }} />
                    <span className={styles.extracurricularCardName}>{activity.name}</span>
                </div>
                <div className={styles.extracurricularCardRoom}>
                    <FaMapMarkerAlt />
                    <span>Каб. {activity.room}</span>
                </div>
            </div>
        </div>
    );
};

// ========== ТАБЛИЦА ДНЯ ==========
const DayScheduleTable = ({ day, lessons, activities }) => {
    // Фиксированные слоты времени для уроков (уже без секунд)
    const timeSlots = [
        { number: 1, time: '08:30' },
        { number: 2, time: '09:25' },
        { number: 3, time: '10:20' },
        { number: 4, time: '11:20' },
        { number: 5, time: '12:15' },
        { number: 6, time: '13:10' },
        { number: 7, time: '14:05' }
    ];

    // Получаем уроки для этого дня по номеру урока
    const lessonsByNumber = {};
    lessons.forEach(lesson => {
        if (lesson.days && lesson.days.includes(day.name)) {
            lessonsByNumber[lesson.number] = lesson;
        }
    });

    // Получаем дополнительные занятия для этого дня
    const dayActivities = (activities[day.name] || []);

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
                            const lesson = lessonsByNumber[slot.number];
                            
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
                                            <LessonCard lesson={lesson} />
                                        ) : (
                                            <div className={styles.emptySlot}>—</div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                {/* Дополнительные занятия после таблицы уроков */}
                {dayActivities.length > 0 && (
                    <div className={styles.extracurricularSection}>
                        <div className={styles.extracurricularTitle}>
                            <FaStar /> Дополнительные занятия
                        </div>
                        {dayActivities.map((activity, idx) => (
                            <ExtracurricularCard key={idx} activity={activity} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
const TeacherMySchedule = () => {
    const navigate = useNavigate();
    
    const [lessons, setLessons] = useState([]);
    const [activities, setActivities] = useState({});
    const [loading, setLoading] = useState(true);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Загружаем расписание уроков
            const scheduleResponse = await axios.get(`${API_URL}/teacher/my-schedule`, getAuthHeaders());
            
            const scheduleData = scheduleResponse.data.schedule || {};
            const formattedLessons = [];
            
            Object.keys(scheduleData).forEach(day => {
                scheduleData[day].forEach(lesson => {
                    formattedLessons.push({
                        id: lesson.id,
                        title: lesson.subject,
                        room: lesson.room,
                        number: lesson.number,
                        days: [day],
                        className: lesson.className,
                        color: lesson.color || '#21435A'
                    });
                });
            });
            
            setLessons(formattedLessons);
            
            // Загружаем дополнительные занятия
            const activitiesResponse = await axios.get(`${API_URL}/teacher/my-extracurricular`, getAuthHeaders());
            setActivities(activitiesResponse.data.activities || {});
            
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
                <div className="animated-bg">
    {[...Array(10)].map((_, i) => (
        <div key={i} className="glass-circle"></div>
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
            <div className="animated-bg">
    {[...Array(10)].map((_, i) => (
        <div key={i} className="glass-circle"></div>
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
                            <DayScheduleTable 
                                key={day.id} 
                                day={day} 
                                lessons={lessons} 
                                activities={activities}
                            />
                        ))}
                    </div>
                    <div className={styles.bottomRow}>
                        {bottomRowDays.map(day => (
                            <DayScheduleTable 
                                key={day.id} 
                                day={day} 
                                lessons={lessons} 
                                activities={activities}
                            />
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TeacherMySchedule;