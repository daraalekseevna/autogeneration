// src/frontend/config/extracurricular/display.js

export const DisplayConfig = {
    // Настройки расписания
    schedule: {
        timeColumnWidth: 100,
        cellHeight: 90,
        activityPadding: 4,
        borderColor: "rgba(33, 67, 90, 0.1)",
        cellSpacing: 1,
        headerHeight: 80,
        lessonDuration: 45, // минут
        breakDuration: 15 // минут
    },
    
    // Цвета темы
    colors: {
        primary: "#21435A",
        secondary: "#2c5475",
        success: "#4CAF50",
        danger: "#f44336",
        warning: "#FF9800",
        info: "#2196F3",
        light: "#f8f9fa",
        dark: "#343a40",
        gray: "#6c757d",
        background: "#f5f7fa"
    },
    
    // Шрифты
    fonts: {
        primary: "'MS Reference Sans Serif', 'Segoe UI', sans-serif",
        secondary: "'Arial', 'Helvetica', sans-serif",
        monospace: "'Courier New', monospace"
    },
    
    // Тени и эффекты
    shadows: {
        small: "0 2px 8px rgba(0, 0, 0, 0.08)",
        medium: "0 4px 16px rgba(0, 0, 0, 0.12)",
        large: "0 8px 32px rgba(33, 67, 90, 0.1)",
        inset: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
        card: "0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)"
    },
    
    // Закругления
    borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        circle: "50%"
    },
    
    // Анимации
    animations: {
        duration: {
            fast: "150ms",
            normal: "300ms",
            slow: "500ms",
            verySlow: "1000ms"
        },
        easing: {
            ease: "ease",
            easeIn: "ease-in",
            easeOut: "ease-out",
            easeInOut: "ease-in-out",
            spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
        },
        keyframes: {
            fadeIn: `@keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }`,
            slideIn: `@keyframes slideIn {
                from { transform: translateX(-20px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }`,
            pulse: `@keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }`
        }
    },
    
    // Отступы
    spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px"
    },
    
    // Размеры шрифтов
    fontSizes: {
        xs: "0.75rem",
        sm: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        xxl: "1.5rem",
        xxxl: "2rem"
    },
    
    // Ширины и высоты
    dimensions: {
        button: {
            small: "32px",
            medium: "40px",
            large: "48px"
        },
        input: {
            small: "32px",
            medium: "40px",
            large: "48px"
        },
        icon: {
            small: "16px",
            medium: "24px",
            large: "32px"
        }
    },
    
    // Функции-помощники
    helpers: {
        // Получение стилей для урока
        getLessonStyle(color, type = "regular") {
            const baseStyle = {
                backgroundColor: `${color}15`,
                borderLeft: `4px solid ${color}`,
                color: this.getContrastColor(color),
                borderRadius: DisplayConfig.borderRadius.sm,
                padding: DisplayConfig.spacing.sm,
                margin: "2px",
                transition: `all ${DisplayConfig.animations.duration.normal} ${DisplayConfig.animations.easing.ease}`
            };
            
            switch (type) {
                case "extracurricular":
                    return {
                        ...baseStyle,
                        borderStyle: "dashed",
                        backgroundColor: `${color}10`
                    };
                case "individual":
                    return {
                        ...baseStyle,
                        borderStyle: "dotted",
                        backgroundColor: `${color}08`
                    };
                case "conflict":
                    return {
                        ...baseStyle,
                        borderColor: DisplayConfig.colors.danger,
                        backgroundColor: `${DisplayConfig.colors.danger}15`
                    };
                default:
                    return baseStyle;
            }
        },
        
        // Получение контрастного цвета текста
        getContrastColor(hexColor) {
            // Простая функция для определения контрастного цвета
            if (!hexColor || hexColor.length < 7) return "#000000";
            
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            
            // Формула яркости
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            
            return brightness > 128 ? "#000000" : "#FFFFFF";
        },
        
        // Осветление цвета
        lightenColor(hex, percent) {
            const num = parseInt(hex.slice(1), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            
            return `#${(
                0x1000000 +
                (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
                (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
                (B < 255 ? (B < 1 ? 0 : B) : 255)
            )
                .toString(16)
                .slice(1)}`;
        },
        
        // Затемнение цвета
        darkenColor(hex, percent) {
            return this.lightenColor(hex, -percent);
        },
        
        // Получение размеров ячейки
        getCellDimensions() {
            return {
                height: `${DisplayConfig.schedule.cellHeight}px`,
                minHeight: `${DisplayConfig.schedule.cellHeight}px`,
                width: `calc((100% - ${DisplayConfig.schedule.timeColumnWidth}px) / 6)`,
                minWidth: "120px"
            };
        },
        
        // Получение времени для отображения
        formatTimeForDisplay(time, format = "short") {
            if (!time) return "";
            
            const [hours, minutes] = time.split(':').map(Number);
            
            if (format === "short") {
                return `${hours}:${minutes.toString().padStart(2, '0')}`;
            } else if (format === "long") {
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            } else if (format === "ampm") {
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            }
            
            return time;
        },
        
        // Генерация CSS классов
        generateClasses(baseClass, modifiers = {}) {
            const classes = [baseClass];
            
            Object.entries(modifiers).forEach(([key, value]) => {
                if (value) {
                    classes.push(`${baseClass}--${key}`);
                }
            });
            
            return classes.join(' ');
        },
        
        // Получение стилей для статуса
        getStatusStyle(status) {
            const styles = {
                active: {
                    backgroundColor: `${DisplayConfig.colors.success}20`,
                    borderColor: DisplayConfig.colors.success,
                    color: this.darkenColor(DisplayConfig.colors.success, 20)
                },
                inactive: {
                    backgroundColor: `${DisplayConfig.colors.gray}20`,
                    borderColor: DisplayConfig.colors.gray,
                    color: DisplayConfig.colors.gray
                },
                warning: {
                    backgroundColor: `${DisplayConfig.colors.warning}20`,
                    borderColor: DisplayConfig.colors.warning,
                    color: this.darkenColor(DisplayConfig.colors.warning, 20)
                },
                error: {
                    backgroundColor: `${DisplayConfig.colors.danger}20`,
                    borderColor: DisplayConfig.colors.danger,
                    color: this.darkenColor(DisplayConfig.colors.danger, 20)
                }
            };
            
            return styles[status] || styles.inactive;
        },
        
        // Создание градиента
        createGradient(colors, direction = "to right") {
            if (!Array.isArray(colors) || colors.length === 0) {
                return "transparent";
            }
            
            if (colors.length === 1) {
                return colors[0];
            }
            
            const gradientStops = colors.map((color, index) => {
                const percentage = Math.round((index / (colors.length - 1)) * 100);
                return `${color} ${percentage}%`;
            }).join(', ');
            
            return `linear-gradient(${direction}, ${gradientStops})`;
        },
        
        // Получение z-index по умолчанию
        getZIndex(level = "base") {
            const levels = {
                base: 1,
                elevated: 10,
                dropdown: 100,
                modal: 1000,
                tooltip: 10000,
                notification: 100000
            };
            
            return levels[level] || levels.base;
        }
    },
    
    // Инициализация
    initialize() {
        console.log('DisplayConfig инициализирован');
        return this;
    }
};

