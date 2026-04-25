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
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { WEEK_DAYS, TIME_SLOTS } from '../config/teacherScheduleData';
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

// ========== КОМПОНЕНТ ТАБЛИЦЫ ДНЯ ==========
const DayScheduleTable = ({ day, lessons, activities }) => {
    // Слоты времени для уроков (1-7 уроки)
    const timeSlots = [
        { number: 1, time: '08:30', endTime: '09:15' },
        { number: 2, time: '09:25', endTime: '10:10' },
        { number: 3, time: '10:20', endTime: '11:05' },
        { number: 4, time: '11:20', endTime: '12:05' },
        { number: 5, time: '12:15', endTime: '13:00' },
        { number: 6, time: '13:10', endTime: '13:55' },
        { number: 7, time: '14:05', endTime: '14:50' }
    ];

    // Получаем уроки для этого дня
    const dayLessons = lessons.filter(lesson => 
        lesson.days && lesson.days.includes(day.name)
    );

    // Создаем карту уроков по времени
    const lessonsByTime = {};
    dayLessons.forEach(lesson => {
        lessonsByTime[lesson.startTime] = { ...lesson, type: 'lesson' };
    });

    // Получаем дополнительные занятия для этого дня
    const dayActivities = (activities[day.name] || []).map(act => ({
        ...act,
        type: 'extracurricular',
        title: act.name,
        startTime: act.startTime,
        endTime: act.endTime
    }));

    // Объединяем уроки и дополнительные занятия
    const allItems = [...Object.values(lessonsByTime), ...dayActivities];
    
    // Сортируем по времени начала
    allItems.sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));

    // Функция для получения цвета предмета
    const getSubjectColor = (title) => {
        const colors = {
            'Математика': '#2196F3',
            'Русский язык': '#4CAF50',
            'Литература': '#8BC34A',
            'Английский язык': '#FF9800',
            'История': '#9C27B0',
            'Обществознание': '#673AB7',
            'География': '#00BCD4',
            'Биология': '#4CAF50',
            'Физика': '#3F51B5',
            'Химия': '#FF5722',
            'Физкультура': '#795548',
            'Информатика': '#607D8B'
        };
        return colors[title] || '#9E9E9E';
    };

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
                            <th className={styles.timeCol}>Время</th>
                            <th className={styles.contentCol}>Занятие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allItems.length === 0 ? (
                            <tr>
                                <td colSpan="2" className={styles.emptySlot}>Нет занятий</td>
                            </tr>
                        ) : (
                            allItems.map((item, idx) => {
                                if (item.type === 'lesson') {
                                    // Отображение урока
                                    return (
                                        <tr key={idx} className={styles.scheduleRow}>
                                            <td className={styles.lessonTimeCell}>
                                                <div className={styles.lessonTime}>
                                                    <FaClock />
                                                    <span>{item.startTime}</span>
                                                </div>
                                            </td>
                                            <td className={styles.lessonContentCell}>
                                                <div 
                                                    className={styles.lessonItem}
                                                    style={{ 
                                                        borderLeftColor: getSubjectColor(item.title),
                                                        backgroundColor: `${getSubjectColor(item.title)}10`
                                                    }}
                                                >
                                                    <div className={styles.lessonInfo}>
                                                        <div className={styles.lessonSubject}>
                                                            <FaBook />
                                                            <span>{item.title}</span>
                                                        </div>
                                                        <div className={styles.lessonTeacher}>
                                                            <FaChalkboardTeacher />
                                                            <span>{item.className || item.teacher}</span>
                                                        </div>
                                                        <div className={styles.lessonRoom}>
                                                            <FaMapMarkerAlt />
                                                            <span>Каб. {item.room}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                } else {
                                    // Отображение дополнительного занятия
                                    return (
                                        <tr key={idx} className={styles.extracurricularRow}>
                                            <td className={styles.lessonTimeCell}>
                                                <div className={styles.lessonTime}>
                                                    <FaClock />
                                                    <span>{item.startTime} - {item.endTime}</span>
                                                </div>
                                            </td>
                                            <td className={styles.lessonContentCell}>
                                                <div className={styles.extracurricularItem}>
                                                    <div className={styles.extracurricularHeader}>
                                                        <FaStar className={styles.extracurricularIcon} />
                                                        <span className={styles.extracurricularName}>{item.title}</span>
                                                    </div>
                                                    {item.description && (
                                                        <div className={styles.extracurricularDesc}>
                                                            {item.description}
                                                        </div>
                                                    )}
                                                    <div className={styles.extracurricularRoom}>
                                                        <FaMapMarkerAlt />
                                                        <span>Каб. {item.room}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }
                            })
                        )}
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
            // Загружаем расписание уроков с бэкенда
            const scheduleResponse = await axios.get(`${API_URL}/teacher/my-schedule`, getAuthHeaders());
            
            // Преобразуем данные с бэкенда в нужный формат
            const scheduleData = scheduleResponse.data.schedule || {};
            const formattedLessons = [];
            
            Object.keys(scheduleData).forEach(day => {
                scheduleData[day].forEach(lesson => {
                    formattedLessons.push({
                        id: lesson.id,
                        title: lesson.subject,
                        teacher: 'Я',
                        room: lesson.room,
                        startTime: getTimeByLessonNumber(lesson.number),
                        days: [day],
                        className: lesson.className,
                        color: getSubjectColor(lesson.subject)
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

    // Функция для получения времени по номеру урока
    const getTimeByLessonNumber = (number) => {
        const timeMap = {
            1: '08:30',
            2: '09:25',
            3: '10:20',
            4: '11:20',
            5: '12:15',
            6: '13:10',
            7: '14:05'
        };
        return timeMap[number] || '08:30';
    };

    const getSubjectColor = (subject) => {
        const colors = {
            'Математика': '#2196F3',
            'Русский язык': '#4CAF50',
            'Литература': '#8BC34A',
            'Английский язык': '#FF9800',
            'История': '#9C27B0',
            'Обществознание': '#673AB7',
            'География': '#00BCD4',
            'Биология': '#4CAF50',
            'Физика': '#3F51B5',
            'Химия': '#FF5722',
            'Физкультура': '#795548',
            'Информатика': '#607D8B'
        };
        return colors[subject] || '#9E9E9E';
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