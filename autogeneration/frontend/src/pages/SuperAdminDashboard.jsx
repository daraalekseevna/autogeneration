// SuperAdminDashboard.jsx - полная версия с мастером начала учебного года
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    FaTrash, FaCheck, FaTimes, FaUserPlus, FaChalkboardTeacher, FaSchool, 
    FaUsers, FaSync, FaSearch, FaBook, FaChevronDown, FaEdit, FaEye,
    FaDoorOpen, FaPlus, FaSave, FaExclamationTriangle, FaUpload,
    FaFileExcel, FaCalendarAlt, FaUserEdit, FaGraduationCap, FaDownload,
    FaSpinner, FaCalendarPlus, FaArrowRight, FaArrowLeft
} from 'react-icons/fa';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
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

// ============ КОМПОНЕНТ КОНФЕТТИ ============
const ConfettiEffect = () => {
    React.useEffect(() => {
        const colors = ['#21435A', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#60a5fa', '#ec4899'];
        
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
            overflow: hidden;
        `;
        document.body.appendChild(container);
        
        const particles = [];
        const count = 180;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = 5 + Math.random() * 10;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const isCircle = Math.random() > 0.6;
            const spreadX = (Math.random() - 0.5) * 16;
            
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                left: ${50 + spreadX}%;
                top: ${-20 - Math.random() * 30}px;
                opacity: ${0.5 + Math.random() * 0.5};
                border-radius: ${isCircle ? '50%' : '2px'};
                will-change: transform;
            `;
            
            container.appendChild(particle);
            
            particles.push({
                el: particle,
                x: 50 + spreadX,
                y: -20 - Math.random() * 30,
                vx: spreadX * 0.4 + (Math.random() - 0.5) * 1.5,
                vy: 2 + Math.random() * 5,
                rot: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                gravity: 0.12
            });
        }
        
        let startTime = performance.now();
        let frameId;
        
        const animate = (now) => {
            const elapsed = (now - startTime) / 1000;
            
            if (elapsed >= 4.5) {
                container.remove();
                return;
            }
            
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
        
        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            if (container.parentNode) container.remove();
        };
    }, []);
    
    return null;
};

// ============ МОДАЛЬНЫЕ ОКНА ============

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
    if (!isOpen) return null;
    return (
        <div className="confirm-modal-overlay" onClick={onClose}>
            <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
                <div className="confirm-modal-header">
                    <div className="confirm-icon"><FaExclamationTriangle /></div>
                    <h3>Подтверждение удаления</h3>
                </div>
                <div className="confirm-modal-body">
                    <p>Вы действительно хотите удалить <strong>{itemType}</strong>?</p>
                    <p className="confirm-item-name">"{itemName}"</p>
                    <p className="confirm-warning">Это действие нельзя отменить.</p>
                </div>
                <div className="confirm-modal-footer">
                    <button className="confirm-btn-cancel" onClick={onClose}>Отмена</button>
                    <button className="confirm-btn-delete" onClick={onConfirm}><FaTrash /> Удалить</button>
                </div>
            </div>
        </div>
    );
};

