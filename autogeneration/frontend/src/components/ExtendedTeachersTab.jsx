// components/tabs/ExtendedTeachersTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaUserPlus, FaEdit, FaTrash, FaSchool, FaCheck, FaTimes, 
  FaSpinner, FaGraduationCap, FaUsers, FaUniversity, 
  FaPalette, FaInfoCircle, FaChalkboardTeacher, FaUserTie,
  FaSun, FaMoon
} from 'react-icons/fa';
import axios from 'axios';
import '../styles/ExtendedTeachersTab.css';
import '../styles/SuperAdmin.css';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Цвета для секций (только для внешних педагогов)
const SECTION_COLORS = [
    { name: 'Спортивный', value: '#ff6b6b' },
    { name: 'Творческий', value: '#4ecdc4' },
    { name: 'Научный', value: '#45b7d1' },
    { name: 'Языковой', value: '#96ceb4' },
    { name: 'Технический', value: '#feca57' },
    { name: 'Музыкальный', value: '#ff9ff3' },
    { name: 'Художественный', value: '#54a0ff' },
    { name: 'Танцевальный', value: '#5f27cd' },
    { name: 'Театральный', value: '#ff6348' },
    { name: 'Шахматный', value: '#2ed573' },
    { name: 'Робототехника', value: '#ffa502' },
    { name: 'Медиа', value: '#7bed9f' }
];

