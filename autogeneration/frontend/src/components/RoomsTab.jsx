// components/tabs/RoomsTab.jsx
import React, { useState, useEffect } from 'react';
import { 
    FaDoorOpen, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaSearch, 
    FaExclamationTriangle, FaChalkboardTeacher, FaUserPlus, FaSpinner,
    FaCheck, FaBuilding, FaInfoCircle
} from 'react-icons/fa';
import axios from 'axios';
import '../styles/RoomsTab.css';
import '../styles/SuperAdmin.css';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RoomsTab = ({ rooms = [], lessons = [], token, onDataChange }) => {
    const [roomModalOpen, setRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, itemId: null, itemName: '', itemType: '' });
    const [notification, setNotification] = useState({ message: '', type: 'success' });
    const [teacherAssignmentModalOpen, setTeacherAssignmentModalOpen] = useState(false);
    const [currentRoomForTeachers, setCurrentRoomForTeachers] = useState(null);
    const [teachersFromDB, setTeachersFromDB] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [tempTeacherIds, setTempTeacherIds] = useState([]);
    const [searchTeacherTerm, setSearchTeacherTerm] = useState('');
    const [savingTeachers, setSavingTeachers] = useState(false);
    const [loadingAssigned, setLoadingAssigned] = useState(false);

    // Загрузка учителей из БД
    useEffect(() => {
        const loadTeachers = async () => {
            if (!token) return;
            setLoadingTeachers(true);
            try {
                const res = await axios.get(`${API_URL}/superadmin/teachers`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeachersFromDB(res.data || []);
            } catch (err) {
                console.error('Ошибка загрузки учителей:', err);
            } finally {
                setLoadingTeachers(false);
            }
        };
        loadTeachers();
    }, [token]);

    const showNotification = (msg, type = 'success') => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const handleDeleteRoom = async () => {
        const { itemId, itemName } = confirmModal;
        try {
            await axios.delete(`${API_URL}/superadmin/rooms/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification(`Кабинет "${itemName}" удалён`);
            onDataChange();
            setConfirmModal({ isOpen: false, itemId: null, itemName: '', itemType: '' });
        } catch (err) {
            showNotification('Ошибка удаления', 'error');
        }
    };

    const handleAddRoom = async (roomData) => {
        try {
            const payload = {
                number: String(roomData.number).trim(),
                name: roomData.name || '',
                lessonPriorities: Array.isArray(roomData.lessonPriorities) ? roomData.lessonPriorities.map(id => parseInt(id)).filter(id => !isNaN(id)) : []
            };
            await axios.post(`${API_URL}/superadmin/rooms`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Кабинет добавлен');
            onDataChange();
            setRoomModalOpen(false);
            setEditingRoom(null);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Ошибка добавления', 'error');
        }
    };

    const handleUpdateRoom = async (roomData) => {
        try {
            const payload = {
                number: String(roomData.number).trim(),
                name: roomData.name || '',
                lessonPriorities: Array.isArray(roomData.lessonPriorities) ? roomData.lessonPriorities.map(id => parseInt(id)).filter(id => !isNaN(id)) : []
            };
            await axios.put(`${API_URL}/superadmin/rooms/${editingRoom.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Кабинет обновлен');
            onDataChange();
            setRoomModalOpen(false);
            setEditingRoom(null);
        } catch (err) {
            showNotification('Ошибка обновления', 'error');
        }
    };

    const handleSaveRoom = async (roomData) => {
        if (editingRoom) {
            await handleUpdateRoom(roomData);
        } else {
            await handleAddRoom(roomData);
        }
    };

    const openTeacherAssignmentModal = async (room) => {
        setCurrentRoomForTeachers(room);
        setTeacherAssignmentModalOpen(true);
        
        // Загружаем уже закрепленных учителей
        setLoadingAssigned(true);
        try {
            const res = await axios.get(`${API_URL}/superadmin/rooms/${room.id}/teachers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const ids = (res.data || []).map(t => t.id);
            setTempTeacherIds(ids);
        } catch (err) {
            console.error('Ошибка загрузки закрепленных учителей:', err);
            setTempTeacherIds([]);
        } finally {
            setLoadingAssigned(false);
        }
    };

    const handleAssignTeachers = async () => {
        if (!currentRoomForTeachers) return;
        setSavingTeachers(true);
        try {
            await axios.put(`${API_URL}/superadmin/rooms/${currentRoomForTeachers.id}/teachers`, {
                teacherIds: tempTeacherIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Учителя закреплены за кабинетом');
            onDataChange();
            setTeacherAssignmentModalOpen(false);
            setCurrentRoomForTeachers(null);
            setTempTeacherIds([]);
        } catch (err) {
            showNotification('Ошибка при закреплении учителей', 'error');
        } finally {
            setSavingTeachers(false);
        }
    };

    const openRoomModal = (room = null) => {
        setEditingRoom(room);
        setRoomModalOpen(true);
    };

    const openDeleteConfirm = (id, name) => setConfirmModal({ isOpen: true, itemId: id, itemName: name, itemType: 'кабинет' });

    // Модалка кабинета
    const RoomModal = ({ isOpen, onClose, onSave, room, lessonsList = [] }) => {
        const [formData, setFormData] = useState({ number: '', name: '' });
        const [selectedLessons, setSelectedLessons] = useState([]);
        const [searchTerm, setSearchTerm] = useState('');
        const [saving, setSaving] = useState(false);

        useEffect(() => {
            if (room && isOpen) {
                setFormData({ number: room.number || '', name: room.name || '' });
                const priorities = room.lesson_priorities || [];
                const lessonIds = priorities.map(lp => lp.lesson_id || lp.id).filter(id => id);
                setSelectedLessons(lessonIds);
            } else if (!isOpen) {
                setFormData({ number: '', name: '' });
                setSelectedLessons([]);
                setSearchTerm('');
            }
        }, [room, isOpen]);

        const toggleLesson = (lessonId) => {
            setSelectedLessons(prev => prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);
        };

        const handleSubmit = async () => {
            if (!formData.number) {
                showNotification('Введите номер кабинета', 'error');
                return;
            }
            setSaving(true);
            try {
                await onSave({ number: formData.number, name: formData.name, lessonPriorities: selectedLessons });
                onClose();
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        const filteredLessons = lessonsList.filter(l => l && l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!isOpen) return null;

        return (
            <div className="rooms-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="rooms-modal-content" style={{ maxWidth: '500px' }}>
                    <div className="rooms-modal-header">
                        <FaDoorOpen />
                        <h3>{room ? 'Редактировать кабинет' : 'Новый кабинет'}</h3>
                        <button className="rooms-modal-close" onClick={() => !saving && onClose()} disabled={saving}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="rooms-modal-body">
                        <div className="rooms-form-group">
                            <label>Номер кабинета *</label>
                            <input 
                                type="text" 
                                value={formData.number} 
                                onChange={(e) => setFormData({...formData, number: e.target.value})} 
                                placeholder="Напр: 101" 
                                disabled={saving} 
                            />
                        </div>
                        <div className="rooms-form-group">
                            <label>Название</label>
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                placeholder="Напр: Кабинет математики" 
                                disabled={saving} 
                            />
                        </div>
                        <div className="rooms-form-group">
                            <label>Приоритетные предметы</label>
                            <div className="rooms-selector-search">
                                <FaSearch />
                                <input 
                                    type="text" 
                                    placeholder="Поиск уроков..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    disabled={saving} 
                                />
                            </div>
                            <div className="rooms-selector-list">
                                {filteredLessons.length === 0 ? (
                                    <div className="rooms-no-data" style={{ textAlign: 'center', padding: '1rem' }}>
                                        {searchTerm ? 'Ничего не найдено' : 'Нет загруженных уроков'}
                                    </div>
                                ) : (
                                    filteredLessons.map((lesson) => (
                                        <label key={lesson.id} className="rooms-selector-item">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedLessons.includes(lesson.id)} 
                                                onChange={() => toggleLesson(lesson.id)} 
                                                disabled={saving} 
                                            />
                                            <span>{lesson.name} {lesson.shortName && `(${lesson.shortName})`}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="rooms-modal-footer">
                        <button className="rooms-modal-cancel" onClick={() => !saving && onClose()} disabled={saving}>
                            Отмена
                        </button>
                        <button className="rooms-modal-save" onClick={handleSubmit} disabled={saving}>
                            <FaSave /> {saving ? 'Сохранение...' : (room ? 'Сохранить' : 'Добавить')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Модалка подтверждения удаления
    const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
        if (!isOpen) return null;
        
        return (
            <div className="confirm-modal-overlay" onClick={onClose}>
                <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
                    <div className="confirm-modal-header">
                        <div className="confirm-icon">
                            <FaExclamationTriangle />
                        </div>
                        <h3>Подтверждение удаления</h3>
                        <button className="rooms-modal-close" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="confirm-modal-body">
                        <p>Вы действительно хотите удалить <strong>{itemType}</strong>?</p>
                        <div className="confirm-item-name">"{itemName}"</div>
                        <p className="confirm-warning">⚠️ Это действие нельзя отменить.</p>
                    </div>
                    <div className="confirm-modal-footer">
                        <button className="confirm-btn-cancel" onClick={onClose}>Отмена</button>
                        <button className="confirm-btn-delete" onClick={onConfirm}>
                            <FaTrash /> Удалить
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Модалка привязки учителей
    const TeacherAssignmentModal = ({ isOpen, onClose, onSave, room }) => {
        const [searchTerm, setSearchTerm] = useState('');
        
        const toggleTeacher = (teacherId) => {
            setTempTeacherIds(prev => 
                prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]
            );
        };

        const filteredTeachers = teachersFromDB.filter(t => 
            t && t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (!isOpen) return null;

        return (
            <div className="rooms-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !savingTeachers) onClose(); }}>
                <div className="rooms-modal-content" style={{ maxWidth: '550px' }}>
                    <div className="rooms-modal-header">
                        <FaChalkboardTeacher />
                        <h3>Закрепление учителей за кабинетом {room?.number}</h3>
                        <button className="rooms-modal-close" onClick={() => !savingTeachers && onClose()} disabled={savingTeachers}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="rooms-modal-body">
                        <div className="rooms-selector-search">
                            <FaSearch />
                            <input 
                                type="text" 
                                placeholder="Поиск учителей..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                disabled={savingTeachers} 
                            />
                        </div>
                        <div className="rooms-selector-list" style={{ maxHeight: '350px' }}>
                            {loadingAssigned ? (
                                <div style={{ textAlign: 'center', padding: '1rem' }}>
                                    <div className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto 10px' }}></div>
                                    Загрузка...
                                </div>
                            ) : filteredTeachers.length === 0 ? (
                                <div className="rooms-no-data" style={{ textAlign: 'center', padding: '1rem' }}>
                                    {searchTerm ? 'Ничего не найдено' : 'Нет учителей в системе'}
                                </div>
                            ) : (
                                filteredTeachers.map((teacher) => (
                                    <label key={teacher.id} className="rooms-selector-item">
                                        <input 
                                            type="checkbox" 
                                            checked={tempTeacherIds.includes(teacher.id)} 
                                            onChange={() => toggleTeacher(teacher.id)} 
                                            disabled={savingTeachers} 
                                        />
                                        <span>{teacher.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                        {tempTeacherIds.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '8px', background: '#f1f5f9', borderRadius: '8px', textAlign: 'center' }}>
                                <small>Выбрано учителей: <strong>{tempTeacherIds.length}</strong></small>
                            </div>
                        )}
                    </div>
                    <div className="rooms-modal-footer">
                        <button className="rooms-modal-cancel" onClick={() => !savingTeachers && onClose()} disabled={savingTeachers}>
                            Отмена
                        </button>
                        <button className="rooms-modal-save" onClick={onSave} disabled={savingTeachers || loadingAssigned}>
                            <FaSave /> {savingTeachers ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const roomsArray = Array.isArray(rooms) ? rooms : [];

    if (loadingTeachers && teachersFromDB.length === 0) {
        return (
            <div className="rooms-loading">
                <div className="spinner"></div>
                <p>Загрузка учителей...</p>
            </div>
        );
    }

    return (
        <>
            {notification.message && (
                <div className={`rooms-notification ${notification.type}`}>
                    {notification.type === 'success' ? <FaCheck size={14} /> : <FaExclamationTriangle size={14} />}
                    <span>{notification.message}</span>
                </div>
            )}
            
            <div className="rooms-container-modern">
                <div className="rooms-header">
                    <button className="rooms-add-btn" onClick={() => openRoomModal(null)}>
                        <FaPlus size={14} /> Добавить кабинет
                    </button>
                </div>
                
                <div className="rooms-table-card">
                    <div className="rooms-table-header">
                        <div className="rooms-table-title">
                            <FaBuilding size={18} />
                            <h3>Список кабинетов</h3>
                            <span className="rooms-count">{roomsArray.length}</span>
                        </div>
                    </div>
                    
                    <div className="rooms-table-wrapper">
                        <table className="rooms-table">
                            <thead>
                                <tr>
                                    <th>№</th>
                                    <th>Название</th>
                                    <th>Приоритетные предметы</th>
                                    <th>Закрепленные учителя</th>
                                    <th style={{ width: '100px' }}>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roomsArray.length > 0 ? roomsArray.map(room => {
                                    const roomTeachers = room.teachers || [];
                                    return (
                                        <tr key={room.id} className="rooms-row">
                                            <td className="rooms-number">{room.number}</td>
                                            <td className="rooms-name">{room.name || '-'}</td>
                                            <td>
                                                <div className="rooms-tags">
                                                    {room.lesson_priorities?.length > 0 
                                                        ? room.lesson_priorities.map((lp, i) => (
                                                            <span key={i} className="rooms-tag priority">
                                                                {lp.lesson_name || lp.name}
                                                            </span>
                                                        ))
                                                        : <span className="rooms-no-data">Нет приоритетов</span>
                                                    }
                                                </div>
                                            </td>
                                            <td>
                                                <div className="rooms-tags">
                                                    {roomTeachers.length > 0 
                                                        ? roomTeachers.map((teacher, i) => (
                                                            <span key={i} className="rooms-tag teacher" style={{ background: teacher.color || '#3b82f6' }}>
                                                                {teacher.name}
                                                            </span>
                                                        ))
                                                        : <span className="rooms-no-data">Нет учителей</span>
                                                    }
                                                    <button 
                                                        className="rooms-add-teacher-btn" 
                                                        onClick={() => openTeacherAssignmentModal(room)}
                                                    >
                                                        <FaUserPlus size={10} /> Добавить учителей
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="rooms-actions">
                                                <button 
                                                    onClick={() => openRoomModal(room)} 
                                                    className="rooms-action edit"
                                                    title="Редактировать"
                                                >
                                                    <FaEdit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteConfirm(room.id, room.number)} 
                                                    className="rooms-action delete"
                                                    title="Удалить"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr className="rooms-empty-row">
                                        <td colSpan="5">
                                            <div className="rooms-empty-state">
                                                <div className="rooms-empty-icon">
                                                    <FaDoorOpen size={48} />
                                                </div>
                                                <h4>Нет кабинетов</h4>
                                                <p>Добавьте первый кабинет, нажав кнопку выше</p>
                                                <button className="rooms-empty-btn" onClick={() => openRoomModal(null)}>
                                                    <FaPlus /> Добавить кабинет
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="rooms-table-footer" style={{ padding: '0.75rem 1.25rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#64748b' }}>
                            <FaInfoCircle size={12} />
                            <span>Приоритетные предметы помогают алгоритму правильно распределять уроки по кабинетам</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <RoomModal 
                isOpen={roomModalOpen} 
                onClose={() => { setRoomModalOpen(false); setEditingRoom(null); }} 
                onSave={handleSaveRoom} 
                room={editingRoom} 
                lessonsList={lessons} 
            />
            
            <ConfirmDeleteModal 
                isOpen={confirmModal.isOpen} 
                onClose={() => setConfirmModal({ isOpen: false, itemId: null, itemName: '', itemType: '' })} 
                onConfirm={handleDeleteRoom} 
                itemName={confirmModal.itemName} 
                itemType={confirmModal.itemType} 
            />
            
            <TeacherAssignmentModal 
                isOpen={teacherAssignmentModalOpen} 
                onClose={() => { 
                    setTeacherAssignmentModalOpen(false); 
                    setCurrentRoomForTeachers(null); 
                    setTempTeacherIds([]);
                }} 
                onSave={handleAssignTeachers} 
                room={currentRoomForTeachers} 
            />
        </>
    );
};

export default RoomsTab;