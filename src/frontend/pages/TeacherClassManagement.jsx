// src/frontend/pages/TeacherClassManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
    FaArrowLeft, 
    FaUsers, 
    FaSun, 
    FaMoon,
    FaUserGraduate,
    FaRegCalendarAlt,
    FaRegClock,
    FaRegBuilding,
    FaUser,
    FaSchool,
    FaBook,
    FaChalkboardTeacher,
    FaMapMarkerAlt,
    FaClock
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getTeacherClass, getScheduleByClass, subjectColors } from '../data/teacherClassData';
import styles from '../styles/TeacherClassManagement.module.css';

const TeacherClassManagement = () => {
    const navigate = useNavigate();
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });

    const [myClass, setMyClass] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClassTeacher, setIsClassTeacher] = useState(false);

    useEffect(() => {
        if (isDarkTheme) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkTheme]);

    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
    };

    useEffect(() => {
        loadClassData();
    }, []);

    const loadClassData = () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            
            const teacherClass = getTeacherClass(user?.id);
            
            if (teacherClass) {
                setIsClassTeacher(true);
                setMyClass(teacherClass);
                const classSchedule = getScheduleByClass(teacherClass.name);
                setSchedule(classSchedule);
            } else {
                setIsClassTeacher(false);
            }
        } catch (error) {
            console.error('Error loading class data:', error);
            setIsClassTeacher(false);
        } finally {
            setLoading(false);
        }
    };

    const getSubjectColor = (subject) => {
        return subjectColors[subject] || '#9E9E9E';
    };

    // Преобразуем расписание в формат для таблицы
    const getLessonsByDayAndTime = () => {
        const result = {};
        const timeSlots = ['08:30', '09:25', '10:20', '11:15', '12:10', '13:05', '14:00'];
        
        schedule.forEach(day => {
            result[day.day] = {};
            day.lessons.forEach(lesson => {
                // Находим индекс времени
                const timeIndex = timeSlots.findIndex(t => t === lesson.time.split(' - ')[0]);
                if (timeIndex !== -1) {
                    result[day.day][timeIndex] = lesson;
                }
            });
        });
        
        return result;
    };

    const lessonsByDayAndTime = getLessonsByDayAndTime();
    const timeSlots = [
        { number: 1, time: '08:30' },
        { number: 2, time: '09:25' },
        { number: 3, time: '10:20' },
        { number: 4, time: '11:15' },
        { number: 5, time: '12:10' },
        { number: 6, time: '13:05' },
        { number: 7, time: '14:00' }
    ];

    const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const topRowDays = weekDays.slice(0, 3);
    const bottomRowDays = weekDays.slice(3, 6);

    const DayScheduleTable = ({ dayName }) => {
        const dayLessons = lessonsByDayAndTime[dayName] || {};

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
                                const lesson = dayLessons[slot.number - 1];
                                
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
                    <button className={styles.themeBtn} onClick={toggleTheme}>
                        {isDarkTheme ? <FaSun /> : <FaMoon />}
                        <span>{isDarkTheme ? 'Светлая тема' : 'Темная тема'}</span>
                    </button>
                </div>
                <Header />
                <main className={styles.container}>
                    <div className={styles.loader}>
                        <div className={styles.spinner}></div>
                        <p className={styles.loadingText}>Загрузка...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!isClassTeacher) {
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
                    <button className={styles.themeBtn} onClick={toggleTheme}>
                        {isDarkTheme ? <FaSun /> : <FaMoon />}
                        <span>{isDarkTheme ? 'Светлая тема' : 'Темная тема'}</span>
                    </button>
                </div>
                <Header />
                <main className={styles.container}>
                    <div className={styles.disabledCard}>
                        <FaSchool className={styles.disabledIcon} />
                        <h2>Доступ ограничен</h2>
                        <p>Вы не являетесь классным руководителем.<br />Эта страница доступна только классным руководителям.</p>
                        <button className={styles.backToTeacherBtn} onClick={() => navigate('/teacher')}>
                            <FaArrowLeft /> Вернуться назад
                        </button>
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
                <button className={styles.themeBtn} onClick={toggleTheme}>
                    {isDarkTheme ? <FaSun /> : <FaMoon />}
                    <span>{isDarkTheme ? 'Светлая тема' : 'Темная тема'}</span>
                </button>
            </div>

            <Header />

            <main className={styles.container}>
                {/* Информация о классе */}
                <div className={styles.classHeader}>
                    <div className={styles.classIcon}>
                        <FaUsers />
                    </div>
                    <div className={styles.classInfo}>
                        <h1>{myClass?.name} класс</h1>
                        <p>Классный руководитель: {myClass?.teacherName}</p>
                        <p>Кабинет: {myClass?.classroom} | Учебный год: {myClass?.year}/2025</p>
                    </div>
                    <div className={styles.classStats}>
                        <div className={styles.stat}>
                            <FaUserGraduate />
                            <span>{myClass?.studentsCount || 0} учеников</span>
                        </div>
                    </div>
                </div>

                {/* Расписание класса - табличное */}
                <div className={styles.scheduleSection}>
                    <h2><FaRegCalendarAlt /> Расписание класса</h2>
                    
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
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TeacherClassManagement;