const ExtendedTeachersTab = ({ token, onDataChange }) => {
    const [extendedTeachers, setExtendedTeachers] = useState([]);
    const [schoolTeachers, setSchoolTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: 'success' });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState({
        lastName: '',
        firstName: '',
        middleName: '',
        sectionName: '',
        sectionColor: '#ff6b6b',
        isSchoolTeacher: false,
        schoolTeacherId: null
    });
    const [saving, setSaving] = useState(false);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);

    const loadData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const extendedRes = await axios.get(`${API_URL}/superadmin/extended-teachers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExtendedTeachers(extendedRes.data || []);
            
            const teachersRes = await axios.get(`${API_URL}/superadmin/teachers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allTeachers = teachersRes.data || [];
            const schoolOnly = allTeachers.filter(t => t.role !== 'superadmin');
            setSchoolTeachers(schoolOnly);
            
        } catch (err) {
            console.error('Error loading extended teachers:', err);
            showNotification('Ошибка загрузки данных', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [token]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const openAddModal = () => {
        setEditingTeacher(null);
        setFormData({
            lastName: '',
            firstName: '',
            middleName: '',
            sectionName: '',
            sectionColor: '#ff6b6b',
            isSchoolTeacher: false,
            schoolTeacherId: null
        });
        setModalOpen(true);
    };

    const openEditModal = (teacher) => {
        setEditingTeacher(teacher);
        const isSchoolTeacher = !!teacher.school_teacher_id;
        
        setFormData({
            lastName: teacher.last_name || '',
            firstName: teacher.first_name || '',
            middleName: teacher.middle_name || '',
            sectionName: teacher.section_name || '',
            sectionColor: teacher.section_color || '#ff6b6b',
            isSchoolTeacher: isSchoolTeacher,
            schoolTeacherId: teacher.school_teacher_id || null
        });
        setModalOpen(true);
    };

    const handleSchoolTeacherSelect = (teacherId) => {
        const selected = schoolTeachers.find(t => t.id === teacherId);
        if (selected) {
            setFormData({
                ...formData,
                schoolTeacherId: teacherId,
                lastName: selected.lastName || '',
                firstName: selected.firstName || '',
                middleName: selected.middleName || '',
                sectionColor: selected.color || '#ff6b6b'
            });
        }
    };

    const handleSave = async () => {
        if (formData.isSchoolTeacher) {
            if (!formData.schoolTeacherId) {
                showNotification('Выберите учителя школы', 'error');
                return;
            }
            if (!formData.sectionName || !formData.sectionName.trim()) {
                showNotification('Укажите название секции/кружка', 'error');
                return;
            }
        } else {
            if (!formData.lastName || !formData.lastName.trim()) {
                showNotification('Заполните фамилию', 'error');
                return;
            }
            if (!formData.firstName || !formData.firstName.trim()) {
                showNotification('Заполните имя', 'error');
                return;
            }
            if (!formData.sectionName || !formData.sectionName.trim()) {
                showNotification('Укажите название секции/кружка', 'error');
                return;
            }
        }
        
        setSaving(true);
        try {
            const payload = {
                lastName: formData.lastName,
                firstName: formData.firstName,
                middleName: formData.middleName || '',
                sectionName: formData.sectionName.trim(),
                sectionColor: formData.sectionColor,
                schoolTeacherId: formData.isSchoolTeacher ? formData.schoolTeacherId : null
            };
            
            if (editingTeacher) {
                await axios.put(
                    `${API_URL}/superadmin/extended-teachers/${editingTeacher.id}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showNotification('Данные обновлены');
            } else {
                await axios.post(
                    `${API_URL}/superadmin/extended-teachers`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showNotification('Секция добавлена');
            }
            
            setModalOpen(false);
            await loadData();
            if (onDataChange) onDataChange();
            
        } catch (err) {
            console.error('Save error:', err);
            const errorMessage = err.response?.data?.message || 'Ошибка сохранения';
            showNotification(errorMessage, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (teacher) => {
        const message = `Удалить секцию "${teacher.section_name}"?`;
        if (!window.confirm(message)) return;
        
        try {
            await axios.delete(`${API_URL}/superadmin/extended-teachers/${teacher.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Секция удалена');
            await loadData();
            if (onDataChange) onDataChange();
        } catch (err) {
            console.error('Delete error:', err);
            showNotification('Ошибка удаления', 'error');
        }
    };

    const ColorPickerModal = ({ isOpen, onClose, selectedColor, onSelect }) => {
        if (!isOpen) return null;
        
        return (
            <div className="color-picker-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="color-picker-content">
                    <div className="color-picker-header">
                        <h4><FaPalette /> Выберите цвет секции</h4>
                        <button className="color-picker-close" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="color-grid">
                        {SECTION_COLORS.map(color => (
                            <div
                                key={color.value}
                                className="color-option"
                                onClick={() => {
                                    onSelect(color.value);
                                    onClose();
                                }}
                                style={{
                                    backgroundColor: color.value,
                                    border: selectedColor === color.value ? '3px solid #21435A' : '2px solid white',
                                }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="extended-loading">
                <div className="spinner"></div>
                <p>Загрузка данных...</p>
            </div>
        );
    }

    return (
        <>
            {notification.message && (
                <div className={`extended-notification ${notification.type}`}>
                    {notification.type === 'success' ? <FaCheck size={14} /> : <FaTimes size={14} />}
                    <span>{notification.message}</span>
                </div>
            )}
            
            <div className="extended-container">
                <div className="extended-header">
                    <button className="extended-add-btn" onClick={openAddModal}>
                        <FaUserPlus size={16} /> Добавить секцию / кружок
                    </button>
                </div>
                
                <div className="extended-table-card">
                    <div className="extended-table-header">
                        <div className="extended-table-title">
                            <FaGraduationCap />
                            <h3>Секции и кружки</h3>
                            <span className="extended-count-badge">{extendedTeachers.length}</span>
                        </div>
                    </div>
                    
                    <div className="extended-table-wrapper">
                        <table className="extended-table">
                            <thead>
                                <tr>
                                    <th>ФИО руководителя</th>
                                    <th>Тип</th>
                                    <th>Цвет</th>
                                    <th>Секция / Кружок</th>
                                    <th style={{ width: '160px' }}>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extendedTeachers.map(teacher => {
                                    const isSchoolTeacher = !!teacher.school_teacher_id;
                                    const displayColor = teacher.color || teacher.section_color || '#ff6b6b';
                                    
                                    return (
                                        <tr key={teacher.id} className="extended-row">
                                            <td className="teacher-name-cell">{teacher.name}</td>
                                            <td>
                                                <span className={`type-badge ${isSchoolTeacher ? 'school' : 'external'}`}>
                                                    {isSchoolTeacher ? <FaChalkboardTeacher size={12} /> : <FaUserTie size={12} />}
                                                    {isSchoolTeacher ? 'Школьный учитель' : 'Внешний педагог'}
                                                </span>
                                            </td>
                                            <td>
                                                <div 
                                                    className="color-indicator"
                                                    style={{ backgroundColor: displayColor }}
                                                    title="Цвет секции"
                                                />
                                            </td>
                                            <td>
                                                <span 
                                                    className="section-badge"
                                                    style={{ background: `linear-gradient(135deg, ${displayColor} 0%, ${displayColor}cc 100%)` }}
                                                >
                                                    <FaUniversity size={12} />
                                                    {teacher.section_name}
                                                </span>
                                            </td>
                                            <td className="extended-actions-cell">
                                                <button 
                                                    onClick={() => openEditModal(teacher)} 
                                                    className="extended-action-btn edit"
                                                >
                                                    <FaEdit size={12} /> Изменить
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(teacher)} 
                                                    className="extended-action-btn delete"
                                                >
                                                    <FaTrash size={12} /> Удалить
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {extendedTeachers.length === 0 && (
                                    <tr className="extended-empty-row">
                                        <td colSpan="5">
                                            <div className="extended-empty-state">
                                                <div className="extended-empty-icon">
                                                    <FaUsers size={48} />
                                                </div>
                                                <h4>Нет добавленных секций и кружков</h4>
                                                <p>Добавьте первую секцию, нажав кнопку выше</p>
                                                <button className="extended-empty-btn" onClick={openAddModal}>
                                                    <FaUserPlus /> Добавить секцию
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {/* Модалка добавления/редактирования */}
            {modalOpen && (
                <div className="extended-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) setModalOpen(false); }}>
                    <div className="extended-modal-content">
                        <div className="extended-modal-header">
                            <FaUserPlus />
                            <h3>{editingTeacher ? 'Редактировать секцию' : 'Добавить секцию / кружок'}</h3>
                            <button className="extended-modal-close" onClick={() => !saving && setModalOpen(false)} disabled={saving}>
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="extended-modal-body">
                            {/* Тип руководителя */}
                            <div className="extended-form-group">
                                <label>Тип руководителя</label>
                                <div className="type-toggle-container">
                                    <div className="type-option">
                                        <input
                                            type="radio"
                                            id="external"
                                            name="teacherType"
                                            checked={!formData.isSchoolTeacher}
                                            onChange={() => {
                                                setFormData({
                                                    ...formData,
                                                    isSchoolTeacher: false,
                                                    schoolTeacherId: null,
                                                    lastName: '',
                                                    firstName: '',
                                                    middleName: '',
                                                    sectionColor: '#ff6b6b'
                                                });
                                            }}
                                            disabled={saving}
                                        />
                                        <label htmlFor="external">
                                            🎯 Внешний педагог (только секция)
                                        </label>
                                    </div>
                                    <div className="type-option">
                                        <input
                                            type="radio"
                                            id="school"
                                            name="teacherType"
                                            checked={formData.isSchoolTeacher}
                                            onChange={() => {
                                                setFormData({
                                                    ...formData,
                                                    isSchoolTeacher: true,
                                                    schoolTeacherId: null,
                                                    lastName: '',
                                                    firstName: '',
                                                    middleName: '',
                                                    sectionColor: '#ff6b6b'
                                                });
                                            }}
                                            disabled={saving}
                                        />
                                        <label htmlFor="school">
                                            🏫 Школьный учитель (ведёт и уроки, и секцию)
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Если школьный учитель - выбор из списка */}
                            {formData.isSchoolTeacher && (
                                <div className="extended-form-group">
                                    <label><FaSchool /> Выберите учителя школы *</label>
                                    <select 
                                        value={formData.schoolTeacherId || ''} 
                                        onChange={e => {
                                            const teacherId = e.target.value ? parseInt(e.target.value) : null;
                                            handleSchoolTeacherSelect(teacherId);
                                        }}
                                        disabled={saving}
                                    >
                                        <option value="">-- Выберите учителя --</option>
                                        {schoolTeachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <small>Учитель может вести несколько секций. Будет использован его цвет из профиля.</small>
                                    
                                    {formData.schoolTeacherId && (
                                        <div className="selected-teacher-card">
                                            <FaCheck size={12} />
                                            <span>Выбран: {formData.lastName} {formData.firstName} {formData.middleName}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Если внешний педагог - ввод ФИО */}
                            {!formData.isSchoolTeacher && (
                                <>
                                    <div className="extended-form-row">
                                        <div className="extended-form-group">
                                            <label>Фамилия *</label>
                                            <input 
                                                type="text" 
                                                value={formData.lastName} 
                                                onChange={e => setFormData({...formData, lastName: e.target.value})}
                                                disabled={saving}
                                                placeholder="Иванов"
                                            />
                                        </div>
                                        <div className="extended-form-group">
                                            <label>Имя *</label>
                                            <input 
                                                type="text" 
                                                value={formData.firstName} 
                                                onChange={e => setFormData({...formData, firstName: e.target.value})}
                                                disabled={saving}
                                                placeholder="Иван"
                                            />
                                        </div>
                                    </div>
                                    <div className="extended-form-group">
                                        <label>Отчество</label>
                                        <input 
                                            type="text" 
                                            value={formData.middleName} 
                                            onChange={e => setFormData({...formData, middleName: e.target.value})}
                                            disabled={saving}
                                            placeholder="Иванович"
                                        />
                                    </div>
                                    <div className="extended-info-block warning">
                                        <FaInfoCircle size={14} />
                                        Внешний педагог не имеет доступа в систему и не участвует в основном расписании
                                    </div>
                                </>
                            )}
                            
                            {/* Название секции */}
                            <div className="extended-form-group">
                                <label><FaUniversity /> Название секции / кружка *</label>
                                <input 
                                    type="text" 
                                    value={formData.sectionName} 
                                    onChange={e => setFormData({...formData, sectionName: e.target.value})}
                                    placeholder="Например: Шахматы, Волейбол, Робототехника..."
                                    disabled={saving}
                                />
                            </div>
                            
                            {/* Цвет секции - только для внешних педагогов */}
                            {!formData.isSchoolTeacher && (
                                <div className="extended-form-group">
                                    <label><FaPalette /> Цвет секции</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div 
                                            className="color-indicator"
                                            style={{ 
                                                backgroundColor: formData.sectionColor,
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '14px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setColorPickerOpen(true)}
                                        />
                                        <button 
                                            type="button"
                                            className="extended-modal-cancel"
                                            onClick={() => setColorPickerOpen(true)}
                                            style={{ margin: 0 }}
                                        >
                                            <FaPalette /> Выбрать цвет
                                        </button>
                                    </div>
                                    <small>Цвет, которым будут выделяться занятия секции в расписании</small>
                                </div>
                            )}
                            
                            {formData.isSchoolTeacher && (
                                <div className="extended-info-block info">
                                    <FaCheck size={14} />
                                    Для школьного учителя будет использован его цвет из вкладки "Учителя школы"
                                </div>
                            )}
                        </div>
                        
                        <div className="extended-modal-footer">
                            <button 
                                type="button" 
                                className="extended-modal-cancel" 
                                onClick={() => !saving && setModalOpen(false)} 
                                disabled={saving}
                            >
                                Отмена
                            </button>
                            <button 
                                type="button" 
                                className="extended-modal-save" 
                                onClick={handleSave} 
                                disabled={saving}
                            >
                                <FaCheck /> {saving ? 'Сохранение...' : (editingTeacher ? 'Сохранить' : 'Добавить')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <ColorPickerModal 
                isOpen={colorPickerOpen}
                onClose={() => setColorPickerOpen(false)}
                selectedColor={formData.sectionColor}
                onSelect={(color) => setFormData({...formData, sectionColor: color})}
            />
        </>
    );
};

export default ExtendedTeachersTab;