// frontend/src/components/sanpin/GroupDivisionTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaUsers, FaPlus, FaTrash, FaSave, FaTimes, FaInfoCircle, 
    FaChalkboardTeacher, FaDoorOpen, FaCalendarAlt, FaClock,
    FaCheckCircle, FaUserGraduate, FaSchool, FaBuilding,
    FaUserTie, FaSearch, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import styles from '../styles/GroupDivisionTab.module.css';
import '../styles/SuperAdmin.css';

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
    { value: 'monday', label: 'Понедельник', icon: '', short: 'ПН' },
    { value: 'tuesday', label: 'Вторник', icon: '', short: 'ВТ' },
    { value: 'wednesday', label: 'Среда', icon: '', short: 'СР' },
    { value: 'thursday', label: 'Четверг', icon: '', short: 'ЧТ' },
    { value: 'friday', label: 'Пятница', icon: '', short: 'ПТ' }
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
    const [searchTeacher, setSearchTeacher] = useState('');
    const [searchRoom, setSearchRoom] = useState('');
    const [notification, setNotification] = useState('');

    const showNotification = (message, isError = false) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

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
        } catch (err) { 
            console.error(err);
            showNotification('Ошибка загрузки данных', true);
        }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.class_id) {
            showNotification('Выберите класс', true);
            return;
        }
        if (formData.teacher_pair.length !== 2) {
            showNotification('Выберите 2 учителей', true);
            return;
        }
        if (formData.room_ids.length !== 2) {
            showNotification('Выберите 2 кабинета', true);
            return;
        }
        if (!formData.day_of_week) {
            showNotification('Выберите день недели', true);
            return;
        }
        if (!formData.start_slot) {
            showNotification('Укажите стартовый урок', true);
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
                showNotification('Связь обновлена');
            } else {
                await axios.post(`${API_URL}/superadmin/group-division-links`, payload, config);
                showNotification('Связь добавлена');
            }
            await loadData();
            setModalOpen(false);
            setEditing(null);
            setFormData({ class_id: '', teacher_pair: [], room_ids: [], day_of_week: '', start_slot: '' });
        } catch (err) { 
            console.error(err);
            showNotification('Ошибка сохранения', true);
        }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить связь? Это действие нельзя отменить.')) {
            setLoading(true);
            try {
                await axios.delete(`${API_URL}/superadmin/group-division-links/${id}`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                });
                showNotification('Связь удалена');
                await loadData();
            } catch (err) { 
                console.error(err);
                showNotification('Ошибка удаления', true);
            }
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

    const getRoomName = (roomId) => {
        const room = rooms.find(r => r.id === roomId);
        return room?.name || '';
    };

    const filteredTeachers = teachers.filter(t => 
        t.name?.toLowerCase().includes(searchTeacher.toLowerCase())
    );

    const filteredRooms = rooms.filter(r => 
        r.number?.toLowerCase().includes(searchRoom.toLowerCase()) ||
        r.name?.toLowerCase().includes(searchRoom.toLowerCase())
    );

    const getSelectedClass = () => {
        return classes.find(c => c.id === formData.class_id);
    };

    return (
        <div className={styles.tabWrapper}>
            {notification && (
                <div className={styles.notification}>
                    <FaCheckCircle size={16} />
                    <span>{notification}</span>
                </div>
            )}

            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <FaUsers size={24} />
                    </div>
                    <div>
                        <h2>Групповые занятия</h2>
                        <p>Деление класса на подгруппы для английского языка и информатики</p>
                    </div>
                </div>
                <button className={styles.addButton} onClick={() => setModalOpen(true)} disabled={loading}>
                    <FaPlus size={14} />
                    <span>Добавить связь</span>
                </button>
            </div>

            {loading && links.length === 0 ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Загрузка...</p>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Класс</th>
                                <th>Учителя</th>
                                <th>Кабинеты</th>
                                <th>День</th>
                                <th>Стартовый урок</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {links.length === 0 ? (
                                <tr className={styles.emptyRow}>
                                    <td colSpan="6">
                                        <div className={styles.emptyState}>
                                            <div className={styles.emptyIcon}>
                                                <FaUsers size={48} />
                                            </div>
                                            <h4>Нет связей</h4>
                                            <p>Нажмите "Добавить связь", чтобы создать первую групповую связь</p>
                                            <button className={styles.emptyButton} onClick={() => setModalOpen(true)}>
                                                <FaPlus /> Добавить связь
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                links.map(link => (
                                    <tr key={link.id} className={styles.tableRow}>
                                        <td className={styles.classCell}>
                                            <FaSchool size={14} />
                                            <strong>{link.class_name}</strong>
                                        </td>
                                        <td>
                                            <div className={styles.teachersGroup}>
                                                {link.teacher_pair?.map((teacherId, idx) => (
                                                    teacherId ? (
                                                        <span 
                                                            key={idx} 
                                                            className={styles.teacherTag}
                                                            style={{ background: getTeacherColor(teacherId) }}
                                                        >
                                                            <FaUserTie size={10} />
                                                            {getTeacherName(teacherId)}
                                                        </span>
                                                    ) : null
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.roomsGroup}>
                                                {link.room_ids?.map((roomId, idx) => (
                                                    <span key={idx} className={styles.roomTag}>
                                                        <FaDoorOpen size={10} />
                                                        {getRoomNumber(roomId)}
                                                        {getRoomName(roomId) && <span className={styles.roomName}>({getRoomName(roomId)})</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.dayBadge}>
                                                {DAYS_RU[link.day_of_week] || link.day_of_week}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.slotBadge}>
                                                <FaClock size={10} />
                                                {link.start_slot} урок
                                            </span>
                                        </td>
                                        <td className={styles.actionsCell}>
                                            <button 
                                                className={`${styles.actionButton} ${styles.deleteButton}`} 
                                                onClick={() => handleDelete(link.id)}
                                                title="Удалить связь"
                                            >
                                                <FaTrash size={14} />
                                                <span>Удалить</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                    <FaInfoCircle size={18} />
                </div>
                <div className={styles.infoContent}>
                    <strong>Что такое групповые занятия?</strong>
                    <ul>
                        <li>Класс делится на две подгруппы</li>
                        <li>Одна подгруппа занимается с одним учителем в одном кабинете</li>
                        <li>Вторая подгруппа — с другим учителем в другом кабинете</li>
                        <li>Обычно используется для английского языка и информатики</li>
                    </ul>
                </div>
            </div>

            {/* КРАСИВАЯ МОДАЛЬНАЯ ФОРМА */}
            {modalOpen && (
                <div className={styles.modalOverlay} onClick={() => !loading && setModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderIcon}>
                                {editing ? <FaUsers size={20} /> : <FaPlus size={20} />}
                            </div>
                            <h3>{editing ? 'Редактировать связь' : 'Новая групповая связь'}</h3>
                            <button className={styles.modalClose} onClick={() => !loading && setModalOpen(false)} disabled={loading}>
                                <FaTimes size={18} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Выбор класса */}
                            <div className={styles.formGroup}>
                                <label>
                                    <FaSchool size={12} />
                                    <span>Класс</span>
                                    <span className={styles.required}>*</span>
                                </label>
                                <select 
                                    value={formData.class_id} 
                                    onChange={e => setFormData({...formData, class_id: parseInt(e.target.value)})}
                                    className={styles.select}
                                >
                                    <option value="">Выберите класс</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {getSelectedClass() && (
                                    <div className={styles.formHint}>
                                        <FaInfoCircle size={10} />
                                        Выбран класс <strong>{getSelectedClass().name}</strong>
                                    </div>
                                )}
                            </div>

                            {/* Выбор учителей */}
                            <div className={styles.formGroup}>
                                <label>
                                    <FaChalkboardTeacher size={12} />
                                    <span>Учителя</span>
                                    <span className={styles.required}>* (выберите 2)</span>
                                </label>
                                <div className={styles.searchBox}>
                                    <FaSearch size={12} className={styles.searchIcon} />
                                    <input 
                                        type="text"
                                        placeholder="Поиск учителя..."
                                        value={searchTeacher}
                                        onChange={e => setSearchTeacher(e.target.value)}
                                        className={styles.searchInput}
                                    />
                                </div>
                                <div className={styles.selectionGrid}>
                                    {filteredTeachers.map(t => (
                                        <div 
                                            key={t.id}
                                            className={`${styles.selectionCard} ${formData.teacher_pair.includes(t.id) ? styles.selected : ''}`}
                                            onClick={() => handleTeacherChange(t.id)}
                                        >
                                            <div className={styles.selectionCardLeft}>
                                                <div 
                                                    className={styles.selectionCardColor}
                                                    style={{ background: t.color || '#21435A' }}
                                                />
                                                <div className={styles.selectionCardInfo}>
                                                    <span className={styles.selectionCardName}>{t.name}</span>
                                                    <span className={styles.selectionCardSubjects}>
                                                        {t.subjects?.slice(0, 2).join(', ')}{t.subjects?.length > 2 ? '...' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            {formData.teacher_pair.includes(t.id) && (
                                                <div className={styles.checkmark}>
                                                    <FaCheckCircle size={16} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {filteredTeachers.length === 0 && (
                                        <div className={styles.noResults}>
                                            <FaInfoCircle size={20} />
                                            <span>Учителя не найдены</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.selectionStatus}>
                                    <span className={styles.selectionCount}>
                                        Выбрано: {formData.teacher_pair.length}/2 учителей
                                    </span>
                                    {formData.teacher_pair.length === 2 && (
                                        <span className={styles.selectionComplete}>✓ Готово</span>
                                    )}
                                </div>
                            </div>

                            {/* Выбор кабинетов */}
                            <div className={styles.formGroup}>
                                <label>
                                    <FaBuilding size={12} />
                                    <span>Кабинеты</span>
                                    <span className={styles.required}>* (выберите 2)</span>
                                </label>
                                <div className={styles.searchBox}>
                                    <FaSearch size={12} className={styles.searchIcon} />
                                    <input 
                                        type="text"
                                        placeholder="Поиск кабинета..."
                                        value={searchRoom}
                                        onChange={e => setSearchRoom(e.target.value)}
                                        className={styles.searchInput}
                                    />
                                </div>
                                <div className={styles.selectionGrid}>
                                    {filteredRooms.map(r => (
                                        <div 
                                            key={r.id}
                                            className={`${styles.selectionCard} ${formData.room_ids.includes(r.id) ? styles.selected : ''}`}
                                            onClick={() => handleRoomChange(r.id)}
                                        >
                                            <div className={styles.selectionCardLeft}>
                                                <div className={styles.roomNumberIcon}>
                                                    <FaDoorOpen size={14} />
                                                </div>
                                                <div className={styles.selectionCardInfo}>
                                                    <span className={styles.selectionCardName}>{r.number}</span>
                                                    {r.name && <span className={styles.selectionCardSubjects}>{r.name}</span>}
                                                </div>
                                            </div>
                                            {formData.room_ids.includes(r.id) && (
                                                <div className={styles.checkmark}>
                                                    <FaCheckCircle size={16} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {filteredRooms.length === 0 && (
                                        <div className={styles.noResults}>
                                            <FaInfoCircle size={20} />
                                            <span>Кабинеты не найдены</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.selectionStatus}>
                                    <span className={styles.selectionCount}>
                                        Выбрано: {formData.room_ids.length}/2 кабинетов
                                    </span>
                                    {formData.room_ids.length === 2 && (
                                        <span className={styles.selectionComplete}>✓ Готово</span>
                                    )}
                                </div>
                            </div>

                            {/* День недели и стартовый урок */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>
                                        <FaCalendarAlt size={12} />
                                        <span>День недели</span>
                                        <span className={styles.required}>*</span>
                                    </label>
                                    <div className={styles.daySelector}>
                                        {DAYS_OPTIONS.map(day => (
                                            <button
                                                key={day.value}
                                                type="button"
                                                className={`${styles.dayButton} ${formData.day_of_week === day.value ? styles.active : ''}`}
                                                onClick={() => setFormData({...formData, day_of_week: day.value})}
                                            >
                                                <span className={styles.dayEmoji}>{day.icon}</span>
                                                <span className={styles.dayShort}>{day.short}</span>
                                                <span className={styles.dayFull}>{day.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>
                                        <FaClock size={12} />
                                        <span>Стартовый урок</span>
                                        <span className={styles.required}>*</span>
                                    </label>
                                    <div className={styles.slotSelector}>
                                        {[1, 2, 3, 4, 5, 6, 7].map(slot => (
                                            <button
                                                key={slot}
                                                type="button"
                                                className={`${styles.slotButton} ${formData.start_slot === slot ? styles.active : ''}`}
                                                onClick={() => setFormData({...formData, start_slot: slot})}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                    <div className={styles.formHint}>
                                        <FaInfoCircle size={10} />
                                        С какого урока начинается занятие у первой группы
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelButton} onClick={() => !loading && setModalOpen(false)} disabled={loading}>
                                Отмена
                            </button>
                            <button className={styles.saveButton} onClick={handleSave} disabled={loading}>
                                {loading ? (
                                    <>
                                        <div className={styles.buttonSpinner}></div>
                                        Сохранение...
                                    </>
                                ) : (
                                    <>
                                        <FaSave size={14} />
                                        {editing ? 'Сохранить изменения' : 'Добавить связь'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDivisionTab;