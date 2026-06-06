// frontend/src/components/sanpin/ParallelSyncTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSync, FaPlus, FaTrash, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ParallelSyncTab = ({ token }) => {
    const [items, setItems] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ grade: '', subject_id: '', same_day_required: true });
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [itemsRes, lessonsRes] = await Promise.all([
                axios.get(`${API_URL}/superadmin/class-parallel-sync`, config),
                axios.get(`${API_URL}/superadmin/lessons`, config)
            ]);
            setItems(itemsRes.data);
            setLessons(lessonsRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.grade || !formData.subject_id) { return; }
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${API_URL}/superadmin/class-parallel-sync`, formData, config);
            await loadData();
            setModalOpen(false);
            setFormData({ grade: '', subject_id: '', same_day_required: true });
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить запись? Это действие нельзя отменить.')) {
            setLoading(true);
            try {
                await axios.delete(`${API_URL}/superadmin/class-parallel-sync/${id}`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                });
                await loadData();
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
    };

    return (
        <div className="parallel-sync-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}><FaSync style={{ marginRight: '8px' }} /> Синхронизация предметов в параллелях</h3>
                <button className="add-room-btn" onClick={() => setModalOpen(true)} disabled={loading}>
                    <FaPlus /> Добавить синхронизацию
                </button>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>}

            {!loading && (
                <div className="parallel-sync-table-container">
                    <table className="parallel-sync-table">
                        <thead>
                            <tr>
                                <th>Класс (параллель)</th><th>Предмет</th>
                                <th>Обязательно в один день</th><th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr className="empty-row">
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Нет записей. Нажмите "Добавить синхронизацию"</td>
                                </tr>
                            ) : (
                                items.map(item => (
                                    <tr key={item.id}>
                                        <td><span className="grade-badge">{item.grade} классы</span></td>
                                        <td><strong>{item.subject_name}</strong></td>
                                        <td>{item.same_day_required ? 
                                            <span className="sync-required-badge yes">✓ Да, в один день</span> : 
                                            <span className="sync-required-badge no">Нет</span>}</td>
                                        <td className="action-cell">
                                            <button className="action-button delete-button" onClick={() => handleDelete(item.id)}>
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
                    <strong style={{ color: '#0284c7' }}>Что такое синхронизация?</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.75rem', color: '#475569' }}>
                    <li>Для начальной школы (1-4 классы) математика, окружающий мир и литературное чтение должны быть в один день у всех классов параллели</li>
                    <li>Это правило обеспечивает одинаковое расписание для всех классов одного года обучения</li>
                </ul>
            </div>

            {modalOpen && (
                <div className="modal-overlay-fixed" onClick={() => setModalOpen(false)}>
                    <div className="modal-content-fixed" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header-fixed" style={{ background: '#21435A' }}>
                            <h3 style={{ color: 'white' }}>Добавить синхронизацию</h3>
                            <button className="modal-close-fixed" onClick={() => setModalOpen(false)} style={{ color: 'white' }}><FaTimes /></button>
                        </div>
                        <div className="modal-body-fixed">
                            <div className="form-group"><label>Параллель (класс) *</label><select value={formData.grade} onChange={e => setFormData({...formData, grade: parseInt(e.target.value)})}><option value="">Выберите</option>{[1,2,3,4,5,6,7,8,9,10,11].map(g => <option key={g} value={g}>{g} классы</option>)}</select></div>
                            <div className="form-group"><label>Предмет *</label><select value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: parseInt(e.target.value)})}><option value="">Выберите предмет</option>{lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                            <div className="form-group"><label><input type="checkbox" checked={formData.same_day_required} onChange={e => setFormData({...formData, same_day_required: e.target.checked})} /> Требовать, чтобы предмет был в один день у всех классов этой параллели</label></div>
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

export default ParallelSyncTab;