// src/frontend/components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const BackButton = ({ fallbackPath = '/' }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(fallbackPath);
        }
    };

    return (
        <button className="global-back-btn" onClick={handleBack} title="Назад">
            <FaArrowLeft />
            <span>Назад</span>
        </button>
    );
};

export default BackButton;