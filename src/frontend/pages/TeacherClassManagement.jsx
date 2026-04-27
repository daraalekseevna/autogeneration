import React, { useState, useEffect } from 'react';
import { 
    FaArrowLeft, 
    FaUsers, 
    FaSun, 
    FaMoon,
    FaUserGraduate,
    FaRegCalendarAlt,
    FaBook,
    FaChalkboardTeacher,
    FaMapMarkerAlt,
    FaRegClock
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/TeacherClassManagement.module.css';

const API_URL = 'http://localhost:5000/api';

const TeacherClassManagement = () => {
    const navigate = useNavigate();
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });
    const [myClass, setMyClass] = useState(null);
    const [schedule, setSchedule] = useState({});
    const [loading, setLoading] = useState(true);

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

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    };

    useEffect(() => {
        loadClassData();
    }, []);

    const loadClassData = async () => {
        setLoading(true);
        try {
            const classResponse = await axios.get(`${API_URL}/teacher/my-class`, getAuthHeaders());
            
            if (classResponse.data.hasClass) {
                setMyClass(classResponse.data.classData);
                
                const scheduleResponse = await axios.get(`${API_URL}/teacher/my-class/schedule`, getAuthHeaders());
                setSchedule(scheduleResponse.data.schedule || {});
            } else {
                setMyClass(null);
            }
        } catch (error) {
            console.error('Error loading class data:', error);
        } finally {
            setLoading(false);
        }
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

    const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const topRowDays = weekDays.slice(0, 3);
    const bottomRowDays = weekDays.slice(3, 6);

    const timeSlots = [
        { number: 1, time: '08:30' },
        { number: 2, time: '09:25' },
        { number: 3, time: '10:20' },
        { number: 4, time: '11:15' },
        { number: 5, time: '12:10' },
        { number: 6, time: '13:05' },
        { number: 7, time: '14:00' }
    ];

    const DayScheduleTable = ({ dayName }) => {
        const dayLessons = schedule[dayName] || [];

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
                                const lesson = dayLessons.find(l => l.number === slot.number);
                                
                                return (
                                    <tr key={slot.number} className={styles.scheduleRow}>
                                        <td className={styles.lessonNumCell}>
                                            <div className={styles.lessonNumber}>{slot.number}</div>
                                        </td>
                                        <td className={styles.lessonTimeCell}>
                                            <div className={styles.lessonTime}>
                                                <FaRegClock />
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
                <div className="animated-bg">
    {[...Array(10)].map((_, i) => (
        <div key={i} className="glass-circle"></div>
    ))}
</div>
                <Header />
                <main className={styles.container}>
                    <div className={styles.loader}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!myClass) {
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
                    <button className={styles.themeBtn} onClick={toggleTheme}>
                        {isDarkTheme ? <FaSun /> : <FaMoon />}
                        <span>{isDarkTheme ? 'Светлая тема' : 'Темная тема'}</span>
                    </button>
                </div>
                <Header />
                <main className={styles.container}>
                    <div className={styles.disabledCard}>
                        <FaUsers className={styles.disabledIcon} />
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
            <div className="animated-bg">
    {[...Array(10)].map((_, i) => (
        <div key={i} className="glass-circle"></div>
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
                        <h1>{myClass.name} класс</h1>
                        <p>Классный руководитель: {myClass.teacherName}</p>
                        <p>Смена: {myClass.shift}</p>
                    </div>
                    <div className={styles.classStats}>
                        {/* <div className={styles.stat}>
                            <FaUserGraduate />
                            <span>{myClass.studentsCount} учеников</span>
                        </div> */}
                    </div>
                </div>

                {/* Только расписание */}
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