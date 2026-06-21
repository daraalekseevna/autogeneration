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

const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

// Функция для расчета времени уроков на основе настроек
const calculateTimeSlots = (settings, shift = 1) => {
  if (!settings) return [];
  
  const lessonDuration = shift === 2 && settings.secondShift 
    ? settings.secondShiftLessonDuration 
    : settings.lessonDuration;
  
  const startTime = shift === 2 && settings.secondShift 
    ? settings.secondShiftStart 
    : settings.startTime;
  
  const breaks = shift === 2 && settings.secondShift 
    ? (settings.secondShiftBreaks || []) 
    : (settings.breaks || []);
  
  const shortBreakDuration = shift === 2 && settings.secondShift 
    ? (settings.secondShiftShortBreakDuration || 10) 
    : (settings.shortBreakDuration || 10);
  
  const maxLessons = shift === 2 && settings.secondShift 
    ? (settings.secondShiftMaxLessonsPerDay || 6) 
    : (settings.maxLessonsPerDay || 7);
  
  const timeSlots = [];
  let currentTime = startTime;
  
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  for (let lessonNum = 1; lessonNum <= maxLessons; lessonNum++) {
    const startMinutes = parseTime(currentTime);
    const endMinutes = startMinutes + lessonDuration;
    const endTime = formatTime(endMinutes);
    
    timeSlots.push({
      number: lessonNum,
      time: `${currentTime}-${endTime}`
    });
    
    const breakConfig = breaks.find(b => b.afterLesson === lessonNum);
    let breakDuration = shortBreakDuration;
    if (breakConfig) {
      breakDuration = breakConfig.duration;
    }
    
    currentTime = formatTime(endMinutes + breakDuration);
  }
  
  return timeSlots;
};

const ClassSchedule = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState('');
    const [className, setClassName] = useState('');
    const [schedule, setSchedule] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scheduleSettings, setScheduleSettings] = useState(null);
    const [classShift, setClassShift] = useState(1);
    const [timeSlots, setTimeSlots] = useState([]);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user || !user.id) {
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
            loadSettings();
            loadClassShift();
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

    const loadClassShift = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/schedule/class-shift/${className}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClassShift(response.data.shift || 1);
        } catch (err) {
            console.error('Error loading class shift:', err);
            setClassShift(1);
        }
    };

    const loadSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/schedule/public-settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Settings loaded:', response.data);
            setScheduleSettings(response.data);
        } catch (err) {
            console.error('Error loading settings:', err);
            setScheduleSettings({
                startTime: '08:00',
                lessonDuration: 40,
                maxLessonsPerDay: 7,
                shortBreakDuration: 10,
                breaks: [],
                secondShift: false,
                secondShiftStart: '14:00',
                secondShiftLessonDuration: 40,
                secondShiftMaxLessonsPerDay: 6,
                secondShiftShortBreakDuration: 10,
                secondShiftBreaks: []
            });
        }
    };

const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
        const token = localStorage.getItem('token');
        // ✅ ИСПРАВЛЕНО: используем /schedule/class/ (без superadmin)
        const response = await axios.get(`${API_URL}/schedule/class/${className}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Schedule response:', response.data);
        
        if (response.data.success) {
            setSchedule(response.data.schedule || {});
        } else {
            setSchedule({});
            setError('Не удалось загрузить расписание');
        }
    } catch (err) {
        console.error('Error loading schedule:', err);
        setError(err.response?.data?.message || 'Ошибка загрузки расписания');
        setSchedule({});
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        if (scheduleSettings) {
            const slots = calculateTimeSlots(scheduleSettings, classShift);
            setTimeSlots(slots);
        }
    }, [scheduleSettings, classShift]);

    const handleExtracurricularClick = () => {
        navigate('/class/extracurricular');
    };

    const DayScheduleTable = ({ dayName }) => {
        const daySchedule = schedule[dayName] || {};
        
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
                                const lesson = daySchedule[slot.number];
                                const teacherColor = (lesson && lesson.teacherColor) ? lesson.teacherColor : '#21435A';
                                
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
                                                        borderLeftColor: teacherColor,
                                                        backgroundColor: `${teacherColor}10`
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