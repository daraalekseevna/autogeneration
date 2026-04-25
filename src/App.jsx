// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './frontend/components/ProtectedRoute';
import Login from './frontend/pages/Login';
import MainContent from './frontend/pages/MainContent';
import ExcelGenerator from './frontend/pages/ExcelGenerator';
import ScheduleViewer from './frontend/pages/ScheduleViewer';
import ExtracurricularActivities from './frontend/pages/ExtracurricularActivities';
import SuperAdminDashboard from './frontend/pages/SuperAdminDashboard';
import TeacherSchedule from './frontend/pages/TeacherSchedule';
import TeacherMySchedule from './frontend/pages/TeacherMySchedule';
import TeacherClassManagement from './frontend/pages/TeacherClassManagement';
import ClassSchedule from './frontend/pages/ClassSchedule';
import AdminScheduleEditor from './frontend/pages/AdminScheduleEditor';
import AdminFullScheduleEditor from './frontend/pages/AdminFullScheduleEditor';

import './App.css';

function App() {
    return (
        <Router>
            <div className="app">
                <main className="main-wrapper">
                    <Routes>
                        {/* Страница входа - доступна всем */}
                        <Route path="/login" element={<Login />} />
                        
                        {/* Главная страница - только для админов и суперадмина */}
                        <Route path="/" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                <MainContent />
                            </ProtectedRoute>
                        } />
                        
                        {/* Генератор расписания - только для админов и суперадмина */}
                        <Route path="/generate" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                <ExcelGenerator />
                            </ProtectedRoute>
                        } />
                        
                        {/* Просмотр расписания - доступно всем ролям */}
                        <Route path="/admin/schedule" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin', 'teacher', 'class']}>
                                <ScheduleViewer />
                            </ProtectedRoute>
                        } />
                        
                        {/* Администратор: Редактор расписания всей школы - только для админов и суперадмина */}
                        <Route path="/admin/schedule-editor" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                <AdminScheduleEditor />
                            </ProtectedRoute>
                        } />
                        
                        {/* Внешкольные занятия - только для админов и суперадмина (полный доступ) */}
                        <Route path="/extracurricular" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                <ExtracurricularActivities />
                            </ProtectedRoute>
                        } />
                        
                        {/* Внешкольные занятия для класса - только просмотр (добавлен новый маршрут) */}
                        <Route path="/class/extracurricular" element={
                            <ProtectedRoute allowedRoles={['class']}>
                                <ExtracurricularActivities />
                            </ProtectedRoute>
                        } />
                        
                        {/* Панель супер-администратора - только для суперадмина */}
                        <Route path="/superadmin" element={
                            <ProtectedRoute allowedRoles={['superadmin']}>
                                <SuperAdminDashboard />
                            </ProtectedRoute>
                        } />
                        
                        {/* Панель учителя - только для учителей */}
                        <Route path="/teacher" element={
                            <ProtectedRoute allowedRoles={['teacher']}>
                                <TeacherSchedule />
                            </ProtectedRoute>
                        } />
                        
                        {/* Расписание учителя (моё расписание) - только для учителей */}
                        <Route path="/teacher/my-schedule" element={
                            <ProtectedRoute allowedRoles={['teacher']}>
                                <TeacherMySchedule />
                            </ProtectedRoute>
                        } />
                        
                        {/* Классное руководство учителя - только для учителей */}
                        <Route path="/teacher/class-management" element={
                            <ProtectedRoute allowedRoles={['teacher']}>
                                <TeacherClassManagement />
                            </ProtectedRoute>
                        } />
                       
                            <Route path="/admin/full-schedule" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                <AdminFullScheduleEditor />
                            </ProtectedRoute>
                            } />
                        {/* Расписание класса - только для классов */}
                        <Route path="/class" element={
                            <ProtectedRoute allowedRoles={['class']}>
                                <ClassSchedule />
                            </ProtectedRoute>
                        } />
                        
                        {/* Перенаправление с корня на логин */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;