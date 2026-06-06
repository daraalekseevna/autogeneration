// SuperAdminDashboard.jsx - ОСНОВНОЙ КОМПОНЕНТ С РАЗДЕЛЕННЫМИ ТАБАМИ
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaUsers, FaChalkboardTeacher, FaSchool, FaDoorOpen, FaBook, FaClipboardList, FaCalendarPlus, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import AdminsTab from '../components/AdminsTab';
import TeachersTab from '../components/TeachersTab';
import ClassesTab from '../components/ClassesTab';
import RoomsTab from '../components/RoomsTab';
import LessonsTab from '../components/LessonsTab';
import SanPinTab from '../components/SanPinTab';
import '../styles/MainContent.css';
import '../styles/SuperAdmin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const normalizeLessonsData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data?.rows && Array.isArray(data.rows)) return data.rows;
    if (typeof data === 'object') {
        const values = Object.values(data);
        const arrayValue = values.find(v => Array.isArray(v));
        if (arrayValue) return arrayValue;
    }
    return [];
};

const ConfettiEffect = () => {
    React.useEffect(() => {
        const colors = ['#21435A', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#60a5fa', '#ec4899'];
        const container = document.createElement('div');
        container.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10000; overflow: hidden;`;
        document.body.appendChild(container);
        
        const particles = [];
        const count = 150;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = 5 + Math.random() * 10;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const isCircle = Math.random() > 0.6;
            const spreadX = (Math.random() - 0.5) * 16;
            
            particle.style.cssText = `position: absolute; width: ${size}px; height: ${size}px; background: ${color}; left: ${50 + spreadX}%; top: ${-20 - Math.random() * 30}px; opacity: ${0.5 + Math.random() * 0.5}; border-radius: ${isCircle ? '50%' : '2px'};`;
            container.appendChild(particle);
            
            particles.push({
                el: particle, x: 50 + spreadX, y: -20 - Math.random() * 30,
                vx: spreadX * 0.4 + (Math.random() - 0.5) * 1.5, vy: 2 + Math.random() * 5,
                rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 10, gravity: 0.12
            });
        }
        
        let startTime = performance.now();
        let frameId;
        
        const animate = (now) => {
            const elapsed = (now - startTime) / 1000;
            if (elapsed >= 4.5) { container.remove(); return; }
            const opacity = elapsed > 2.5 ? Math.max(0, 1 - (elapsed - 2.5) * 0.7) : 1;
            for (const p of particles) {
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.rotSpeed;
                p.el.style.transform = `translateX(${p.x - 50}%) rotate(${p.rot}deg)`;
                p.el.style.left = `${p.x}%`;
                p.el.style.top = `${p.y}px`;
                p.el.style.opacity = opacity * (0.6 + Math.random() * 0.4);
            }
            frameId = requestAnimationFrame(animate);
        };
        frameId = requestAnimationFrame(animate);
        return () => { if (frameId) cancelAnimationFrame(frameId); if (container.parentNode) container.remove(); };
    }, []);
    return null;
};

const SuperAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('admins');
    const [admins, setAdmins] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [lessonAssignments, setLessonAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showYearStartWizard, setShowYearStartWizard] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    
    const token = localStorage.getItem('token');
    
    React.useEffect(() => { if (!token) window.location.href = '/login'; }, [token]);
    
    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [adminsRes, teachersRes, classesRes, roomsRes, lessonsRes, assignmentsRes] = await Promise.all([
                axios.get(`${API_URL}/superadmin/admins`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/teachers`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/classes`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/rooms`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/lessons`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/lesson-assignments`, config).catch(() => ({ data: [] }))
            ]);
            setAdmins(adminsRes.data || []);
            setTeachers(teachersRes.data || []);
            setClasses(classesRes.data || []);
            setRooms(roomsRes.data || []);
            setLessons(normalizeLessonsData(lessonsRes.data));
            setLessonAssignments(assignmentsRes.data || []);
        } catch (err) {
            console.error('Load error:', err);
            if (err.response?.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; }
        } finally { setLoading(false); }
    }, [token]);
    
    React.useEffect(() => { loadData(); }, [loadData]);
    
    const stats = useMemo(() => ({
        admins: admins.length, teachers: teachers.length, classes: classes.length, rooms: rooms.length,
        lessons: lessons.length, assignments: lessonAssignments.length
    }), [admins, teachers, classes, rooms, lessons, lessonAssignments]);
    
    if (loading) {
        return (
            <div className="main-content-page">
                <ThemeToggle />
                <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>
            </div>
        );
    }
    
    return (
        <div className="main-content-page">
            <ThemeToggle />
            <BackButton fallbackPath="/" />
            <div className="animated-bg" aria-hidden="true">
                {[...Array(10)].map((_, i) => (<div key={i} className="glass-circle"></div>))}
            </div>
            <Header />
            <main className="superadmin-container">
                <div className="superadmin-header">
                    <h1 className="superadmin-title">Панель управления</h1>
                    <p className="superadmin-subtitle">Управление администраторами, учителями, классами, кабинетами и уроками</p>
                </div>
                
                <div className="stats-grid">
                    <div className="stat-card"><div className="stat-number">{stats.admins}</div><div className="stat-label">Администраторов</div></div>
                    <div className="stat-card"><div className="stat-number">{stats.teachers}</div><div className="stat-label">Учителей</div></div>
                    <div className="stat-card"><div className="stat-number">{stats.classes}</div><div className="stat-label">Классов</div></div>
                    <div className="stat-card"><div className="stat-number">{stats.rooms}</div><div className="stat-label">Кабинетов</div></div>
                    <div className="stat-card"><div className="stat-number">{stats.lessons}</div><div className="stat-label">Уроков</div></div>
                    <div className="stat-card"><div className="stat-number">{stats.assignments}</div><div className="stat-label">Назначений</div></div>
                </div>
                
                <div className="new-year-button-container">
                    <button onClick={() => setShowYearStartWizard(true)} className="new-year-btn"><FaCalendarPlus /> Начать новый учебный год</button>
                </div>
                
                <div className="tabs-container" role="tablist">
                    <button onClick={() => setActiveTab('admins')} className={`tab-button ${activeTab === 'admins' ? 'active' : ''}`}><FaUsers /> Администраторы</button>
                    <button onClick={() => setActiveTab('teachers')} className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`}><FaChalkboardTeacher /> Учителя</button>
                    <button onClick={() => setActiveTab('classes')} className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}><FaSchool /> Классы</button>
                    <button onClick={() => setActiveTab('rooms')} className={`tab-button ${activeTab === 'rooms' ? 'active' : ''}`}><FaDoorOpen /> Кабинеты</button>
                    <button onClick={() => setActiveTab('lessons')} className={`tab-button ${activeTab === 'lessons' ? 'active' : ''}`}><FaBook /> Уроки</button>
                    <button onClick={() => setActiveTab('sanpin')} className={`tab-button ${activeTab === 'sanpin' ? 'active' : ''}`}><FaClipboardList /> СанПиН</button>
                </div>
                
                {activeTab === 'admins' && <AdminsTab admins={admins} token={token} onDataChange={loadData} />}
                
                {/* ИСПРАВЛЕНО: теперь передаем rooms в TeachersTab */}
                {activeTab === 'teachers' && (
                    <TeachersTab 
                        teachers={teachers} 
                        lessons={lessons} 
                        rooms={rooms}      // ← ДОБАВЛЕНО!
                        token={token} 
                        onDataChange={loadData} 
                    />
                )}
                
                {activeTab === 'classes' && <ClassesTab classes={classes} teachers={teachers} token={token} onDataChange={loadData} />}
                
                {/* RoomsTab - teachers не нужен */}
                {activeTab === 'rooms' && <RoomsTab rooms={rooms} lessons={lessons} token={token} onDataChange={loadData} />}
                
                {activeTab === 'lessons' && <LessonsTab lessons={lessons} token={token} onDataChange={loadData} />}
                {activeTab === 'sanpin' && <SanPinTab token={token} />}
            </main>
            
            {showYearStartWizard && (
                <div className="wizard-modal-overlay" onClick={() => setShowYearStartWizard(false)}>
                    <div className="wizard-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="wizard-modal-header">
                            <h2><FaCalendarPlus /> Мастер начала нового учебного года</h2>
                            <button className="wizard-close" onClick={() => setShowYearStartWizard(false)}><FaTimes /></button>
                        </div>
                        <div className="wizard-body">
                            <p>Мастер начала нового учебного года будет добавлен позже.</p>
                        </div>
                    </div>
                </div>
            )}
            
            {showConfetti && <ConfettiEffect />}
            <Footer />
        </div>
    );
};

export default SuperAdminDashboard;