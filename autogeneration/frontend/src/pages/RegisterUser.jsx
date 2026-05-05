import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import '../styles/RegisterUser.css';

const RegisterUser = () => {
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        role: 'admin',
        teacherId: '',
        classId: ''
    });
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!token || user.role !== 'superadmin') {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [teachersRes, classesRes] = await Promise.all([
                    axios.get('/api/teachers', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('/api/classes', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setTeachers(teachersRes.data);
                setClasses(classesRes.data);
            } catch (err) {
                setError('Не удалось загрузить данные');
            }
        };
        fetchData();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const token = localStorage.getItem('token');
        try {
            await axios.post('/api/register', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Пользователь успешно создан');
            setFormData({ login: '', password: '', role: 'admin', teacherId: '', classId: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при создании пользователя');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <ThemeToggle />
            <BackButton fallbackPath="/superadmin" />
            
            {/* <div className="animated-bg">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div> */}
            
            <h2>Регистрация нового пользователя</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                    <label>Логин</label>
                    <input
                        type="text"
                        name="login"
                        value={formData.login}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Пароль</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Роль</label>
                    <select name="role" value={formData.role} onChange={handleChange}>
                        <option value="admin">Администратор</option>
                        <option value="teacher">Учитель</option>
                        <option value="class">Класс</option>
                    </select>
                </div>

                {formData.role === 'teacher' && (
                    <div className="form-group">
                        <label>Выберите учителя</label>
                        <select name="teacherId" value={formData.teacherId} onChange={handleChange} required>
                            <option value="">-- Выберите учителя --</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.last_name} {t.first_name} {t.middle_name || ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {formData.role === 'class' && (
                    <div className="form-group">
                        <label>Выберите класс</label>
                        <select name="classId" value={formData.classId} onChange={handleChange} required>
                            <option value="">-- Выберите класс --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.grade}{c.letter})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? 'Создание...' : 'Создать пользователя'}
                </button>
            </form>
        </div>
    );
};

export default RegisterUser;