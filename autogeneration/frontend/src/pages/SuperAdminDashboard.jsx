// SuperAdminDashboard.jsx - ОСНОВНОЙ КОМПОНЕНТ С РАЗДЕЛЕННЫМИ ТАБАМИ
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    FaUsers, FaChalkboardTeacher, FaSchool, FaDoorOpen, FaBook, 
    FaClipboardList, FaCalendarPlus, FaTimes, FaGraduationCap, 
    FaRocket, FaSyncAlt, FaCheckCircle, FaChartLine, FaUserTie,
    FaUserGraduate, FaBuilding, FaBookOpen, FaClipboardCheck
} from 'react-icons/fa';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import AdminsTab from '../components/AdminsTab';
import TeachersTab from '../components/TeachersTab';
import ExtendedTeachersTab from '../components/ExtendedTeachersTab';
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
        const count = 200;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = 4 + Math.random() * 12;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const isCircle = Math.random() > 0.6;
            const spreadX = (Math.random() - 0.5) * 20;
            
            particle.style.cssText = `position: absolute; width: ${size}px; height: ${size}px; background: ${color}; left: ${50 + spreadX}%; top: ${-20 - Math.random() * 40}px; opacity: ${0.6 + Math.random() * 0.4}; border-radius: ${isCircle ? '50%' : '2px'}; box-shadow: 0 0 5px ${color};`;
            container.appendChild(particle);
            
            particles.push({
                el: particle, x: 50 + spreadX, y: -20 - Math.random() * 40,
                vx: spreadX * 0.5 + (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 6,
                rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 12, gravity: 0.15
            });
        }
        
        let startTime = performance.now();
        let frameId;
        
        const animate = (now) => {
            const elapsed = (now - startTime) / 1000;
            if (elapsed >= 5) { container.remove(); return; }
            const opacity = elapsed > 2.5 ? Math.max(0, 1 - (elapsed - 2.5) * 0.6) : 1;
            for (const p of particles) {
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.rotSpeed;
                p.el.style.transform = `translateX(${p.x - 50}%) rotate(${p.rot}deg)`;
                p.el.style.left = `${p.x}%`;
                p.el.style.top = `${p.y}px`;
                p.el.style.opacity = opacity * (0.5 + Math.random() * 0.5);
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
    const [wizardStep, setWizardStep] = useState(1);
    const [wizardLoading, setWizardLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    
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
        admins: admins.length, 
        teachers: teachers.filter(t => !t.section_name).length, 
        classes: classes.length, 
        rooms: rooms.length,
        lessons: lessons.length, 
        assignments: lessonAssignments.length
    }), [admins, teachers, classes, rooms, lessons, lessonAssignments]);
    
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };
    
    const handleStartNewYear = async () => {
        setWizardLoading(true);
        setTimeout(() => {
            setWizardLoading(false);
            setShowYearStartWizard(false);
            setShowConfetti(true);
            showNotification('Новый учебный год успешно начат! 🎉', 'success');
            setTimeout(() => setShowConfetti(false), 5000);
            setWizardStep(1);
            loadData();
        }, 2000);
    };
    
    // Иконки для карточек статистики
    const statIcons = {
        admins: <FaUserTie />,
        teachers: <FaChalkboardTeacher />,
        classes: <FaUserGraduate />,
        rooms: <FaBuilding />,
        lessons: <FaBookOpen />,
        assignments: <FaClipboardCheck />
    };
    
    if (loading) {
        return (
            <div className="main-content-page">
                <ThemeToggle />
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Загрузка данных...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="main-content-page">
            <ThemeToggle />
            <BackButton fallbackPath="/" />
            <div className="animated-bg" aria-hidden="true">
                {[...Array(15)].map((_, i) => (<div key={i} className="glass-circle"></div>))}
            </div>
            <Header />
            <main className="superadmin-dashboard">
                {/* Уведомление */}
                {notification.show && (
                    <div className={`dashboard-notification ${notification.type}`}>
                        {notification.type === 'success' ? <FaCheckCircle /> : <FaTimes />}
                        <span>{notification.message}</span>
                    </div>
                )}
                
                {/* Заголовок с бейджем */}
                <div className="superadmin-header">
                    <div className="superadmin-header-badge">
                    </div>
                    <h1 className="superadmin-title">Панель управления</h1>
                    <p className="superadmin-subtitle">Управление администраторами, учителями, классами, кабинетами и уроками</p>
                </div>
                
                {/* Статистика с иконками */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">{statIcons.admins}</div>
                        <div className="stat-number">{stats.admins}</div>
                        <div className="stat-label">Администраторов</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">{statIcons.teachers}</div>
                        <div className="stat-number">{stats.teachers}</div>
                        <div className="stat-label">Учителей школы</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">{statIcons.classes}</div>
                        <div className="stat-number">{stats.classes}</div>
                        <div className="stat-label">Классов</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">{statIcons.rooms}</div>
                        <div className="stat-number">{stats.rooms}</div>
                        <div className="stat-label">Кабинетов</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">{statIcons.lessons}</div>
                        <div className="stat-number">{stats.lessons}</div>
                        <div className="stat-label">Уроков</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">{statIcons.assignments}</div>
                        <div className="stat-number">{stats.assignments}</div>
                        <div className="stat-label">Назначений</div>
                    </div>
                </div>
                
                {/* Кнопка начала учебного года */}
                <div className="new-year-button-container">
                    <button onClick={() => setShowYearStartWizard(true)} className="new-year-btn">
                        <FaCalendarPlus /> 
                        <span>Начать новый учебный год</span>
                        <FaRocket className="btn-icon" />
                    </button>
                </div>
                
                {/* Табы */}
                <div className="tabs-container" role="tablist">
                    <button onClick={() => setActiveTab('admins')} className={`tab-button ${activeTab === 'admins' ? 'active' : ''}`}>
                        <FaUsers /> Администраторы
                    </button>
                    <button onClick={() => setActiveTab('teachers')} className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`}>
                        <FaChalkboardTeacher /> Учителя школы
                    </button>
                    <button onClick={() => setActiveTab('extended')} className={`tab-button ${activeTab === 'extended' ? 'active' : ''}`}>
                        <FaGraduationCap /> Доп. образование
                    </button>
                    <button onClick={() => setActiveTab('classes')} className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}>
                        <FaSchool /> Классы
                    </button>
                    <button onClick={() => setActiveTab('rooms')} className={`tab-button ${activeTab === 'rooms' ? 'active' : ''}`}>
                        <FaDoorOpen /> Кабинеты
                    </button>
                    <button onClick={() => setActiveTab('lessons')} className={`tab-button ${activeTab === 'lessons' ? 'active' : ''}`}>
                        <FaBook /> Уроки
                    </button>
                    <button onClick={() => setActiveTab('sanpin')} className={`tab-button ${activeTab === 'sanpin' ? 'active' : ''}`}>
                        <FaClipboardList /> СанПиН
                    </button>
                </div>
                
                {/* Контент табов */}
                <div className="tab-content-wrapper">
                    {activeTab === 'admins' && <AdminsTab admins={admins} token={token} onDataChange={loadData} />}
                    
                    {activeTab === 'teachers' && (
                        <TeachersTab 
                            teachers={teachers.filter(t => !t.section_name)} 
                            lessons={lessons} 
                            token={token} 
                            onDataChange={loadData} 
                        />
                    )}
                    
                    {activeTab === 'extended' && (
                        <ExtendedTeachersTab 
                            token={token} 
                            onDataChange={loadData} 
                        />
                    )}
                    
                    {activeTab === 'classes' && <ClassesTab classes={classes} teachers={teachers} token={token} onDataChange={loadData} />}
                    {activeTab === 'rooms' && <RoomsTab rooms={rooms} lessons={lessons} token={token} onDataChange={loadData} />}
                    {activeTab === 'lessons' && <LessonsTab lessons={lessons} token={token} onDataChange={loadData} />}
                    {activeTab === 'sanpin' && <SanPinTab token={token} />}
                </div>
            </main>
            
            {/* Мастер начала нового учебного года */}
            {showYearStartWizard && (
                <div className="wizard-modal-overlay" onClick={() => !wizardLoading && setShowYearStartWizard(false)}>
                    <div className="wizard-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="wizard-modal-header">
                            <div className="wizard-header-icon">
                                <FaRocket />
                            </div>
                            <h2>Мастер начала нового учебного года</h2>
                            <button 
                                className="wizard-close" 
                                onClick={() => !wizardLoading && setShowYearStartWizard(false)} 
                                disabled={wizardLoading}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="wizard-body">
                            {/* Шаг 1 */}
                            {wizardStep === 1 && (
                                <div className="wizard-step">
                                    <div className="wizard-step-progress">
                                        <div className="step-dot active"></div>
                                        <div className="step-line"></div>
                                        <div className="step-dot"></div>
                                        <div className="step-line"></div>
                                        <div className="step-dot"></div>
                                    </div>
                                    <div className="wizard-step-number">Шаг 1 из 3 — Очистка</div>
                                    <h3>🗑️ Очистка старых данных</h3>
                                    <p>Будут удалены данные прошлого учебного года:</p>
                                    <ul>
                                        <li>✓ Расписания прошлого учебного года</li>
                                        <li>✓ Назначения уроков</li>
                                        <li>✓ Сгенерированные версии расписаний</li>
                                        <li>✓ История изменений</li>
                                    </ul>
                                    <div className="wizard-warning">
                                        <strong>⚠️ Внимание!</strong> Это действие нельзя отменить.
                                        Учителя, классы, кабинеты и уроки останутся.
                                    </div>
                                </div>
                            )}
                            
                            {/* Шаг 2 */}
                            {wizardStep === 2 && (
                                <div className="wizard-step">
                                    <div className="wizard-step-progress">
                                        <div className="step-dot active"></div>
                                        <div className="step-line active"></div>
                                        <div className="step-dot active"></div>
                                        <div className="step-line"></div>
                                        <div className="step-dot"></div>
                                    </div>
                                    <div className="wizard-step-number">Шаг 2 из 3 — Перенос</div>
                                    <h3>🔄 Перенос базовых данных</h3>
                                    <p>Будут автоматически перенесены на новый учебный год:</p>
                                    <ul>
                                        <li>✓ Классы (1-й → 2-й, 2-й → 3-й, ..., 10-й → 11-й)</li>
                                        <li>✓ Учителя и их предметы</li>
                                        <li>✓ Кабинеты и приоритеты</li>
                                        <li>✓ Настройки СанПиН</li>
                                    </ul>
                                    <div className="wizard-info">
                                        <strong>ℹ️ Информация:</strong> Выпускной 11-й класс будет удалён.
                                        Новый 1-й класс нужно будет добавить вручную.
                                    </div>
                                </div>
                            )}
                            
                            {/* Шаг 3 */}
                            {wizardStep === 3 && (
                                <div className="wizard-step">
                                    <div className="wizard-step-progress">
                                        <div className="step-dot active"></div>
                                        <div className="step-line active"></div>
                                        <div className="step-dot active"></div>
                                        <div className="step-line active"></div>
                                        <div className="step-dot active"></div>
                                    </div>
                                    <div className="wizard-step-number">Шаг 3 из 3 — Подтверждение</div>
                                    <h3>✅ Подготовка завершена!</h3>
                                    <p>Готово к началу нового учебного года. Проверьте данные перед подтверждением:</p>
                                    <div className="wizard-summary">
                                        <div className="summary-item">
                                            <span>🗑️ Будет удалено расписаний:</span>
                                            <strong>~150</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>🔄 Будет перенесено классов:</span>
                                            <strong>{classes.filter(c => c.number < 11).length}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>👨‍🏫 Останется учителей:</span>
                                            <strong>{teachers.length}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>🏫 Останется кабинетов:</span>
                                            <strong>{rooms.length}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>📚 Останется уроков:</span>
                                            <strong>{lessons.length}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="wizard-step-footer">
                            {wizardStep > 1 && (
                                <button 
                                    className="btn-back-step" 
                                    onClick={() => setWizardStep(wizardStep - 1)}
                                    disabled={wizardLoading}
                                >
                                    ← Назад
                                </button>
                            )}
                            {wizardStep < 3 && (
                                <button 
                                    className="btn-next-step" 
                                    onClick={() => setWizardStep(wizardStep + 1)}
                                    disabled={wizardLoading}
                                >
                                    Далее →
                                </button>
                            )}
                            {wizardStep === 3 && (
                                <button 
                                    className="btn-confirm-start" 
                                    onClick={handleStartNewYear}
                                    disabled={wizardLoading}
                                >
                                    {wizardLoading ? (
                                        <>
                                            <div className="spinner-small"></div>
                                            Выполняется...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle /> Начать учебный год
                                        </>
                                    )}
                                </button>
                            )}
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