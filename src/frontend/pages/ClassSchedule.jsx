// src/frontend/pages/ClassSchedule.jsx
import React from 'react';
import { FaCalendarAlt, FaUsers, FaBell, FaBook } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/MainContent.css';

const ClassSchedule = () => {
    const user = JSON.parse(localStorage.getItem('user')) || { name: '5 "А" Класс' };
    
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
                        <FaUsers style={{ marginRight: '0.5rem' }} />
                        Расписание класса
                    </h1>
                    <p style={{ color: 'var(--gray-dark)', marginBottom: '2rem' }}>
                        Добро пожаловать, {user.name}!
                    </p>
                </div>

                <div className="action-cards">
                    <div className="card">
                        <h2><FaCalendarAlt /> Текущее расписание</h2>
                        <p>Расписание уроков на текущую неделю. Показывает предметы, учителей и кабинеты.</p>
                        <div className="card-button-wrapper">
                            <button className="btn btn-primary">
                                <FaCalendarAlt /> Посмотреть расписание
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <h2><FaBell /> Объявления</h2>
                        <p>Важные объявления и новости для класса. Родительские собрания и мероприятия.</p>
                        <div className="card-button-wrapper">
                            <button className="btn btn-secondary">
                                <FaBell /> Читать объявления
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <h2><FaBook /> Домашние задания</h2>
                        <p>Список домашних заданий и сроки сдачи. Материалы для самостоятельной работы.</p>
                        <div className="card-button-wrapper">
                            <button className="btn btn-accent">
                                <FaBook /> Открыть задания
                            </button>
                        </div>
                    </div>
                </div>

                <div className="dashboard-info" style={{ marginTop: '2rem' }}>
                    <div className="status-column">
                        <h2 className="column-title">
                            <FaBell className="column-icon" />
                            Последние объявления
                        </h2>
                        <div className="announcements">
                            <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--gray)' }}>
                                <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                    Родительское собрание
                                </h3>
                                <p>28 октября в 18:00 в кабинете 205</p>
                            </div>
                            <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--gray)' }}>
                                <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                    Спортивное мероприятие
                                </h3>
                                <p>30 октября "Весёлые старты" на стадионе</p>
                            </div>
                            <div style={{ padding: '1rem 0' }}>
                                <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                    Каникулы
                                </h3>
                                <p>С 1 по 7 ноября - осенние каникулы</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default ClassSchedule;