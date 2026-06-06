// frontend/src/components/sanpin/GroupDivisionTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaPlus, FaTrash, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DAYS_RU = {
    'monday': 'Понедельник',
    'tuesday': 'Вторник',
    'wednesday': 'Среда',
    'thursday': 'Четверг',
    'friday': 'Пятница',
    'saturday': 'Суббота',
    'sunday': 'Воскресенье'
};

const DAYS_OPTIONS = [
    { value: 'monday', label: 'Понедельник' },
    { value: 'tuesday', label: 'Вторник' },
    { value: 'wednesday', label: 'Среда' },
    { value: 'thursday', label: 'Четверг' },
    { value: 'friday', label: 'Пятница' }
];

const GroupDivisionTab = ({ token }) => {
    const [links, setLinks] = useState([]);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ 
        class_id: '', teacher_pair: [], room_ids: [], day_of_week: '', start_slot: '' 
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [linksRes, classesRes, teachersRes, roomsRes] = await Promise.all([
                axios.get(`${API_URL}/superadmin/group-division-links`, config),
                axios.get(`${API_URL}/superadmin/classes`, config),
                axios.get(`${API_URL}/superadmin/teachers`, config),
                axios.get(`${API_URL}/superadmin/rooms`, config)
            ]);
            setLinks(linksRes.data);
            setClasses(classesRes.data);
            setTeachers(teachersRes.data);
            setRooms(roomsRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.class_id || formData.teacher_pair.length !== 2 || formData.room_ids.length !== 2 || !formData.day_of_week || !formData.start_slot) {
            return;
        }
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = { 
                ...formData, 
                teacher_pair: JSON.stringify(formData.teacher_pair), 
                room_ids: JSON.stringify(formData.room_ids) 
            };
            if (editing) {
                await axios.put(`${API_URL}/superadmin/group-division-links/${editing.id}`, payload, config);
            } else {
                await axios.post(`${API_URL}/superadmin/group-division-links`, payload, config);
            }
            await loadData();
            setModalOpen(false);
            setEditing(null);
            setFormData({ class_id: '', teacher_pair: [], room_ids: [], day_of_week: '', start_slot: '' });
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить связь? Это действие нельзя отменить.')) {
            setLoading(true);
            try {
                await axios.delete(`${API_URL}/superadmin/group-division-links/${id}`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                });
                await loadData();
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
    };

    const handleTeacherChange = (teacherId) => {
        let newPair = [...formData.teacher_pair];
        if (newPair.includes(teacherId)) {
            newPair = newPair.filter(id => id !== teacherId);
        } else if (newPair.length < 2) {
            newPair.push(teacherId);
        }
        setFormData({ ...formData, teacher_pair: newPair });
    };

    const handleRoomChange = (roomId) => {
        let newRooms = [...formData.room_ids];
        if (newRooms.includes(roomId)) {
            newRooms = newRooms.filter(id => id !== roomId);
        } else if (newRooms.length < 2) {
            newRooms.push(roomId);
        }
        setFormData({ ...formData, room_ids: newRooms });
    };

    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId);
        return teacher?.name || '—';
    };

    const getTeacherColor = (teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId);
        return teacher?.color || '#21435A';
    };

    const getRoomNumber = (roomId) => {
        const room = rooms.find(r => r.id === roomId);
        return room?.number || roomId;
    };

    return (
        <div className="group-division-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0 }}><FaUsers style={{ marginRight: '8px' }} /> Групповые занятия (информатика/английский)</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
                        Деление класса на подгруппы для изучения английского языка и информатики
                    </p>
                </div>
                <button className="add-room-btn" onClick={() => setModalOpen(true)} disabled={loading}>
                    <FaPlus /> Добавить связь
                </button>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>}

            {!loading && (
                <div className="group-division-table-container">
                    <table className="group-division-table">
                        <thead>
                            <tr>
                                <th>Класс</th><th>Учителя</th><th>Кабинеты</th>
                                <th>День</th><th>Стартовый урок</th><th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {links.length === 0 ? (
                                <tr className="empty-row">
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                        Нет связей. Нажмите "Добавить связь"
                                    </td>
                                </tr>
                            ) : (
                                links.map(link => (
                                    <tr key={link.id}>
                                        <td><strong>{link.class_name}</strong></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {link.teacher_pair?.map((teacherId, idx) => (
                                                    teacherId ? (
                                                        <span 
                                                            key={idx} 
                                                            className="teacher-pair-tag"
                                                            style={{ 
                                                                background: getTeacherColor(teacherId),
                                                                padding: '4px 12px',
                                                                borderRadius: '20px',
                                                                color: '#fff',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            {getTeacherName(teacherId)}
                                                        </span>
                                                    ) : null
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {link.room_ids?.map((roomId, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        className="room-pair-tag"
                                                        style={{ 
                                                            background: '#3b82f6',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            color: '#fff',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {getRoomNumber(roomId)}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="group-day-badge">
                                                {DAYS_RU[link.day_of_week] || link.day_of_week}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="pairing-slots">{link.start_slot}</span>
                                        </td>
                                        <td className="action-cell">
                                            <button className="action-button delete-button" onClick={() => handleDelete(link.id)}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FaInfoCircle style={{ color: '#0284c7' }} />
                    <strong style={{ color: '#0284c7' }}>Что такое групповые занятия?</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.75rem', color: '#475569' }}>
                    <li>Класс делится на две подгруппы</li>
                    <li>Одна подгруппа занимается с одним учителем в одном кабинете</li>
                    <li>Вторая подгруппа — с другим учителем в другом кабинете</li>
                    <li>Обычно используется для английского языка и информатики</li>
                </ul>
            </div>

            {modalOpen && (
                <div className="modal-overlay-fixed" onClick={() => setModalOpen(false)}>
                    <div className="modal-content-fixed" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header-fixed" style={{ background: '#21435A' }}>
                            <h3 style={{ color: 'white' }}>Добавить групповую связь</h3>
                            <button className="modal-close-fixed" onClick={() => setModalOpen(false)} style={{ color: 'white' }}><FaTimes /></button>
                        </div>
                        <div className="modal-body-fixed">
                            <div className="form-group"><label>Класс *</label><select value={formData.class_id} onChange={e => setFormData({...formData, class_id: parseInt(e.target.value)})}><option value="">Выберите класс</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div className="form-group"><label>Учителя (выберите 2) *</label><div className="teachers-checkboxes">{teachers.map(t => (<label key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: t.color || '#e2e8f0', color: '#fff', margin: '4px' }}><input type="checkbox" checked={formData.teacher_pair.includes(t.id)} onChange={() => handleTeacherChange(t.id)} /> {t.name}</label>))}</div><small>Выберите двух учителей для группового занятия</small></div>
                            <div className="form-group"><label>Кабинеты (выберите 2) *</label><div className="rooms-checkboxes">{rooms.map(r => (<label key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: '#f1f5f9', borderRadius: '20px', margin: '4px' }}><input type="checkbox" checked={formData.room_ids.includes(r.id)} onChange={() => handleRoomChange(r.id)} /> {r.number} {r.name && `(${r.name})`}</label>))}</div><small>Выберите два кабинета</small></div>
                            <div className="form-row"><div className="form-group"><label>День недели *</label><select value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: e.target.value})}><option value="">Выберите день</option>{DAYS_OPTIONS.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}</select></div>
                            <div className="form-group"><label>Стартовый урок (номер) *</label><input type="number" min="1" max="7" value={formData.start_slot} onChange={e => setFormData({...formData, start_slot: parseInt(e.target.value)})} placeholder="например: 1" /><small>С какого урока начинается занятие у первой группы</small></div></div>
                        </div>
                        <div className="modal-footer-fixed">
                            <button className="btn-cancel-modal" onClick={() => setModalOpen(false)}>Отмена</button>
                            <button className="btn-save-modal" onClick={handleSave} disabled={loading}><FaSave /> {loading ? 'Сохранение...' : 'Сохранить'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDivisionTab;