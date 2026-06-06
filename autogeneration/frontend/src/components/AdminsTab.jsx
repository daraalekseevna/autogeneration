// AdminsTab.jsx
import React, { useState } from 'react';
import { FaUserPlus, FaUsers, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminsTab = ({ admins, token, onDataChange }) => {
    const [newAdmin, setNewAdmin] = useState({ login: '', password: '', name: '' });
    const [editAdminModalOpen, setEditAdminModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [notification, setNotification] = useState('');

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const clearAdminForm = () => setNewAdmin({ login: '', password: '', name: '' });

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        if (!newAdmin.login || !newAdmin.password || !newAdmin.name) {
            showNotification('Заполните все поля');
            return;
        }
        try {
            await axios.post(`${API_URL}/superadmin/admins`, newAdmin, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Администратор добавлен');
            clearAdminForm();
            onDataChange();
        } catch (err) {
            console.error('Add admin error:', err);
            showNotification(err.response?.data?.message || 'Ошибка');
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm('Удалить администратора?')) return;
        try {
            await axios.delete(`${API_URL}/superadmin/admins/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Администратор удалён');
            onDataChange();
        } catch (err) {
            console.error('Delete admin error:', err);
            showNotification('Ошибка удаления');
        }
    };

    const handleUpdateAdmin = async (adminData) => {
        try {
            await axios.put(`${API_URL}/superadmin/admins/${adminData.id}`, adminData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Администратор обновлен');
            onDataChange();
            setEditAdminModalOpen(false);
            setEditingAdmin(null);
        } catch (err) {
            console.error('Update admin error:', err);
            showNotification(err.response?.data?.message || 'Ошибка обновления');
            throw err;
        }
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
            } finally {
                setSaving(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="subject-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="subject-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                    <div className="subject-modal-header">
                        <h3><FaEdit /> Редактировать администратора</h3>
                        <button className="subject-modal-close" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="room-modal-body">
                            <div className="form-group">
                                <label>ФИО *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={saving} />
                            </div>
                            <div className="form-group">
                                <label>Логин</label>
                                <input type="text" value={formData.login} disabled style={{ background: '#f0f0f0' }} />
                                <small>Логин нельзя изменить</small>
                            </div>
                        </div>
                        <div className="room-modal-footer">
                            <button type="button" className="btn-cancel" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                            <button type="submit" className="btn-save" disabled={saving}><FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <>
            {notification && <div className="notification">{notification}</div>}
            <div className="content-grid">
                <div className="form-container">
                    <h3 className="form-title"><FaUserPlus /> Новый администратор</h3>
                    <form onSubmit={handleAddAdmin}>
                        <div className="form-group">
                            <label>Логин *</label>
                            <input type="text" value={newAdmin.login} onChange={(e) => setNewAdmin({...newAdmin, login: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>Пароль *</label>
                            <input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>ФИО *</label>
                            <input type="text" value={newAdmin.name} onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})} required />
                        </div>
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
                                            <button onClick={() => handleDeleteAdmin(a.id)} className="action-button delete-button" style={{ background: '#dc2626' }}><FaTrash /></button>
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
            <EditAdminModal isOpen={editAdminModalOpen} onClose={() => setEditAdminModalOpen(false)} onSave={handleUpdateAdmin} admin={editingAdmin} />
        </>
    );
};

export default AdminsTab;