// ИСПРАВЛЕННОЕ МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ УРОКА
const AddLessonModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setFormData({ name: '', description: '' });
            setSaving(false);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert('Введите название урока');
            return;
        }
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            console.error('Save error:', err);
            alert(err.response?.data?.message || 'Ошибка при сохранении');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay-fixed" onClick={onClose}>
            <div className="modal-content-fixed" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header-fixed">
                    <h3><FaPlus /> Добавить урок вручную</h3>
                    <button className="modal-close-fixed" onClick={onClose} disabled={saving}>
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body-fixed">
                    <div className="form-group">
                        <label>Название урока *</label>
                        <input 
                            type="text" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="Напр: Математика" 
                            autoFocus 
                            disabled={saving}
                        />
                    </div>
                    <div className="form-group">
                        <label>Описание</label>
                        <textarea 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            placeholder="Описание урока" 
                            rows="3" 
                            disabled={saving}
                        />
                    </div>
                </div>
                <div className="modal-footer-fixed">
                    <button className="btn-cancel-modal" onClick={onClose} disabled={saving}>Отмена</button>
                    <button className="btn-save-modal" onClick={handleSubmit} disabled={saving}>
                        <FaSave /> {saving ? 'Сохранение...' : 'Добавить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ИСПРАВЛЕННОЕ МОДАЛЬНОЕ ОКНО ПРОСМОТРА УРОКА
const ViewLessonModal = ({ isOpen, onClose, onUpdate, onDelete, lesson }) => {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (lesson && isOpen) {
            setFormData({
                name: lesson.name || '',
                description: lesson.description || ''
            });
            setIsEditing(false);
            setSaving(false);
        }
    }, [lesson, isOpen]);

    const handleUpdate = async () => {
        if (!formData.name.trim()) {
            alert('Введите название урока');
            return;
        }
        setSaving(true);
        try {
            await onUpdate({ ...formData, id: lesson.id });
            setIsEditing(false);
            onClose();
        } catch (err) {
            console.error('Update error:', err);
            alert(err.response?.data?.message || 'Ошибка при обновлении');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Удалить урок "${lesson?.name}"? Это действие нельзя отменить.`)) {
            setSaving(true);
            try {
                await onDelete(lesson.id, lesson.name);
                onClose();
            } catch (err) {
                console.error('Delete error:', err);
                alert('Ошибка при удалении');
            } finally {
                setSaving(false);
            }
        }
    };

    if (!isOpen || !lesson) return null;

    return (
        <div className="modal-overlay-fixed" onClick={onClose}>
            <div className="modal-content-fixed" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                <div className={`modal-header-fixed ${isEditing ? 'editing' : ''}`} style={{ background: isEditing ? '#f59e0b' : '#21435A' }}>
                    <h3>
                        {isEditing ? <FaEdit /> : <FaBook />} 
                        {isEditing ? 'Редактирование урока' : lesson.name}
                    </h3>
                    <button className="modal-close-fixed" onClick={onClose} disabled={saving}>
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body-fixed">
                    {isEditing ? (
                        <>
                            <div className="form-group">
                                <label>Название урока *</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    disabled={saving}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Описание</label>
                                <textarea 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})} 
                                    rows="4" 
                                    disabled={saving}
                                    placeholder="Введите описание урока..."
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="lesson-detail-item">
                                <strong>Название:</strong>
                                <p>{lesson.name}</p>
                            </div>
                            <div className="lesson-detail-item">
                                <strong>Описание:</strong>
                                <p>{lesson.description || '—'}</p>
                            </div>
                            <div className="lesson-detail-item">
                                <strong>ID:</strong>
                                <p>{lesson.id}</p>
                            </div>
                            <div className="lesson-detail-item">
                                <strong>Дата создания:</strong>
                                <p>{lesson.created_at ? new Date(lesson.created_at).toLocaleString('ru-RU') : '-'}</p>
                            </div>
                        </>
                    )}
                </div>
                <div className="modal-footer-fixed">
                    {isEditing ? (
                        <>
                            <button className="btn-cancel-modal" onClick={() => setIsEditing(false)} disabled={saving}>
                                Отмена
                            </button>
                            <button className="btn-save-modal" onClick={handleUpdate} disabled={saving}>
                                <FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn-cancel-modal" onClick={onClose}>Закрыть</button>
                            <button className="btn-edit-modal" onClick={() => setIsEditing(true)} disabled={saving}>
                                <FaEdit /> Редактировать
                            </button>
                            <button className="btn-delete-modal" onClick={handleDelete} disabled={saving}>
                                <FaTrash /> Удалить
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const EditAdminModal = ({ isOpen, onClose, onSave, admin }) => {
    const [formData, setFormData] = useState({ name: '', login: '' });
    const [saving, setSaving] = useState(false);
    
    React.useEffect(() => {
        if (admin && isOpen) {
            setFormData({ name: admin.name || '', login: admin.login || '' });
        }
    }, [admin, isOpen]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (saving) return;
        
        if (!formData.name) { 
            alert('Заполните ФИО'); 
            return; 
        }
        setSaving(true);
        try {
            await onSave({ ...formData, id: admin?.id });
            onClose();
        } catch (err) {
            console.error('Save error:', err);
            alert('Ошибка при сохранении: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };
    
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !saving) {
            onClose();
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="subject-modal-overlay" onClick={handleOverlayClick}>
            <div className="subject-modal-content" style={{ maxWidth: '450px' }}>
                <div className="subject-modal-header">
                    <h3><FaUserEdit /> Редактировать администратора</h3>
                    <button className="subject-modal-close" onClick={() => !saving && onClose()}><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="room-modal-body">
                        <div className="form-group"><label>ФИО *</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={saving} /></div>
                        <div className="form-group"><label>Логин</label><input type="text" value={formData.login} disabled style={{ background: '#f0f0f0' }} /><small>Логин нельзя изменить</small></div>
                    </div>
                    <div className="room-modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            <FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditTeacherModal = ({ isOpen, onClose, onSave, teacher }) => {
    const [formData, setFormData] = useState({ lastName: '', firstName: '', middleName: '' });
    const [saving, setSaving] = useState(false);
    
    React.useEffect(() => {
        if (teacher && isOpen) {
            const parts = teacher.name?.split(' ') || [];
            setFormData({ 
                lastName: parts[0] || '', 
                firstName: parts[1] || '', 
                middleName: parts.slice(2).join(' ') || '' 
            });
        }
    }, [teacher, isOpen]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (saving) return;
        
        if (!formData.lastName || !formData.firstName) { 
            alert('Заполните фамилию и имя'); 
            return; 
        }
        setSaving(true);
        try {
            await onSave({ ...formData, id: teacher?.id });
            onClose();
        } catch (err) {
            console.error('Save error:', err);
            alert('Ошибка при сохранении: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };
    
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !saving) {
            onClose();
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="subject-modal-overlay" onClick={handleOverlayClick}>
            <div className="subject-modal-content" style={{ maxWidth: '450px' }}>
                <div className="subject-modal-header">
                    <h3><FaUserEdit /> Редактировать учителя</h3>
                    <button className="subject-modal-close" onClick={() => !saving && onClose()}><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="room-modal-body">
                        <div className="form-group"><label>Фамилия *</label><input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} disabled={saving} /></div>
                        <div className="form-group"><label>Имя *</label><input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} disabled={saving} /></div>
                        <div className="form-group"><label>Отчество</label><input type="text" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} disabled={saving} /></div>
                    </div>
                    <div className="room-modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            <FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditClassModal = ({ isOpen, onClose, onSave, classData, teachers }) => {
    const [formData, setFormData] = useState({ shift: 1, teacherId: '' });
    const [saving, setSaving] = useState(false);
    
    React.useEffect(() => {
        if (classData && isOpen) {
            setFormData({ 
                shift: classData.shift || 1, 
                teacherId: classData.teacher_id || '' 
            });
        }
    }, [classData, isOpen]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (saving) return;
        
        setSaving(true);
        try {
            await onSave({ ...formData, id: classData?.id });
            onClose();
        } catch (err) {
            console.error('Save error:', err);
            alert('Ошибка при сохранении: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };
    
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !saving) {
            onClose();
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="subject-modal-overlay" onClick={handleOverlayClick}>
            <div className="subject-modal-content" style={{ maxWidth: '450px' }}>
                <div className="subject-modal-header">
                    <h3><FaUserEdit /> Редактировать класс {classData?.name}</h3>
                    <button className="subject-modal-close" onClick={() => !saving && onClose()}><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="room-modal-body">
                        <div className="form-group">
                            <label>Смена</label>
                            <select 
                                value={formData.shift} 
                                onChange={e => setFormData({...formData, shift: parseInt(e.target.value)})}
                                disabled={saving}
                            >
                                <option value="1">1 смена</option>
                                <option value="2">2 смена</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Классный руководитель</label>
                            <select 
                                value={formData.teacherId} 
                                onChange={e => setFormData({...formData, teacherId: e.target.value})}
                                disabled={saving}
                            >
                                <option value="">Не назначен</option>
                                {teachers && teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="room-modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            <FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LessonSelectorModal = ({ isOpen, onClose, lessons, selectedIds, onSave, teacherName }) => {
    const [tempSelectedIds, setTempSelectedIds] = useState(selectedIds || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectAll, setSelectAll] = useState(false);
    const [saving, setSaving] = useState(false);
    
    React.useEffect(() => {
        if (isOpen) { 
            setTempSelectedIds(selectedIds || []); 
            setSearchTerm(''); 
            setSelectAll(false); 
        }
    }, [isOpen, selectedIds]);
    
    const lessonsArray = normalizeLessonsData(lessons);
    const filteredLessons = lessonsArray.filter(l => l && l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const toggleLesson = (lessonId) => {
        setTempSelectedIds(prev => prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);
    };
    
    const handleSelectAll = () => { 
        if (selectAll) {
            setTempSelectedIds([]); 
        } else {
            setTempSelectedIds(filteredLessons.map(l => l.id)); 
        }
        setSelectAll(!selectAll); 
    };
    
    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await onSave(tempSelectedIds);
            onClose();
        } catch (err) {
            console.error('Save error:', err);
            alert('Ошибка при сохранении: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };
    
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !saving) {
            onClose();
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="subject-modal-overlay" onClick={handleOverlayClick}>
            <div className="subject-modal-content" onClick={e => e.stopPropagation()}>
                <div className="subject-modal-header">
                    <h3><FaBook /> Выбор предметов для {teacherName}</h3>
                    <button className="subject-modal-close" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                </div>
                <div className="subject-modal-search">
                    <FaSearch className="search-icon" />
                    <input type="text" placeholder="Поиск предметов..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={saving} />
                </div>
                <div className="subject-modal-select-all">
                    <label className="select-all-label">
                        <input type="checkbox" checked={selectAll && filteredLessons.length > 0} onChange={handleSelectAll} disabled={saving} />
                        <span>Выбрать все ({filteredLessons.length})</span>
                    </label>
                </div>
                <div className="subject-modal-list">
                    {filteredLessons.length === 0 ? (
                        <div className="subject-modal-empty">
                            <FaBook />
                            <p>Нет загруженных уроков</p>
                            <small>Сначала добавьте уроки во вкладке "Уроки"</small>
                        </div>
                    ) : (
                        filteredLessons.map((lesson) => (
                            <div key={lesson.id} className="subject-modal-item">
                                <input type="checkbox" id={`lesson-${lesson.id}`} checked={tempSelectedIds.includes(lesson.id)} onChange={() => toggleLesson(lesson.id)} disabled={saving} />
                                <label htmlFor={`lesson-${lesson.id}`} className="subject-modal-item-name">{lesson.name}</label>
                            </div>
                        ))
                    )}
                </div>
                <div className="subject-modal-footer">
                    <div className="subject-modal-selected-count">Выбрано: {tempSelectedIds.length}</div>
                    <div className="subject-modal-actions">
                        <button className="subject-modal-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                        <button className="subject-modal-save" onClick={handleSave} disabled={filteredLessons.length === 0 || saving}>
                            <FaCheck /> {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RoomModal = ({ isOpen, onClose, onSave, room, lessons }) => {
    const [formData, setFormData] = useState({ number: '', name: '', priority: 0 });
    const [selectedLessons, setSelectedLessons] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    
    React.useEffect(() => {
        if (room && isOpen) {
            setFormData({ 
                number: room.number || '', 
                name: room.name || '', 
                priority: room.priority || 0 
            });
            const priorities = room.lesson_priorities || [];
            const lessonIds = priorities.map(lp => {
                const id = lp.lesson_id || lp.id;
                return typeof id === 'number' ? id : parseInt(id);
            }).filter(id => !isNaN(id));
            setSelectedLessons(lessonIds);
        } else if (!isOpen) {
            setFormData({ number: '', name: '', priority: 0 });
            setSelectedLessons([]);
            setSearchTerm('');
        }
    }, [room, isOpen]);
    
    const handleChange = (field, value) => {
        if (field === 'priority') {
            const numValue = parseInt(value) || 0;
            setFormData(prev => ({ ...prev, [field]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };
    
    const toggleLesson = (lessonId) => {
        const id = typeof lessonId === 'number' ? lessonId : parseInt(lessonId);
        setSelectedLessons(prev => 
            prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
        );
    };
    
    const handleSubmit = async () => {
        if (!formData.number) { 
            alert('Введите номер кабинета'); 
            return; 
        }
        setSaving(true);
        try {
            await onSave({ 
                number: formData.number, 
                name: formData.name, 
                priority: formData.priority || 0, 
                lessonPriorities: selectedLessons 
            });
            onClose();
        } catch (err) {
            console.error('Save error:', err);
            alert('Ошибка при сохранении: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };
    
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !saving) {
            onClose();
        }
    };
    
    const lessonsArray = normalizeLessonsData(lessons);
    const filteredLessons = lessonsArray.filter(l => l && l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!isOpen) return null;
    
    return (
        <div className="room-modal-overlay" onClick={handleOverlayClick}>
            <div className="room-modal-content" onClick={e => e.stopPropagation()}>
                <div className="room-modal-header">
                    <h3><FaDoorOpen /> {room ? 'Редактировать кабинет' : 'Новый кабинет'}</h3>
                    <button className="room-modal-close" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                </div>
                <div className="room-modal-body">
                    <div className="form-group">
                        <label>Номер кабинета *</label>
                        <input type="text" value={formData.number} onChange={(e) => handleChange('number', e.target.value)} placeholder="Напр: 101" disabled={saving} />
                    </div>
                    <div className="form-group">
                        <label>Название</label>
                        <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Напр: Кабинет математики" disabled={saving} />
                    </div>
                    <div className="form-group">
                        <label>Приоритетные уроки</label>
                        <div className="subject-priorities-search">
                            <FaSearch /><input type="text" placeholder="Поиск уроков..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={saving} />
                        </div>
                        <div className="subject-priorities-list">
                            {filteredLessons.length === 0 ? (
                                <div className="no-lessons-message">Нет загруженных уроков. Сначала добавьте уроки во вкладке "Уроки".</div>
                            ) : (
                                filteredLessons.map((lesson) => (
                                    <label key={lesson.id} className="subject-priority-item">
                                        <input type="checkbox" checked={selectedLessons.includes(lesson.id)} onChange={() => toggleLesson(lesson.id)} disabled={saving} />
                                        <span>{lesson.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                        <small>Уроки этих предметов будут рекомендоваться для этого кабинета</small>
                    </div>
                </div>
                <div className="room-modal-footer">
                    <button className="btn-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                    <button className="btn-save" onClick={handleSubmit} disabled={saving}>
                        <FaSave /> {saving ? 'Сохранение...' : (room ? 'Сохранить' : 'Добавить')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const UploadLessonsModal = ({ isOpen, onClose, onUpload, existingLessons }) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(null);

    React.useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setPreviewData([]);
            setUploading(false);
            setUploadProgress(0);
            setUploadStatus(null);
            setDragActive(false);
        }
    }, [isOpen]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.match(/\.(xlsx|xls)$/)) {
            processFile(droppedFile);
        } else {
            alert('Пожалуйста, загрузите файл Excel (.xlsx или .xls)');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.match(/\.(xlsx|xls)$/)) {
            processFile(selectedFile);
        } else if (selectedFile) {
            alert('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
        }
    };

    const processFile = (selectedFile) => {
        setFile(selectedFile);
        setUploadStatus(null);
        setUploadProgress(0);
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
                
                if (rows.length < 2) {
                    alert('Файл должен содержать заголовки и данные');
                    setFile(null);
                    return;
                }
                
                const parsedData = rows.slice(1)
                    .filter(row => row[0] && row[0].toString().trim())
                    .map(row => ({
                        name: row[0]?.toString().trim() || '',
                        description: row[1]?.toString().trim() || ''
                    }))
                    .filter(item => item.name);
                
                if (parsedData.length === 0) {
                    alert('Не найдено данных для загрузки');
                    setFile(null);
                    return;
                }
                
                setPreviewData(parsedData);
            } catch (err) {
                console.error('Error parsing Excel:', err);
                alert('Ошибка при чтении файла. Проверьте формат данных.');
                setFile(null);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Выберите файл');
            return;
        }
        
        if (previewData.length === 0) {
            alert('Нет данных для загрузки');
            return;
        }
        
        setUploading(true);
        setUploadProgress(0);
        setUploadStatus(null);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);
            
            await onUpload(formData);
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadStatus('success');
            
            setTimeout(() => {
                setFile(null);
                setPreviewData([]);
                setUploadProgress(0);
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadStatus('error');
            setUploading(false);
        } finally {
            setTimeout(() => {
                setUploading(false);
            }, 500);
        }
    };
    
    const downloadTemplate = () => {
        const wsData = [
            ['Название урока', 'Описание'],
            ['Математика', 'Алгебра и геометрия'],
            ['Русский язык', 'Грамматика и литература'],
            ['Английский язык', 'Иностранный язык'],
            ['Физика', ''],
            ['Химия', ''],
            ['Биология', ''],
            ['История', ''],
            ['География', ''],
            ['Информатика', 'Программирование и ИКТ']
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch:25}, {wch:30}];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Уроки');
        XLSX.writeFile(wb, 'template_lessons.xlsx');
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="upload-modal-overlay" onClick={onClose}>
            <div className="upload-modal-content" onClick={e => e.stopPropagation()}>
                <div className="upload-modal-header">
                    <div className="upload-header-icon">
                        <FaFileExcel />
                    </div>
                    <h3>Загрузка уроков из Excel</h3>
                    <button className="upload-modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                
                <div className="upload-modal-body">
                    <div className="upload-instructions-card">
                        <div className="instructions-header">
                            <FaFileExcel className="instructions-icon" />
                            <span>Инструкция по загрузке</span>
                        </div>
                        <ul className="instructions-list">
                            <li>Файл должен быть в формате <strong>.xlsx</strong> или <strong>.xls</strong></li>
                            <li>Первая строка — заголовки: <strong>Название урока</strong>, <strong>Описание</strong></li>
                            <li>Загруженные уроки будут добавлены к существующим</li>
                        </ul>
                        <button className="download-template-btn" onClick={downloadTemplate}>
                            <FaDownload /> Скачать шаблон Excel
                        </button>
                    </div>
                    
                    <div 
                        className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'file-selected' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            id="excel-upload"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="excel-upload" className="upload-dropzone-label">
                            {!file ? (
                                <>
                                    <FaFileExcel className="dropzone-icon" />
                                    <div className="dropzone-text">
                                        <span className="dropzone-title">Перетащите файл сюда или кликните для выбора</span>
                                        <span className="dropzone-subtitle">Поддерживаются файлы .xlsx и .xls</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <FaFileExcel className="dropzone-icon file-icon" />
                                    <div className="dropzone-text">
                                        <span className="dropzone-file-name">{file.name}</span>
                                        <span className="dropzone-file-size">{(file.size / 1024).toFixed(2)} KB</span>
                                    </div>
                                    <button 
                                        className="remove-file-btn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFile(null);
                                            setPreviewData([]);
                                            setUploadStatus(null);
                                        }}
                                    >
                                        <FaTimes />
                                    </button>
                                </>
                            )}
                        </label>
                    </div>
                    
                    {uploading && (
                        <div className="upload-progress-container">
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                            </div>
                            <span className="progress-text">{uploadProgress}%</span>
                        </div>
                    )}
                    
                    {uploadStatus === 'success' && (
                        <div className="upload-status success">
                            <FaCheck />
                            <span>Уроки успешно загружены!</span>
                        </div>
                    )}
                    
                    {uploadStatus === 'error' && (
                        <div className="upload-status error">
                            <FaExclamationTriangle />
                            <span>Ошибка при загрузке. Попробуйте снова.</span>
                        </div>
                    )}
                    
                    {previewData.length > 0 && !uploadStatus && (
                        <div className="upload-preview">
                            <div className="preview-header">
                                <span className="preview-title">
                                    <FaBook /> Предпросмотр ({previewData.length} уроков)
                                </span>
                                <span className="preview-note">Будут добавлены следующие уроки:</span>
                            </div>
                            <div className="preview-table-wrapper">
                                <table className="preview-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Название урока</th>
                                            <th>Описание</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 10).map((lesson, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td><strong>{lesson.name}</strong></td>
                                                <td>{lesson.description || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 10 && (
                                    <div className="preview-more">и ещё {previewData.length - 10} уроков...</div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {existingLessons?.length > 0 && !previewData.length && (
                        <div className="existing-lessons-card">
                            <div className="existing-header">
                                <FaBook />
                                <span>Существующие уроки ({existingLessons.length})</span>
                            </div>
                            <div className="existing-tags">
                                {existingLessons.slice(0, 15).map(lesson => (
                                    <span key={lesson.id} className="existing-lesson-tag">{lesson.name}</span>
                                ))}
                                {existingLessons.length > 15 && (
                                    <span className="existing-more">+{existingLessons.length - 15}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="upload-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Отмена</button>
                    <button 
                        className={`btn-upload ${!file || uploading ? 'disabled' : ''}`}
                        onClick={handleUpload}
                        disabled={!file || uploading}
                    >
                        {uploading ? (
                            <><FaSpinner className="spinner" /> Загрузка...</>
                        ) : (
                            <><FaUpload /> Загрузить уроки</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TeacherLessonAssignmentModal = ({ isOpen, onClose, teacher, lessons, onAssign, existingAssignments }) => {
    const [selectedLesson, setSelectedLesson] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [searchLesson, setSearchLesson] = useState('');
    
    React.useEffect(() => { 
        if (!isOpen) { 
            setSelectedLesson(''); 
            setSearchLesson(''); 
        } 
    }, [isOpen]);
    
    const filteredLessons = lessons.filter(l => l.name?.toLowerCase().includes(searchLesson.toLowerCase()));
    const availableLessons = filteredLessons.filter(l => 
        !existingAssignments?.some(a => a.lesson_id === l.id && a.teacher_id === teacher?.id)
    );
    
    const handleAssign = async () => {
        if (!selectedLesson) { 
            alert('Выберите урок'); 
            return; 
        }
        setAssigning(true);
        try { 
            await onAssign({ lesson_id: selectedLesson, teacher_id: teacher.id }); 
            setSelectedLesson(''); 
        } catch (err) { 
            console.error('Assign error:', err); 
            alert('Ошибка при назначении: ' + (err.response?.data?.message || err.message));
        } finally { 
            setAssigning(false); 
        }
    };
    
    const handleDeleteAssignment = async (assignmentId) => {
        if (window.confirm('Удалить назначение?')) {
            await onAssign({ id: assignmentId, delete: true });
        }
    };
    
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !assigning) {
            onClose();
        }
    };
    
    if (!isOpen || !teacher) return null;
    
    const teacherAssignments = existingAssignments?.filter(a => a.teacher_id === teacher.id) || [];
    
    return (
        <div className="subject-modal-overlay" onClick={handleOverlayClick}>
            <div className="subject-modal-content" style={{ maxWidth: '600px' }}>
                <div className="subject-modal-header">
                    <h3><FaCalendarAlt /> Назначение уроков для {teacher.name}</h3>
                    <button className="subject-modal-close" onClick={() => !assigning && onClose()} disabled={assigning}><FaTimes /></button>
                </div>
                <div className="room-modal-body">
                    <div className="form-group">
                        <label>Добавить урок:</label>
                        <div className="search-input">
                            <FaSearch /><input type="text" placeholder="Поиск урока..." value={searchLesson} onChange={(e) => setSearchLesson(e.target.value)} disabled={assigning} />
                        </div>
                        <select className="form-select" value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} size="4" disabled={assigning}>
                            <option value="">-- Выберите урок --</option>
                            {availableLessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.name}</option>)}
                        </select>
                        <button className="btn-save" onClick={handleAssign} disabled={!selectedLesson || assigning} style={{ marginTop: '10px', width: '100%' }}>
                            {assigning ? 'Назначение...' : <><FaCheck /> Назначить урок</>}
                        </button>
                    </div>
                    
                    {teacherAssignments.length > 0 && (
                        <div className="existing-assignments">
                            <p><strong>Назначенные уроки ({teacherAssignments.length}):</strong></p>
                            <div className="assignments-list">
                                {teacherAssignments.map(assign => (
                                    <div key={assign.id} className="assignment-item">
                                        <span className="assignment-lesson">{assign.lesson_name}</span>
                                        <button 
                                            onClick={() => handleDeleteAssignment(assign.id)}
                                            className="delete-button"
                                            style={{ marginLeft: 'auto', padding: '4px 8px' }}
                                            title="Удалить назначение"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="room-modal-footer">
                    <button className="btn-cancel" onClick={() => !assigning && onClose()} disabled={assigning}>Закрыть</button>
                </div>
            </div>
        </div>
    );
};

// ============ ОСНОВНОЙ КОМПОНЕНТ ============

const SuperAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('admins');
    const [admins, setAdmins] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [lessonAssignments, setLessonAssignments] = useState([]);
    const [notification, setNotification] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [lessonSelectorModalOpen, setLessonSelectorModalOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [tempLessonIds, setTempLessonIds] = useState([]);
    const [roomModalOpen, setRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [uploadLessonsModalOpen, setUploadLessonsModalOpen] = useState(false);
    const [addLessonModalOpen, setAddLessonModalOpen] = useState(false);
    const [viewLessonModalOpen, setViewLessonModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [teacherAssignmentModalOpen, setTeacherAssignmentModalOpen] = useState(false);
    const [selectedTeacherForAssignment, setSelectedTeacherForAssignment] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, itemId: null, itemName: '', itemType: '' });
    
    const [editAdminModalOpen, setEditAdminModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [editTeacherModalOpen, setEditTeacherModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [editClassModalOpen, setEditClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    
    const [newAdmin, setNewAdmin] = useState({ login: '', password: '', name: '' });
    const [newTeacher, setNewTeacher] = useState({ lastName: '', firstName: '', middleName: '', lessonIds: [], login: '', password: '' });
    const [newClass, setNewClass] = useState({ number: '', letter: '', shift: 1, teacherId: '', login: '', password: '' });

    // Состояния для массового выбора уроков
    const [selectedLessons, setSelectedLessons] = useState([]);
    const [selectAllLessons, setSelectAllLessons] = useState(false);

    // ============ СОСТОЯНИЯ ДЛЯ МАСТЕРА НОВОГО УЧЕБНОГО ГОДА ============
    const [showYearStartWizard, setShowYearStartWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [graduationDone, setGraduationDone] = useState(false);
    const [promotionDone, setPromotionDone] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [fifthClasses, setFifthClasses] = useState([]);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [fifthClassAssignments, setFifthClassAssignments] = useState({});
    const [firstClasses, setFirstClasses] = useState([]);
    const [firstClassAssignments, setFirstClassAssignments] = useState({});
    const [finalPreview, setFinalPreview] = useState([]);
    const [editingFinalPreview, setEditingFinalPreview] = useState({});
    const [wizardLoading, setWizardLoading] = useState(false);
    const [allTeachersForSelect, setAllTeachersForSelect] = useState([]);
    const [showAddClassModal, setShowAddClassModal] = useState(false);
    const [newClassLetter, setNewClassLetter] = useState('');
    const [newClassTeacherId, setNewClassTeacherId] = useState('');

    const token = localStorage.getItem('token');

    React.useEffect(() => { 
        if (!token) window.location.href = '/login'; 
    }, [token]);

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [adminsRes, teachersRes, classesRes, roomsRes, lessonsRes, assignmentsRes] = await Promise.all([
                axios.get(`${API_URL}/superadmin/admins`, config),
                axios.get(`${API_URL}/superadmin/teachers`, config),
                axios.get(`${API_URL}/superadmin/classes`, config),
                axios.get(`${API_URL}/superadmin/rooms`, config),
                axios.get(`${API_URL}/superadmin/lessons`, config).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/superadmin/lesson-assignments`, config).catch(() => ({ data: [] }))
            ]);
            setAdmins(Array.isArray(adminsRes.data) ? adminsRes.data : []);
            setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
            setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
            
            const roomsData = Array.isArray(roomsRes.data) ? roomsRes.data : [];
            setRooms(roomsData);
            
            setLessons(normalizeLessonsData(lessonsRes.data));
            setLessonAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
            setSelectedLessons([]);
            setSelectAllLessons(false);
        } catch (err) {
            console.error('Load error:', err);
            showNotification('Ошибка загрузки данных');
            if (err.response?.status === 401) { 
                localStorage.removeItem('token'); 
                window.location.href = '/login'; 
            }
        } finally { 
            setLoading(false); 
        }
    }, [token]);

    React.useEffect(() => { 
        loadData(); 
    }, [loadData]);

    const showNotification = (message) => { 
        setNotification(message); 
        setTimeout(() => setNotification(''), 3000); 
    };

    const clearAdminForm = () => setNewAdmin({ login: '', password: '', name: '' });
    const clearTeacherForm = () => setNewTeacher({ lastName: '', firstName: '', middleName: '', lessonIds: [], login: '', password: '' });
    const clearClassForm = () => setNewClass({ number: '', letter: '', shift: 1, teacherId: '', login: '', password: '' });

    // Функции для массового выбора уроков
    const handleToggleLessonSelection = (lessonId) => {
        setSelectedLessons(prev => 
            prev.includes(lessonId) 
                ? prev.filter(id => id !== lessonId)
                : [...prev, lessonId]
        );
        setSelectAllLessons(false);
    };

    const handleSelectAllLessons = () => {
        if (selectAllLessons) {
            setSelectedLessons([]);
        } else {
            setSelectedLessons(lessons.map(l => l.id));
        }
        setSelectAllLessons(!selectAllLessons);
    };

    const handleBulkDeleteLessons = async () => {
        if (selectedLessons.length === 0) {
            showNotification('Выберите уроки для удаления');
            return;
        }
        
        if (!window.confirm(`Удалить ${selectedLessons.length} урок(ов)? Это действие нельзя отменить.`)) return;
        
        try {
            await axios.delete(`${API_URL}/superadmin/lessons/bulk`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { ids: selectedLessons }
            });
            
            showNotification(`Удалено ${selectedLessons.length} уроков`);
            setSelectedLessons([]);
            setSelectAllLessons(false);
            loadData();
        } catch (err) {
            console.error('Bulk delete error:', err);
            showNotification('Ошибка при удалении');
        }
    };

    const handleExportLessons = async () => {
        try {
            const response = await axios.get(`${API_URL}/superadmin/lessons/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'lessons_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showNotification('Экспорт выполнен успешно');
        } catch (err) {
            console.error('Export lessons error:', err);
            showNotification('Ошибка при экспорте');
        }
    };

    // АДМИНИСТРАТОРЫ
    const handleAddAdmin = async (e) => {
        e.preventDefault();
        if (!newAdmin.login || !newAdmin.password || !newAdmin.name) {
            showNotification('Заполните все поля');
            return;
        }
        try {
            await axios.post(`${API_URL}/superadmin/admins`, newAdmin, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Администратор добавлен');
            clearAdminForm();
            loadData();
        } catch (err) {
            console.error('Add admin error:', err);
            showNotification(err.response?.data?.message || 'Ошибка');
        }
    };

    const handleUpdateAdmin = async (adminData) => {
        try {
            await axios.put(`${API_URL}/superadmin/admins/${adminData.id}`, adminData, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            showNotification('Администратор обновлен');
            loadData();
        } catch (err) {
            console.error('Update admin error:', err);
            showNotification(err.response?.data?.message || 'Ошибка обновления');
            throw err;
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm('Удалить администратора?')) return;
        try {
            await axios.delete(`${API_URL}/superadmin/admins/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Администратор удалён');
            loadData();
        } catch (err) {
            console.error('Delete admin error:', err);
            showNotification('Ошибка удаления');
        }
    };

    // УЧИТЕЛЯ
    const openLessonSelectorModal = (teacher = null) => {
        if (teacher) { 
            setCurrentTeacher(teacher); 
            setTempLessonIds(teacher.lessonIds || []); 
        } else { 
            setCurrentTeacher(null); 
            setTempLessonIds(newTeacher.lessonIds); 
        }
        setLessonSelectorModalOpen(true);
    };

    const handleSaveLessons = async (selectedIds) => {
        if (currentTeacher) {
            try {
                await axios.put(`${API_URL}/superadmin/teachers/${currentTeacher.id}`, { lessonIds: selectedIds }, { headers: { Authorization: `Bearer ${token}` } });
                showNotification('Предметы обновлены');
                loadData();
            } catch (err) {
                console.error('Update lessons error:', err);
                showNotification('Ошибка обновления предметов');
                throw err;
            }
        } else {
            setNewTeacher(prev => ({ ...prev, lessonIds: selectedIds }));
        }
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        if (!newTeacher.lastName || !newTeacher.firstName || !newTeacher.login || !newTeacher.password) {
            showNotification('Заполните фамилию, имя, логин и пароль');
            return;
        }
        try {
            await axios.post(`${API_URL}/superadmin/teachers`, newTeacher, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Учитель добавлен');
            clearTeacherForm();
            loadData();
        } catch (err) {
            console.error('Add teacher error:', err);
            showNotification(err.response?.data?.message || 'Ошибка');
        }
    };

    const handleUpdateTeacher = async (teacherData) => {
        try {
            await axios.put(`${API_URL}/superadmin/teachers/${teacherData.id}`, teacherData, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            showNotification('Учитель обновлен');
            loadData();
        } catch (err) {
            console.error('Update teacher error:', err);
            showNotification(err.response?.data?.message || 'Ошибка обновления');
            throw err;
        }
    };

    const handleDeleteTeacher = async (id) => {
        if (!window.confirm('Удалить учителя?')) return;
        try {
            await axios.delete(`${API_URL}/superadmin/teachers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Учитель удалён');
            loadData();
        } catch (err) {
            console.error('Delete teacher error:', err);
            showNotification('Ошибка удаления');
        }
    };

    // НАЗНАЧЕНИЕ УРОКОВ УЧИТЕЛЮ
    const handleAssignLessonToTeacher = async (assignment) => {
        if (assignment.delete) {
            try {
                await axios.delete(`${API_URL}/superadmin/lesson-assignments/${assignment.id}`, { headers: { Authorization: `Bearer ${token}` } });
                showNotification('Назначение удалено');
                loadData();
            } catch (err) {
                console.error('Delete assignment error:', err);
                showNotification('Ошибка удаления');
            }
        } else {
            try {
                await axios.post(`${API_URL}/superadmin/lesson-assignments`, assignment, { headers: { Authorization: `Bearer ${token}` } });
                showNotification('Урок назначен учителю');
                loadData();
            } catch (err) {
                console.error('Assign lesson error:', err);
                showNotification(err.response?.data?.message || 'Ошибка назначения');
                throw err;
            }
        }
    };

    // КЛАССЫ
    const handleAddClass = async (e) => {
        e.preventDefault();
        if (!newClass.number || !newClass.letter || !newClass.login || !newClass.password) {
            showNotification('Заполните номер, букву, логин и пароль');
            return;
        }
        try {
            await axios.post(`${API_URL}/superadmin/classes`, newClass, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Класс добавлен');
            clearClassForm();
            loadData();
        } catch (err) {
            console.error('Add class error:', err);
            showNotification(err.response?.data?.message || 'Ошибка');
        }
    };

    const handleUpdateClass = async (classData) => {
        try {
            const response = await axios.put(`${API_URL}/superadmin/classes/${classData.id}`, classData, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            showNotification('Класс обновлен');
            loadData();
            return response;
        } catch (err) {
            console.error('Update class error:', err);
            showNotification(err.response?.data?.message || 'Ошибка обновления');
            throw err;
        }
    };

    const handleChangeShift = async (classId, currentShift) => {
        const newShift = currentShift === 1 ? 2 : 1;
        try {
            await axios.put(`${API_URL}/superadmin/classes/${classId}`, { shift: newShift }, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Смена изменена');
            loadData();
        } catch (err) {
            console.error('Change shift error:', err);
            showNotification('Ошибка');
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm('Удалить класс?')) return;
        try {
            await axios.delete(`${API_URL}/superadmin/classes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Класс удалён');
            loadData();
        } catch (err) {
            console.error('Delete class error:', err);
            showNotification('Ошибка удаления');
        }
    };

    // КАБИНЕТЫ
    const openDeleteConfirm = (id, name) => setConfirmModal({ isOpen: true, itemId: id, itemName: name, itemType: 'кабинет' });
    
    const handleDeleteRoom = async () => {
        const { itemId, itemName } = confirmModal;
        try {
            await axios.delete(`${API_URL}/superadmin/rooms/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
            showNotification(`Кабинет "${itemName}" удалён`);
            loadData();
            setConfirmModal({ isOpen: false, itemId: null, itemName: '', itemType: '' });
        } catch (err) {
            console.error('Delete room error:', err);
            showNotification('Ошибка удаления');
        }
    };
    
    const handleAddRoom = async (roomData) => {
        try {
            const payload = {
                number: String(roomData.number).trim(),
                name: roomData.name || '',
                priority: parseInt(roomData.priority) || 0,
                lessonPriorities: Array.isArray(roomData.lessonPriorities) 
                    ? roomData.lessonPriorities.map(id => parseInt(id)).filter(id => !isNaN(id))
                    : []
            };
            
            await axios.post(`${API_URL}/superadmin/rooms`, payload, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            showNotification('Кабинет добавлен');
            loadData();
            setRoomModalOpen(false);
            setEditingRoom(null);
        } catch (err) {
            console.error('Add room error:', err);
            showNotification(err.response?.data?.message || 'Ошибка добавления');
        }
    };
    
    const handleUpdateRoom = async (roomData) => {
        try {
            const payload = {
                number: String(roomData.number).trim(),
                name: roomData.name || '',
                priority: parseInt(roomData.priority) || 0,
                lessonPriorities: Array.isArray(roomData.lessonPriorities) 
                    ? roomData.lessonPriorities.map(id => parseInt(id)).filter(id => !isNaN(id))
                    : []
            };
            
            await axios.put(`${API_URL}/superadmin/rooms/${editingRoom.id}`, payload, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            showNotification('Кабинет обновлен');
            loadData();
            setRoomModalOpen(false);
            setEditingRoom(null);
        } catch (err) {
            console.error('Update room error:', err);
            showNotification(err.response?.data?.message || 'Ошибка обновления');
        }
    };
    
    const handleSaveRoom = async (roomData) => {
        if (editingRoom) {
            await handleUpdateRoom(roomData);
        } else {
            await handleAddRoom(roomData);
        }
    };
    
    const openRoomModal = (room = null) => { 
        setEditingRoom(room); 
        setRoomModalOpen(true); 
    };

    // УРОКИ
    const handleAddLessonManually = async (lessonData) => {
        try {
            await axios.post(`${API_URL}/superadmin/lessons`, lessonData, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Урок добавлен');
            loadData();
        } catch (err) {
            console.error('Add lesson error:', err);
            showNotification(err.response?.data?.message || 'Ошибка добавления урока');
            throw err;
        }
    };

    const handleUpdateLesson = async (lessonData) => {
        try {
            await axios.put(`${API_URL}/superadmin/lessons/${lessonData.id}`, lessonData, { headers: { Authorization: `Bearer ${token}` } });
            showNotification('Урок обновлен');
            loadData();
        } catch (err) {
            console.error('Update lesson error:', err);
            showNotification('Ошибка обновления урока');
            throw err;
        }
    };

    const handleUploadLessons = async (formData) => {
        try {
            const response = await axios.post(`${API_URL}/superadmin/lessons/upload`, formData, { 
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } 
            });
            showNotification(response.data?.message || 'Уроки успешно загружены');
            loadData();
            return response;
        } catch (err) {
            console.error('Upload lessons error:', err);
            showNotification(err.response?.data?.message || 'Ошибка загрузки уроков');
            throw err;
        }
    };

    const handleDeleteLesson = async (id, name) => {
        if (!window.confirm(`Удалить урок "${name}"?`)) return;
        try {
            await axios.delete(`${API_URL}/superadmin/lessons/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            showNotification(`Урок "${name}" удалён`);
            loadData();
        } catch (err) {
            console.error('Delete lesson error:', err);
            showNotification('Ошибка удаления');
        }
    };

    // ============ ФУНКЦИИ МАСТЕРА НОВОГО УЧЕБНОГО ГОДА ============

    const openYearStartWizard = () => {
        setShowYearStartWizard(true);
        setWizardStep(0);
        setGraduationDone(false);
        setPromotionDone(false);
        setFifthClasses([]);
        setAvailableTeachers([]);
        setFifthClassAssignments({});
        setFirstClasses([]);
        setFirstClassAssignments({});
        setFinalPreview([]);
        setEditingFinalPreview({});
        setAllTeachersForSelect([]);
    };

    // ШАГ 1: Выпустить 11 классы
    const handleGraduate11Classes = async () => {
        setWizardLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/superadmin/graduate-11-classes`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setGraduationDone(true);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            showNotification(response.data.message);
            
        } catch (err) {
            console.error('Graduate error:', err);
            showNotification(err.response?.data?.message || 'Ошибка');
        } finally {
            setWizardLoading(false);
        }
    };

    // ШАГ 2: Перевести все классы на следующий уровень
    const handlePromoteAllClasses = async () => {
        setWizardLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/superadmin/promote-all-classes`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setPromotionDone(true);
            showNotification(response.data.message);
            
            const fifthRes = await axios.get(
                `${API_URL}/superadmin/fifth-classes-for-assign`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFifthClasses(fifthRes.data);
            
            const teachersRes = await axios.get(
                `${API_URL}/superadmin/available-teachers-for-fifth`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAvailableTeachers(teachersRes.data);
            
            const allTeachersRes = await axios.get(
                `${API_URL}/superadmin/all-teachers-for-select`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAllTeachersForSelect(allTeachersRes.data);
            
            const initialAssignments = {};
            fifthRes.data.forEach(cls => {
                initialAssignments[cls.id] = cls.teacher_id || '';
            });
            setFifthClassAssignments(initialAssignments);
            
        } catch (err) {
            console.error('Promote error:', err);
            showNotification(err.response?.data?.message || 'Ошибка');
        } finally {
            setWizardLoading(false);
        }
    };

    // ШАГ 3: Назначить НОВЫХ руководителей для 5 классов + запомнить ОСВОБОДИВШИХСЯ
    const handleAssignFifthClassTeachers = async () => {
        setWizardLoading(true);
        try {
            const assignments = Object.entries(fifthClassAssignments)
                .filter(([_, teacherId]) => teacherId && teacherId !== '')
                .map(([classId, teacherId]) => ({
                    classId: parseInt(classId),
                    teacherId: parseInt(teacherId)
                }));
            
            const response = await axios.post(
                `${API_URL}/superadmin/assign-fifth-class-teachers`,
                { assignments },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            showNotification(response.data.message);
            
            const releasedTeachers = response.data.releasedTeachers || [];
            
            console.log('📌 Создание новых 1 классов...');
            await axios.post(
                `${API_URL}/superadmin/create-first-classes`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log('📌 Загрузка списка 1 классов...');
            const firstClassesRes = await axios.get(
                `${API_URL}/superadmin/first-classes`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFirstClasses(firstClassesRes.data);
            
            console.log('📌 Освободившиеся учителя (которых заменили):', releasedTeachers);
            
            const autoAssignments = {};
            firstClassesRes.data.forEach(cls => {
                const letter = cls.letter;
                const releasedTeacher = releasedTeachers.find(t => t.letter === letter);
                if (releasedTeacher && releasedTeacher.teacher_id) {
                    autoAssignments[cls.id] = releasedTeacher.teacher_id;
                    console.log(`✅ НОВЫЙ ${cls.name} -> освободившийся учитель ${releasedTeacher.teacher_name}`);
                } else {
                    autoAssignments[cls.id] = '';
                    console.log(`❌ НОВЫЙ ${cls.name} - нет освободившегося учителя для буквы ${letter}`);
                }
            });
            setFirstClassAssignments(autoAssignments);
            
            setWizardStep(3);
            
        } catch (err) {
            console.error('Assign fifth class error:', err);
            showNotification(err.response?.data?.message || 'Ошибка');
        } finally {
            setWizardLoading(false);
        }
    };
    
    // Удалить 1 класс
    const handleDeleteFirstClass = async (classId, className) => {
        if (!window.confirm(`Удалить класс ${className}?`)) return;
        
        setWizardLoading(true);
        try {
            await axios.delete(
                `${API_URL}/superadmin/delete-first-class/${classId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            showNotification(`Класс ${className} удалён`);
            
            const firstClassesRes = await axios.get(
                `${API_URL}/superadmin/first-classes`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFirstClasses(firstClassesRes.data);
            
            const newAssignments = {};
            firstClassesRes.data.forEach(cls => {
                newAssignments[cls.id] = firstClassAssignments[cls.id] || '';
            });
            setFirstClassAssignments(newAssignments);
            
        } catch (err) {
            console.error('Delete first class error:', err);
            showNotification(err.response?.data?.message || 'Ошибка удаления');
        } finally {
            setWizardLoading(false);
        }
    };

    // Добавить новый 1 класс
    const handleAddFirstClass = async () => {
        if (!newClassLetter) {
            alert('Введите букву класса');
            return;
        }
        
        setWizardLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/superadmin/add-first-class`,
                { letter: newClassLetter.toUpperCase(), teacherId: newClassTeacherId || null },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            showNotification(response.data.message);
            setShowAddClassModal(false);
            setNewClassLetter('');
            setNewClassTeacherId('');
            
            const firstClassesRes = await axios.get(
                `${API_URL}/superadmin/first-classes`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFirstClasses(firstClassesRes.data);
            
            const newAssignments = {};
            firstClassesRes.data.forEach(cls => {
                newAssignments[cls.id] = firstClassAssignments[cls.id] || '';
            });
            setFirstClassAssignments(newAssignments);
            
        } catch (err) {
            console.error('Add first class error:', err);
            showNotification(err.response?.data?.message || 'Ошибка добавления');
        } finally {
            setWizardLoading(false);
        }
    };

    // Функция для сохранения назначений 1 классов и перехода к финальному шагу
    const handleSaveFirstClassAssignments = async () => {
        setWizardLoading(true);
        try {
            const assignments = Object.entries(firstClassAssignments)
                .filter(([_, teacherId]) => teacherId && teacherId !== '')
                .map(([classId, teacherId]) => ({
                    classId: parseInt(classId),
                    teacherId: parseInt(teacherId)
                }));
            
            if (assignments.length > 0) {
                await axios.post(
                    `${API_URL}/superadmin/assign-first-class-teachers`,
                    { assignments },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            
            const classesRes = await axios.get(
                `${API_URL}/superadmin/classes`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setFinalPreview(classesRes.data);
            
            const initialPreview = {};
            classesRes.data.forEach(cls => {
                initialPreview[cls.id] = cls.teacher_id || '';
            });
            setEditingFinalPreview(initialPreview);
            
            setWizardStep(4);
            
        } catch (err) {
            console.error('Save first class assignments error:', err);
            showNotification(err.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setWizardLoading(false);
        }
    };

    // ШАГ 5: Сохранить финальные изменения
    const handleFinalSave = async () => {
        setWizardLoading(true);
        try {
            const finalAssignments = Object.entries(editingFinalPreview)
                .filter(([_, teacherId]) => teacherId && teacherId !== '')
                .map(([classId, teacherId]) => ({
                    classId: parseInt(classId),
                    teacherId: parseInt(teacherId)
                }));
            
            if (finalAssignments.length > 0) {
                await axios.post(
                    `${API_URL}/superadmin/save-final-assignments`,
                    { assignments: finalAssignments },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
            showNotification('Новый учебный год успешно начат! 🎉');
            setShowYearStartWizard(false);
            loadData();
            
        } catch (err) {
            console.error('Final save error:', err);
            showNotification(err.response?.data?.message || 'Ошибка');
        } finally {
            setWizardLoading(false);
        }
    };

    const updateFinalAssignment = (classId, teacherId) => {
        setEditingFinalPreview(prev => ({
            ...prev,
            [classId]: teacherId
        }));
    };

    const stats = useMemo(() => ({
        admins: admins.length, 
        teachers: teachers.length, 
        classes: classes.length, 
        rooms: rooms.length,
        lessons: lessons.length, 
        assignments: lessonAssignments.length,
        classesWithoutTeacher: classes.filter(c => !c.teacher_name).length,
        shift1: classes.filter(c => c.shift === 1).length, 
        shift2: classes.filter(c => c.shift === 2).length
    }), [admins, teachers, classes, rooms, lessons, lessonAssignments]);

    if (loading) {
        return (
            <div className="main-content-page">
                <ThemeToggle />
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content-page">
            <ThemeToggle />
            <BackButton fallbackPath="/" />
            <div className="animated-bg" aria-hidden="true">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>
            <Header />
            <main className="superadmin-container">
                {notification && <div className="notification" role="alert">{notification}</div>}
                
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
                    <button onClick={openYearStartWizard} className="new-year-btn">
                        <FaCalendarPlus /> Начать новый учебный год
                    </button>
                </div>

                <div className="tabs-container" role="tablist">
                    <button onClick={() => setActiveTab('admins')} className={`tab-button ${activeTab === 'admins' ? 'active' : ''}`}><FaUsers /> Администраторы</button>
                    <button onClick={() => setActiveTab('teachers')} className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`}><FaChalkboardTeacher /> Учителя</button>
                    <button onClick={() => setActiveTab('classes')} className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}><FaSchool /> Классы</button>
                    <button onClick={() => setActiveTab('rooms')} className={`tab-button ${activeTab === 'rooms' ? 'active' : ''}`}><FaDoorOpen /> Кабинеты</button>
                    <button onClick={() => setActiveTab('lessons')} className={`tab-button ${activeTab === 'lessons' ? 'active' : ''}`}><FaBook /> Уроки</button>
                </div>

                {/* Администраторы */}
                {activeTab === 'admins' && (
                    <div className="content-grid">
                        <div className="form-container">
                            <h3 className="form-title"><FaUserPlus /> Новый администратор</h3>
                            <form onSubmit={handleAddAdmin}>
                                <div className="form-group"><label>Логин *</label><input type="text" value={newAdmin.login} onChange={(e) => setNewAdmin({...newAdmin, login: e.target.value})} required /></div>
                                <div className="form-group"><label>Пароль *</label><input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})} required /></div>
                                <div className="form-group"><label>ФИО *</label><input type="text" value={newAdmin.name} onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})} required /></div>
                                <button type="submit" className="submit-button">Добавить администратора</button>
                            </form>
                        </div>
                        <div className="table-container">
                            <h3 className="table-title"><FaUsers /> Список администраторов ({admins.length})</h3>
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Логин</th><th>ФИО</th><th>Действия</th></tr>
                                    </thead>
                                    <tbody>
                                        {admins.map(a => (
                                            <tr key={a.id}>
                                                <td>{a.login}</td>
                                                <td>{a.name}</td>
                                                <td className="action-cell">
                                                    <button onClick={() => { setEditingAdmin(a); setEditAdminModalOpen(true); }} className="action-button edit-button"><FaEdit /></button>
                                                    <button onClick={() => handleDeleteAdmin(a.id)} className="action-button delete-button"><FaTrash /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {admins.length === 0 && (
                                            <tr><td colSpan="3" className="empty-row"><FaUsers /><p>Нет администраторов</p></td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Учителя */}
                {activeTab === 'teachers' && (
                    <div className="content-grid">
                        <div className="form-container">
                            <h3 className="form-title"><FaUserPlus /> Новый учитель</h3>
                            <form onSubmit={handleAddTeacher}>
                                <div className="form-row">
                                    <div className="form-group"><label>Фамилия *</label><input type="text" value={newTeacher.lastName} onChange={e => setNewTeacher({...newTeacher, lastName: e.target.value})} required /></div>
                                    <div className="form-group"><label>Имя *</label><input type="text" value={newTeacher.firstName} onChange={e => setNewTeacher({...newTeacher, firstName: e.target.value})} required /></div>
                                </div>
                                <div className="form-group"><label>Отчество</label><input type="text" value={newTeacher.middleName} onChange={e => setNewTeacher({...newTeacher, middleName: e.target.value})} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>Логин *</label><input type="text" value={newTeacher.login} onChange={e => setNewTeacher({...newTeacher, login: e.target.value})} required /></div>
                                    <div className="form-group"><label>Пароль *</label><input type="password" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} required /></div>
                                </div>
                                <div className="form-group">
                                    <label>Предметы</label>
                                    <div className="subject-selector-button" onClick={() => openLessonSelectorModal(null)}>
                                        <div className="subject-selector-content">
                                            <FaBook className="subject-selector-icon" />
                                            <span style={{ color: 'white' }}>{newTeacher.lessonIds.length === 0 ? 'Выберите предметы...' : `Выбрано: ${newTeacher.lessonIds.length}`}</span>
                                        </div>
                                        <FaChevronDown className="subject-selector-arrow" />
                                    </div>
                                    {newTeacher.lessonIds.length > 0 && (
                                        <div className="subject-preview">
                                            {newTeacher.lessonIds.map(id => {
                                                const lesson = lessons.find(l => l.id === id);
                                                return lesson ? <span key={id} className="subject-preview-tag">{lesson.name}</span> : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="submit-button">Добавить учителя</button>
                            </form>
                        </div>
                        <div className="table-container">
                            <h3 className="table-title"><FaChalkboardTeacher /> Список учителей ({teachers.length})</h3>
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ФИО</th>
                                            <th>Предметы</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teachers.map(teacher => (
                                            <tr key={teacher.id}>
                                                <td>{teacher.name}</td>
                                                <td>
                                                    <div className="subjects-tags">
                                                        {teacher.lessons?.length > 0 ? 
                                                            teacher.lessons.map((l, i) => <span key={i} className="subject-tag">{l.name}</span>) :
                                                        teacher.lessonIds?.length > 0 ?
                                                            teacher.lessonIds.map(id => {
                                                                const lesson = lessons.find(l => l.id === id);
                                                                return lesson ? <span key={id} className="subject-tag">{lesson.name}</span> : null;
                                                            }) :
                                                            <span className="no-subjects">Нет предметов</span>
                                                        }
                                                        <button className="edit-subjects-btn" onClick={() => openLessonSelectorModal(teacher)}><FaEdit /> Изменить</button>
                                                    </div>
                                                </td>
                                                <td className="action-cell">
                                                    <button onClick={() => { setEditingTeacher(teacher); setEditTeacherModalOpen(true); }} className="action-button edit-button"><FaEdit /></button>
                                                    <button onClick={() => handleDeleteTeacher(teacher.id)} className="action-button delete-button"><FaTrash /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {teachers.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="empty-row">
                                                    <FaChalkboardTeacher />
                                                    <p>Нет учителей</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Классы */}
                {activeTab === 'classes' && (
                    <div className="content-grid">
                        <div className="form-container">
                            <h3 className="form-title"><FaUserPlus /> Новый класс</h3>
                            <form onSubmit={handleAddClass}>
                                <div className="form-row">
                                    <div className="form-group"><label>Номер *</label><input type="number" min="1" max="11" value={newClass.number} onChange={e => setNewClass({...newClass, number: e.target.value})} required /></div>
                                    <div className="form-group"><label>Буква *</label><input type="text" maxLength="1" value={newClass.letter} onChange={e => setNewClass({...newClass, letter: e.target.value.toUpperCase()})} required /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Логин *</label><input type="text" value={newClass.login} onChange={e => setNewClass({...newClass, login: e.target.value})} required /></div>
                                    <div className="form-group"><label>Пароль *</label><input type="password" value={newClass.password} onChange={e => setNewClass({...newClass, password: e.target.value})} required /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Смена</label><select value={newClass.shift} onChange={e => setNewClass({...newClass, shift: parseInt(e.target.value)})}><option value="1">1 смена</option><option value="2">2 смена</option></select></div>
                                    <div className="form-group"><label>Руководитель</label><select value={newClass.teacherId} onChange={e => setNewClass({...newClass, teacherId: e.target.value})}><option value="">Не назначен</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                                </div>
                                <button type="submit" className="submit-button">Добавить класс</button>
                            </form>
                        </div>
                        <div className="table-container">
                            <h3 className="table-title"><FaSchool /> Список классов ({classes.length})</h3>
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Класс</th>
                                            <th>Смена</th>
                                            <th>Руководитель</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classes.map(c => (
                                            <tr key={c.id}>
                                                <td><FaGraduationCap /> {c.name}</td>
                                                <td><span className={`shift-badge shift-${c.shift}`}>{c.shift} смена</span></td>
                                                <td>{c.teacher_name || 'Не назначен'}</td>
                                                <td className="action-cell">
                                                    <button onClick={() => { setEditingClass(c); setEditClassModalOpen(true); }} className="action-button edit-button"><FaEdit /></button>
                                                    <button onClick={() => handleChangeShift(c.id, c.shift)} className="action-button shift-button"><FaSync /></button>
                                                    <button onClick={() => handleDeleteClass(c.id)} className="action-button delete-button"><FaTrash /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {classes.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="empty-row">
                                                    <FaSchool />
                                                    <p>Нет классов</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="shift-stats">
                                <div className="shift-stat"><div className="shift-stat-number shift-stat-1">{stats.shift1}</div><div>1 смена</div></div>
                                <div className="shift-stat"><div className="shift-stat-number shift-stat-2">{stats.shift2}</div><div>2 смена</div></div>
                            </div>
                            {stats.classesWithoutTeacher > 0 && (<div className="warning-box"><strong>Внимание!</strong> {stats.classesWithoutTeacher} класс(ов) без руководителя</div>)}
                        </div>
                    </div>
                )}
                {/* Кабинеты */}
                {activeTab === 'rooms' && (
                    <div className="rooms-container-table">
                        <div className="rooms-header">
                            <button className="add-room-btn" onClick={() => openRoomModal(null)}>
                                <FaPlus /> Добавить кабинет
                            </button>
                        </div>
                        <div className="table-container">
                            <h3 className="table-title"><FaDoorOpen /> Список кабинетов ({rooms.length})</h3>
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>№</th>
                                            <th>Название</th>
                                            <th>Приоритетные предметы</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rooms.length > 0 ? (
                                            rooms.map(room => {
                                                const priorities = room.lesson_priorities || [];
                                                return (
                                                    <tr key={room.id}>
                                                        <td><strong>{room.number}</strong></td>
                                                        <td>{room.name || '-'}</td>
                                                        <td>
                                                            <div className="priority-subjects-list">
                                                                {priorities.length > 0 ? (
                                                                    priorities.map((lp, i) => {
                                                                        const subjectName = lp.lesson_name || lp.name;
                                                                        return subjectName ? (
                                                                            <span key={i} className="priority-subject-tag">{subjectName}</span>
                                                                        ) : null;
                                                                    })
                                                                ) : (
                                                                    <span className="no-priority">Нет приоритетов</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="action-cell">
                                                            <button onClick={() => openRoomModal(room)} className="action-button edit-button">
                                                                <FaEdit />
                                                            </button>
                                                            <button onClick={() => openDeleteConfirm(room.id, room.number)} className="action-button delete-button">
                                                                <FaTrash />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="empty-row">
                                                    <FaDoorOpen />
                                                    <p>Нет кабинетов</p>
                                                    <button onClick={() => openRoomModal(null)}>Добавить</button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Уроки */}
                {activeTab === 'lessons' && (
                    <div className="lessons-container">
                        <div className="lessons-actions">
                            <button className="add-room-btn upload-btn" onClick={() => setUploadLessonsModalOpen(true)}>
                                <FaFileExcel /> Загрузить из Excel
                            </button>
                            <button className="add-room-btn" onClick={() => setAddLessonModalOpen(true)}>
                                <FaPlus /> Добавить вручную
                            </button>
                            <button className="add-room-btn" onClick={handleExportLessons} style={{ background: '#10b981' }}>
                                <FaDownload /> Экспорт в Excel
                            </button>
                            {selectedLessons.length > 0 && (
                                <button className="add-room-btn" onClick={handleBulkDeleteLessons} style={{ background: '#dc2626' }}>
                                    <FaTrash /> Удалить выбранные ({selectedLessons.length})
                                </button>
                            )}
                        </div>
                        <div className="table-container">
                            <h3 className="table-title">
                                <FaBook /> Список уроков ({lessons.length})
                                {lessons.length > 0 && (
                                    <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectAllLessons}
                                            onChange={handleSelectAllLessons}
                                        />
                                        Выбрать все
                                    </label>
                                )}
                            </h3>
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}></th>
                                            <th>ID</th>
                                            <th>Название урока</th>
                                            <th>Описание</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lessons.length > 0 ? (
                                            lessons.map(lesson => (
                                                <tr key={lesson.id}>
                                                    <td>
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedLessons.includes(lesson.id)}
                                                            onChange={() => handleToggleLessonSelection(lesson.id)}
                                                            style={{ accentColor: 'var(--primary)' }}
                                                        />
                                                    </td>
                                                    <td>{lesson.id}</td>
                                                    <td><strong>{lesson.name}</strong></td>
                                                    <td>{lesson.description?.substring(0, 50) || '—'}{lesson.description?.length > 50 ? '...' : ''}</td>
                                                    <td className="action-cell">
                                                        <button onClick={() => { setSelectedLesson(lesson); setViewLessonModalOpen(true); }} className="action-button view-button">
                                                            <FaEye /> Просмотр
                                                        </button>
                                                        <button onClick={() => handleDeleteLesson(lesson.id, lesson.name)} className="action-button delete-button">
                                                            <FaTrash /> Удалить
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="empty-row">
                                                    <FaBook />
                                                    <p>Нет загруженных уроков</p>
                                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                                                        <button onClick={() => setUploadLessonsModalOpen(true)}>Загрузить из Excel</button>
                                                        <button onClick={() => setAddLessonModalOpen(true)}>Добавить вручную</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Модальные окна */}
            <AddLessonModal isOpen={addLessonModalOpen} onClose={() => setAddLessonModalOpen(false)} onSave={handleAddLessonManually} />
            <ViewLessonModal isOpen={viewLessonModalOpen} onClose={() => setViewLessonModalOpen(false)} onUpdate={handleUpdateLesson} onDelete={handleDeleteLesson} lesson={selectedLesson} />
            <LessonSelectorModal isOpen={lessonSelectorModalOpen} onClose={() => setLessonSelectorModalOpen(false)} lessons={lessons} selectedIds={tempLessonIds} onSave={handleSaveLessons} teacherName={currentTeacher?.name || 'нового учителя'} />
            <RoomModal isOpen={roomModalOpen} onClose={() => { setRoomModalOpen(false); setEditingRoom(null); }} onSave={handleSaveRoom} room={editingRoom} lessons={lessons} />
            <UploadLessonsModal isOpen={uploadLessonsModalOpen} onClose={() => setUploadLessonsModalOpen(false)} onUpload={handleUploadLessons} existingLessons={lessons} />
            <TeacherLessonAssignmentModal 
                isOpen={teacherAssignmentModalOpen} 
                onClose={() => setTeacherAssignmentModalOpen(false)} 
                teacher={selectedTeacherForAssignment}
                lessons={lessons}
                onAssign={handleAssignLessonToTeacher}
                existingAssignments={lessonAssignments}
            />
            <ConfirmDeleteModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, itemId: null, itemName: '', itemType: '' })} onConfirm={handleDeleteRoom} itemName={confirmModal.itemName} itemType={confirmModal.itemType} />
            
            <EditAdminModal isOpen={editAdminModalOpen} onClose={() => setEditAdminModalOpen(false)} onSave={handleUpdateAdmin} admin={editingAdmin} />
            <EditTeacherModal isOpen={editTeacherModalOpen} onClose={() => setEditTeacherModalOpen(false)} onSave={handleUpdateTeacher} teacher={editingTeacher} />
            <EditClassModal isOpen={editClassModalOpen} onClose={() => setEditClassModalOpen(false)} onSave={handleUpdateClass} classData={editingClass} teachers={teachers} />

            {/* МАСТЕР НАЧАЛА НОВОГО УЧЕБНОГО ГОДА */}
            {showYearStartWizard && (
                <div className="wizard-modal-overlay" onClick={() => !wizardLoading && setShowYearStartWizard(false)}>
                    <div className="wizard-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="wizard-modal-header">
                            <h2><FaCalendarPlus /> Мастер начала нового учебного года</h2>
                            {!wizardLoading && (
                                <button className="wizard-close" onClick={() => setShowYearStartWizard(false)}>
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                        <div className="wizard-progress">
                            <div className="progress-track">
                                {['Выпуск 11', 'Перевод классов', '5 классы', '1 классы', 'Проверка'].map((label, idx) => (
                                    <div key={idx} className={`progress-step ${wizardStep >= idx ? 'active' : ''} ${wizardStep > idx ? 'completed' : ''}`}>
                                        <div className="step-marker">{wizardStep > idx ? '✓' : idx + 1}</div>
                                        <div className="step-label">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="wizard-body">
                            {/* ШАГ 1: Выпуск 11 классов */}
                            {wizardStep === 0 && (
                                <div className="wizard-step">
                                    <div className="step-icon-wrapper">
                                        <div className="step-icon"><FaGraduationCap style={{ fontSize: '3rem' }} /></div>
                                    </div>
                                    <h3>Выпуск 11 классов</h3>
                                    <p>Будут откреплены классные руководители от всех 11 классов.</p>
                                    
                                    <div className="warning-box">
                                        <FaExclamationTriangle /> Выпускники больше не будут привязаны к классным руководителям.
                                    </div>
                                    
                                    {!graduationDone ? (
                                        <button className="btn-graduate" onClick={handleGraduate11Classes} disabled={wizardLoading}>
                                            {wizardLoading ? <FaSpinner className="spinner" /> : <FaGraduationCap />}
                                            Выпустить 11 классы
                                        </button>
                                    ) : (
                                        <div className="success-box">
                                            <FaCheck /> 11 классы успешно выпущены!
                                        </div>
                                    )}
                                    
                                    <div className="wizard-step-footer">
                                        <button 
                                            className="btn-next-step" 
                                            onClick={() => setWizardStep(1)} 
                                            disabled={!graduationDone}
                                        >
                                            Продолжить <FaArrowRight />
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* ШАГ 2: Перевод всех классов */}
                            {wizardStep === 1 && (
                                <div className="wizard-step">
                                    <div className="step-icon-wrapper">
                                        <div className="step-icon"><FaSchool style={{ fontSize: '3rem' }} /></div>
                                    </div>
                                    <h3>Перевод всех классов</h3>
                                    <p>1→2, 2→3, 3→4, 4→5, 5→6, 6→7, 7→8, 8→9, 9→10, 10→11</p>
                                    
                                    {!promotionDone ? (
                                        <button className="btn-promote" onClick={handlePromoteAllClasses} disabled={wizardLoading}>
                                            {wizardLoading ? <FaSpinner className="spinner" /> : <FaSync />}
                                            Подтвердить перевод
                                        </button>
                                    ) : (
                                        <div className="success-box">
                                            <FaCheck /> Классы переведены!
                                        </div>
                                    )}
                                    
                                    <div className="wizard-step-footer">
                                        <button className="btn-back-step" onClick={() => setWizardStep(0)}>Назад</button>
                                        <button className="btn-next-step" onClick={() => setWizardStep(2)} disabled={!promotionDone}>
                                            Продолжить <FaArrowRight />
                                        </button>
                                    </div>
                                </div>
                            )}
{/* ШАГ 3: Назначение НОВЫХ руководителей для 5 классов */}
{wizardStep === 2 && (
    <div className="wizard-step">
        <div className="step-icon-wrapper">
            <div className="step-icon"><FaUserEdit style={{ fontSize: '3rem' }} /></div>
        </div>
        <h3>Назначение классных руководителей для 5 классов</h3>
        <p>Учителя начальных классов будут заменены на учителей-предметников.</p>
        
        <div className="assign-table-wrapper">
            <table className="assign-table">
                <thead>
                    <tr>
                        <th>Класс (был 4, стал 5)</th>
                        <th>Новый классный руководитель</th>
                    </tr>
                </thead>
                <tbody>
                    {fifthClasses.length === 0 ? (
                        <tr>
                            <td colSpan="2" className="empty-row">Загрузка...</td>
                        </tr>
                    ) : (
                        fifthClasses.map(cls => (
                            <tr key={cls.id}>
                                <td><strong>{cls.number}{cls.letter}</strong></td>
                                <td>
                                    <select 
                                        value={fifthClassAssignments[cls.id] || ''}
                                        onChange={(e) => setFifthClassAssignments(prev => ({...prev, [cls.id]: e.target.value}))}
                                        className="teacher-select"
                                    >
                                        <option value="">-- Не назначать --</option>
                                        {availableTeachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        <div className="wizard-step-footer">
            <button className="btn-back-step" onClick={() => setWizardStep(1)}>Назад</button>
            <button className="btn-next-step" onClick={handleAssignFifthClassTeachers} disabled={wizardLoading}>
                {wizardLoading ? <FaSpinner className="spinner" /> : <FaCheck />}
                Назначить и продолжить <FaArrowRight />
            </button>
        </div>
    </div>
)}
{/* ШАГ 4: Назначение для 1 классов */}
{wizardStep === 3 && (
    <div className="wizard-step">
        <div className="step-icon-wrapper">
            <div className="step-icon"><FaChalkboardTeacher style={{ fontSize: '3rem' }} /></div>
        </div>
        <h3>Назначение классных руководителей для новых 1 классов</h3>
        <p>Вы можете добавлять, удалять классы и назначать учителей</p>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button 
                className="btn-add-class"
                onClick={() => setShowAddClassModal(true)}
                style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <FaPlus /> Добавить класс
            </button>
        </div>
        
        <div className="assign-table-wrapper">
            <table className="assign-table">
                <thead>
                    <tr>
                        <th>Новый 1 класс</th>
                        <th>Классный руководитель</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {firstClasses.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="empty-row">Нет созданных 1 классов. Нажмите "Добавить класс"</td>
                        </tr>
                    ) : (
                        firstClasses.map(cls => (
                            <tr key={cls.id}>
                                <td><strong>{cls.name}</strong></td>
                                <td>
                                    <select 
                                        value={firstClassAssignments[cls.id] || ''}
                                        onChange={(e) => setFirstClassAssignments(prev => ({...prev, [cls.id]: e.target.value}))}
                                        className="teacher-select"
                                    >
                                        <option value="">-- Не назначен --</option>
                                        {allTeachersForSelect.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleDeleteFirstClass(cls.id, cls.name)}
                                        className="delete-button"
                                        style={{ padding: '4px 8px' }}
                                        title="Удалить класс"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        <div className="wizard-step-footer">
            <button className="btn-back-step" onClick={() => setWizardStep(2)}>Назад</button>
            <button className="btn-next-step" onClick={handleSaveFirstClassAssignments} disabled={wizardLoading}>
                {wizardLoading ? <FaSpinner className="spinner" /> : <FaCheck />}
                Сохранить и продолжить <FaArrowRight />
            </button>
        </div>
    </div>
)}
                            
{/* ШАГ 5: Финальная проверка */}
{wizardStep === 4 && (
    <div className="wizard-step">
        <div className="step-icon-wrapper">
            <div className="step-icon"><FaEye style={{ fontSize: '3rem' }} /></div>
        </div>
        <h3>Финальная проверка</h3>
        <p>Проверьте классных руководителей и отредактируйте при необходимости.</p>
        
        <div className="final-preview-wrapper">
            <table className="final-preview-table">
                <thead>
                    <tr>
                        <th>Класс</th>
                        <th>Классный руководитель</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {finalPreview.map(cls => (
                        <tr key={cls.id} className={cls.number === 11 ? 'graduate-row' : ''}>
                            <td>
                                <strong>{cls.name}</strong>
                                {cls.number === 11 && <span className="graduate-badge">ВЫПУСКНИКИ</span>}
                            </td>
                            <td>
                                <select 
                                    value={editingFinalPreview[cls.id] || ''}
                                    onChange={(e) => updateFinalAssignment(cls.id, e.target.value)}
                                    className="teacher-select"
                                >
                                    <option value="">-- Не назначен --</option>
                                    {allTeachersForSelect.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                {cls.teacher_id !== editingFinalPreview[cls.id] && 
                                    <span className="changed-badge">изменено</span>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        <div className="wizard-step-footer">
            <button className="btn-back-step" onClick={() => setWizardStep(3)}>Назад</button>
            <button className="btn-publish" onClick={handleFinalSave} disabled={wizardLoading}>
                {wizardLoading ? <FaSpinner className="spinner" /> : <FaSave />}
                Завершить
            </button>
        </div>
    </div>
)}
                        </div>
                        {showConfetti && <ConfettiEffect />}
                    </div>
                </div>
            )}

            {/* Модальное окно добавления класса */}
            {showAddClassModal && (
                <div className="modal-overlay" onClick={() => setShowAddClassModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Добавить новый 1 класс</h3>
                            <button className="modal-close" onClick={() => setShowAddClassModal(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Буква класса *</label>
                                <input 
                                    type="text" 
                                    maxLength="1" 
                                    value={newClassLetter}
                                    onChange={(e) => setNewClassLetter(e.target.value.toUpperCase())}
                                    placeholder="Например: Д"
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Классный руководитель</label>
                                <select 
                                    value={newClassTeacherId}
                                    onChange={(e) => setNewClassTeacherId(e.target.value)}
                                >
                                    <option value="">-- Не назначен --</option>
                                    {allTeachersForSelect.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowAddClassModal(false)}>Отмена</button>
                            <button className="btn-save" onClick={handleAddFirstClass}>Добавить</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default SuperAdminDashboard;