// components/tabs/RoomsTab.jsx
import React, { useState, useEffect } from 'react';
import { FaDoorOpen, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaSearch, FaExclamationTriangle, FaChalkboardTeacher, FaUserPlus, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RoomsTab = ({ rooms = [], lessons = [], token, onDataChange }) => {
    const [roomModalOpen, setRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, itemId: null, itemName: '', itemType: '' });
    const [notification, setNotification] = useState('');
    const [teacherAssignmentModalOpen, setTeacherAssignmentModalOpen] = useState(false);
    const [currentRoomForTeachers, setCurrentRoomForTeachers] = useState(null);
    
    // ===== УЧИТЕЛЯ ИЗ БД =====
    const [teachersFromDB, setTeachersFromDB] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    // ЗАГРУЗКА УЧИТЕЛЕЙ ИЗ БД ПРИ МОНТИРОВАНИИ
    useEffect(() => {
        const loadTeachers = async () => {
            if (!token) return;
            setLoadingTeachers(true);
            try {
                const res = await axios.get(`${API_URL}/superadmin/teachers`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Загружено учителей из БД:', res.data?.length);
                setTeachersFromDB(res.data || []);
            } catch (err) {
                console.error('Ошибка загрузки учителей:', err);
            } finally {
                setLoadingTeachers(false);
            }
        };
        loadTeachers();
    }, [token]);

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(''), 3000);
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
            showNotification('Ошибка удаления');
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
            showNotification(err.response?.data?.message || 'Ошибка добавления');
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
            showNotification('Ошибка обновления');
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
    };

    // Сохранение привязки учителей
    const handleAssignTeachers = async (selectedIds) => {
        if (!currentRoomForTeachers) return;
        try {
            await axios.put(`${API_URL}/superadmin/rooms/${currentRoomForTeachers.id}/teachers`, {
                teacherIds: selectedIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Учителя закреплены за кабинетом');
            onDataChange();
            setTeacherAssignmentModalOpen(false);
            setCurrentRoomForTeachers(null);
        } catch (err) {
            showNotification('Ошибка при закреплении учителей');
            throw err;
        }
    };

    const openRoomModal = (room = null) => {
        setEditingRoom(room);
        setRoomModalOpen(true);
    };

    const openDeleteConfirm = (id, name) => setConfirmModal({ isOpen: true, itemId: id, itemName: name, itemType: 'кабинет' });

    // ===== МОДАЛКА ПРИВЯЗКИ УЧИТЕЛЕЙ =====
    const TeacherAssignmentModal = ({ isOpen, onClose, onSave, room }) => {
        const [searchTerm, setSearchTerm] = useState('');
        const [saving, setSaving] = useState(false);
        const [selectedIds, setSelectedIds] = useState([]);
        const [assignedTeachers, setAssignedTeachers] = useState([]);
        const [loading, setLoading] = useState(false);

        // Загружаем уже закрепленных учителей при открытии
        useEffect(() => {
            const fetchAssigned = async () => {
                if (!isOpen || !room) return;
                setLoading(true);
                try {
                    const res = await axios.get(`${API_URL}/superadmin/rooms/${room.id}/teachers`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const ids = (res.data || []).map(t => t.id);
                    setSelectedIds(ids);
                    setAssignedTeachers(res.data || []);
                } catch (err) {
                    console.error('Ошибка загрузки закрепленных учителей:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchAssigned();
        }, [isOpen, room, token]);

        const toggleTeacher = (teacherId) => {
            setSelectedIds(prev => 
                prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]
            );
        };

        const handleSave = async () => {
            setSaving(true);
            try {
                await onSave(selectedIds);
                onClose();
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        // Фильтруем учителей (показываем всех, но отмечаем уже закрепленных)
        const filteredTeachers = teachersFromDB.filter(t => 
            t && t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (!isOpen) return null;

        return (
            <div className="room-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="room-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                    <div className="room-modal-header" style={{ background: '#21435A' }}>
                        <h3><FaChalkboardTeacher /> Закрепление учителей за кабинетом {room?.number}</h3>
                        <button className="room-modal-close" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                    </div>
                    <div className="room-modal-body">
                        <div className="subject-priorities-search">
                            <FaSearch />
                            <input type="text" placeholder="Поиск учителей..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={saving} />
                        </div>
                        <div className="subject-priorities-list" style={{ maxHeight: '350px' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}><FaSpinner className="spinner" /> Загрузка...</div>
                            ) : filteredTeachers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                    {searchTerm ? 'Ничего не найдено' : 'Нет учителей в системе'}
                                </div>
                            ) : (
                                filteredTeachers.map((teacher) => (
                                    <label key={teacher.id} className="subject-priority-item">
                                        <input type="checkbox" checked={selectedIds.includes(teacher.id)} onChange={() => toggleTeacher(teacher.id)} disabled={saving} />
                                        <span>
                                            {teacher.name}
                                            {teacher.lessons && teacher.lessons.length > 0 && (
                                                <small style={{ marginLeft: '8px', color: '#64748b' }}>
                                                    ({teacher.lessons.slice(0, 2).map(l => l.name).join(', ')})
                                                </small>
                                            )}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                        {selectedIds.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '8px', background: '#f1f5f9', borderRadius: '8px', textAlign: 'center' }}>
                                <small>Выбрано учителей: <strong>{selectedIds.length}</strong></small>
                            </div>
                        )}
                    </div>
                    <div className="room-modal-footer">
                        <button className="btn-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                        <button className="btn-save" onClick={handleSave} disabled={saving || loading}>
                            <FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ===== МОДАЛКА КАБИНЕТА =====
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
                alert('Введите номер кабинета');
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
            <div className="room-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="room-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                    <div className="room-modal-header">
                        <h3><FaDoorOpen /> {room ? 'Редактировать кабинет' : 'Новый кабинет'}</h3>
                        <button className="room-modal-close" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                    </div>
                    <div className="room-modal-body">
                        <div className="form-group">
                            <label>Номер кабинета *</label>
                            <input type="text" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} placeholder="Напр: 101" disabled={saving} />
                        </div>
                        <div className="form-group">
                            <label>Название</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Напр: Кабинет математики" disabled={saving} />
                        </div>
                        <div className="form-group">
                            <label>Приоритетные предметы</label>
                            <div className="subject-priorities-search">
                                <FaSearch />
                                <input type="text" placeholder="Поиск уроков..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={saving} />
                            </div>
                            <div className="subject-priorities-list">
                                {filteredLessons.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                        {searchTerm ? 'Ничего не найдено' : 'Нет загруженных уроков'}
                                    </div>
                                ) : (
                                    filteredLessons.map((lesson) => (
                                        <label key={lesson.id} className="subject-priority-item">
                                            <input type="checkbox" checked={selectedLessons.includes(lesson.id)} onChange={() => toggleLesson(lesson.id)} disabled={saving} />
                                            <span>{lesson.name} {lesson.shortName && `(${lesson.shortName})`}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="room-modal-footer">
                        <button className="btn-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                        <button className="btn-save" onClick={handleSubmit} disabled={saving}><FaSave /> {saving ? 'Сохранение...' : (room ? 'Сохранить' : 'Добавить')}</button>
                    </div>
                </div>
            </div>
        );
    };

    // ===== МОДАЛКА ПОДТВЕРЖДЕНИЯ =====
    const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
        if (!isOpen) return null;
        return (
            <div className="confirm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
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
                        <button className="confirm-btn-delete" onClick={onConfirm} style={{ background: '#dc2626' }}><FaTrash /> Удалить</button>
                    </div>
                </div>
            </div>
        );
    };

    if (loadingTeachers && teachersFromDB.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <FaSpinner className="spinner" style={{ fontSize: '2rem', color: '#21435A', animation: 'spin 1s linear infinite' }} />
                <p>Загрузка учителей...</p>
            </div>
        );
    }

    return (
        <>
            {notification && <div className="notification">{notification}</div>}
            <div className="rooms-container-table">
                <div className="rooms-header">
                    <button className="add-room-btn" onClick={() => openRoomModal(null)}><FaPlus /> Добавить кабинет</button>
                </div>
                <div className="table-container">
                    <h3 className="table-title"><FaDoorOpen /> Список кабинетов ({rooms.length})</h3>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr><th>№</th><th>Название</th><th>Приоритетные предметы</th><th>Закрепленные учителя</th><th>Действия</th></tr>
                            </thead>
                            <tbody>
                                {rooms.length > 0 ? rooms.map(room => {
                                    const roomTeachers = room.teachers || [];
                                    return (
                                        <tr key={room.id}>
                                            <td><strong>{room.number}</strong></td>
                                            <td>{room.name || '-'}</td>
                                            <td>
                                                <div className="priority-subjects-list">
                                                    {room.lesson_priorities?.length > 0 
                                                        ? room.lesson_priorities.map((lp, i) => <span key={i} className="priority-subject-tag">{lp.lesson_name || lp.name}</span>)
                                                        : <span className="no-priority">Нет приоритетов</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="priority-subjects-list">
                                                    {roomTeachers.length > 0 
                                                        ? roomTeachers.map((teacher, i) => <span key={i} className="teacher-tag" style={{ background: teacher.color || '#3b82f6' }}>{teacher.name}</span>)
                                                        : <span className="no-priority">Нет учителей</span>}
                                                    <button className="edit-subjects-btn" onClick={() => openTeacherAssignmentModal(room)} style={{ background: '#21435A', color: 'white', border: 'none' }}>
                                                        <FaUserPlus /> Добавить учителей
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="action-cell">
                                                <button onClick={() => openRoomModal(room)} className="action-button edit-button"><FaEdit /></button>
                                                <button onClick={() => openDeleteConfirm(room.id, room.number)} className="action-button delete-button"><FaTrash /></button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="5" className="empty-row"><FaDoorOpen /><p>Нет кабинетов</p><button onClick={() => openRoomModal(null)}>Добавить</button></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <RoomModal isOpen={roomModalOpen} onClose={() => { setRoomModalOpen(false); setEditingRoom(null); }} onSave={handleSaveRoom} room={editingRoom} lessonsList={lessons} />
            <ConfirmDeleteModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, itemId: null, itemName: '', itemType: '' })} onConfirm={handleDeleteRoom} itemName={confirmModal.itemName} itemType={confirmModal.itemType} />
            <TeacherAssignmentModal isOpen={teacherAssignmentModalOpen} onClose={() => { setTeacherAssignmentModalOpen(false); setCurrentRoomForTeachers(null); }} onSave={handleAssignTeachers} room={currentRoomForTeachers} />
        </>
    );
};

export default RoomsTab;