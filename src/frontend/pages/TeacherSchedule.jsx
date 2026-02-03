// src/frontend/pages/TeacherSchedule.jsx
import React from 'react';
import { FaCalendarAlt, FaChalkboardTeacher, FaBook, FaUsers } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/MainContent.css';

const TeacherSchedule = () => {
    const user = JSON.parse(localStorage.getItem('user')) || { name: 'Учитель' };
    
    const scheduleData = [
        { day: 'Понедельник', lessons: ['Математика (9:00-9:45)', 'Русский язык (10:00-10:45)', 'История (11:00-11:45)'] },
        { day: 'Вторник', lessons: ['Физика (9:00-9:45)', 'Химия (10:00-10:45)', 'Биология (11:00-11:45)'] },
        { day: 'Среда', lessons: ['Литература (9:00-9:45)', 'Иностранный язык (10:00-10:45)', 'Физкультура (11:00-11:45)'] },
        { day: 'Четверг', lessons: ['Информатика (9:00-9:45)', 'География (10:00-10:45)', 'Искусство (11:00-11:45)'] },
        { day: 'Пятница', lessons: ['Технология (9:00-9:45)', 'ОБЖ (10:00-10:45)', 'Классный час (11:00-11:45)'] },
    ];

    return (
        <div className="main-content-page">
            <div className="animated-bg">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>
            
            <Header />
            
            <main className="main-content-container">
                <div className="page-header">
                    <h1 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                        <FaChalkboardTeacher style={{ marginRight: '0.5rem' }} />
                        Панель учителя
                    </h1>
                    <p style={{ color: 'var(--gray-dark)', marginBottom: '2rem' }}>
                        Добро пожаловать, {user.name}!
                    </p>
                </div>

                <div className="action-cards">
                    <div className="card">
                        <h2><FaCalendarAlt /> Расписание уроков</h2>
                        <p>Ваше расписание на текущую неделю с указанием времени и кабинетов.</p>
                        <div className="card-button-wrapper">
                            <button className="btn btn-primary">
                                <FaCalendarAlt /> Открыть расписание
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <h2><FaBook /> Электронный журнал</h2>
                        <p>Ведение электронного журнала, выставление оценок, отметка посещаемости.</p>
                        <div className="card-button-wrapper">
                            <button className="btn btn-secondary">
                                <FaBook /> Открыть журнал
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <h2><FaUsers /> Классное руководство</h2>
                        <p>Информация о вашем классе, родительские собрания, успеваемость учеников.</p>
                        <div className="card-button-wrapper">
                            <button className="btn btn-accent">
                                <FaUsers /> Управление классом
                            </button>
                        </div>
                    </div>
                </div>

                <div className="dashboard-info" style={{ marginTop: '2rem' }}>
                    <div className="status-column">
                        <h2 className="column-title">
                            <FaCalendarAlt className="column-icon" />
                            Расписание на неделю
                        </h2>
                        <div className="schedule-table">
                            {scheduleData.map((day, index) => (
                                <div key={index} style={{
                                    padding: '1rem 0',
                                    borderBottom: '1px solid var(--gray)'
                                }}>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                        {day.day}
                                    </h3>
                                    <ul>
                                        {day.lessons.map((lesson, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                                {lesson}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default TeacherSchedule;