// Добавим elementStyles как отдельное свойство после определения DisplayConfig
DisplayConfig.elementStyles = {
    button: {
        primary: {
            backgroundColor: DisplayConfig.colors.primary,
            color: "#FFFFFF",
            border: `1px solid ${DisplayConfig.colors.primary}`,
            borderRadius: DisplayConfig.borderRadius.md,
            padding: `${DisplayConfig.spacing.sm} ${DisplayConfig.spacing.lg}`,
            fontSize: DisplayConfig.fontSizes.md,
            fontWeight: "600",
            cursor: "pointer",
            transition: `all ${DisplayConfig.animations.duration.fast} ${DisplayConfig.animations.easing.ease}`,
            "&:hover": {
                backgroundColor: DisplayConfig.helpers.darkenColor(DisplayConfig.colors.primary, 10),
                transform: "translateY(-2px)",
                boxShadow: DisplayConfig.shadows.medium
            },
            "&:active": {
                transform: "translateY(0)"
            }
        },
        secondary: {
            backgroundColor: "transparent",
            color: DisplayConfig.colors.primary,
            border: `2px solid ${DisplayConfig.colors.primary}`,
            borderRadius: DisplayConfig.borderRadius.md,
            padding: `${DisplayConfig.spacing.sm} ${DisplayConfig.spacing.lg}`,
            fontSize: DisplayConfig.fontSizes.md,
            fontWeight: "600",
            cursor: "pointer",
            transition: `all ${DisplayConfig.animations.duration.fast} ${DisplayConfig.animations.easing.ease}`,
            "&:hover": {
                backgroundColor: `${DisplayConfig.colors.primary}10`,
                transform: "translateY(-2px)",
                boxShadow: DisplayConfig.shadows.small
            }
        }
    },
    
    card: {
        default: {
            backgroundColor: "#FFFFFF",
            borderRadius: DisplayConfig.borderRadius.lg,
            padding: DisplayConfig.spacing.lg,
            boxShadow: DisplayConfig.shadows.card,
            border: `1px solid ${DisplayConfig.colors.light}`,
            transition: `all ${DisplayConfig.animations.duration.normal} ${DisplayConfig.animations.easing.ease}`
        },
        hover: {
            transform: "translateY(-4px)",
            boxShadow: DisplayConfig.shadows.large,
            borderColor: DisplayConfig.colors.primary
        }
    },
    
    table: {
        cell: {
            padding: DisplayConfig.spacing.md,
            borderBottom: `1px solid ${DisplayConfig.colors.light}`,
            verticalAlign: "middle",
            textAlign: "center"
        },
        header: {
            backgroundColor: DisplayConfig.colors.background,
            fontWeight: "600",
            color: DisplayConfig.colors.dark,
            borderBottom: `2px solid ${DisplayConfig.colors.primary}`,
            padding: DisplayConfig.spacing.md,
            textAlign: "center"
        }
    }
};

// Инициализация при экспорте
DisplayConfig.initialize();