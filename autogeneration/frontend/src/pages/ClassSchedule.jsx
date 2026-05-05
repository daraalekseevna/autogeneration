import React, { useState, useEffect } from 'react';
import { 
    FaCalendarAlt,
    FaClock,
    FaBook,
    FaChalkboardTeacher,
    FaMapMarkerAlt,
    FaUserGraduate,
    FaArrowRight,
    FaSpinner
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import '../styles/MainContent.css';
import styles from '../styles/ClassSchedule.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getSubjectColor = (subject) => {
    const colors = {
        'Математика': '#f59e0b',
        'Русский язык': '#10b981',
        'Литература': '#10b981',
        'Физика': '#3b82f6',
        'Химия': '#8b5cf6',
        'Биология': '#06b6d4',
        'История': '#ef4444',
        'География': '#84cc16',
        'Английский язык': '#ec4899',
        'Информатика': '#6366f1'
    };
    return colors[subject] || '#21435A';
};

const timeSlots = [
    { number: 1, time: '08:00-08:40' },
    { number: 2, time: '08:50-09:30' },
    { number: 3, time: '09:50-10:30' },
    { number: 4, time: '10:50-11:30' },
    { number: 5, time: '11:50-12:30' },
    { number: 6, time: '12:50-13:30' },
    { number: 7, time: '13:40-14:20' }
];

const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const ClassSchedule = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState('');
    const [className, setClassName] = useState('');
    const [schedule, setSchedule] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        let name = '';
        if (user.gradeNumber && user.gradeLetter) {
            name = `${user.gradeNumber}${user.gradeLetter}`;
        } else if (user.name) {
            name = user.name;
        } else {
            name = 'Класс';
        }
        setClassName(name);
    }, [user, navigate]);

    useEffect(() => {
        updateCurrentDate();
        const interval = setInterval(updateCurrentDate, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (className && className !== 'Класс') {
            loadSchedule();
        }
    }, [className]);

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

    const loadSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/schedule/class/${className}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setSchedule(response.data.schedule);
            } else {
                setError('Не удалось загрузить расписание');
            }
        } catch (err) {
            console.error('Error loading schedule:', err);
            setError(err.response?.data?.message || 'Ошибка загрузки расписания');
        } finally {
            setLoading(false);
        }
    };

    const handleExtracurricularClick = () => {
        navigate('/class/extracurricular');
    };

    const DayScheduleTable = ({ dayName }) => {
        const lessons = schedule[dayName] || [];

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

    if (loading) {
        return (
            <div className="main-content-page">
                <ThemeToggle />
                <BackButton fallbackPath="/" />

                {/* <div className="animated-bg">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="glass-circle"></div>
                    ))}

                </div> */}

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
                <BackButton fallbackPath="/" />
                {/* <div className="animated-bg">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="glass-circle"></div>
                    ))}
                </div> */}
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

    const topRowDays = weekDays.slice(0, 3);
    const bottomRowDays = weekDays.slice(3, 6);

    return (
        <div className="main-content-page">
            <ThemeToggle />
            <BackButton fallbackPath="/" />
            
            {/* <div className="animated-bg">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div> */}
            
            <Header />
            
            <main className={styles.container}>
                <div className={styles.scheduleHeader}>
                    <div className={styles.classInfo}>
                        <div className={styles.classIcon}>
                            <FaUserGraduate />
                        </div>
                        <div>
                            <h1>{className}</h1>
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