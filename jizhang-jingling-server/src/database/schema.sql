-- 记账精灵数据库表结构设计

-- 用户表
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- 交易记录表
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    tags JSON,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_created_at (created_at),
    INDEX idx_user_date (user_id, transaction_date)
);

-- 用户会话表（可选，用于管理登录状态）
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(45),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
);

-- 分类表（预定义的分类，用户也可以自定义）
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),  -- NULL表示系统预定义分类
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7), -- hex颜色值
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_name (name),
    UNIQUE KEY unique_user_category (user_id, name, type)
);

-- 插入默认分类
INSERT INTO categories (id, user_id, name, type, icon, color, sort_order) VALUES
-- 支出分类
('cat_food', NULL, '餐饮', 'expense', '🍽️', '#FF6B6B', 1),
('cat_entertainment', NULL, '休闲娱乐', 'expense', '🎬', '#96CEB4', 2),
('cat_shopping', NULL, '购物', 'expense', '🛒', '#45B7D1', 3),
('cat_beauty', NULL, '穿搭美容', 'expense', '💄', '#E91E63', 4),
('cat_snacks', NULL, '水果零食', 'expense', '🍎', '#FFB74D', 5),
('cat_transport', NULL, '交通', 'expense', '🚗', '#4ECDC4', 6),
('cat_daily', NULL, '生活日用', 'expense', '🏠', '#98D8C8', 7),
('cat_social', NULL, '人情社交', 'expense', '👥', '#FFA726', 8),
('cat_pet', NULL, '宠物', 'expense', '🐕', '#8BC34A', 9),
('cat_child', NULL, '养娃', 'expense', '👶', '#FFEB3B', 10),
('cat_sports', NULL, '运动', 'expense', '⚽', '#03DAC5', 11),
('cat_services', NULL, '生活服务', 'expense', '🔧', '#607D8B', 12),
('cat_groceries', NULL, '买菜', 'expense', '🥬', '#4CAF50', 13),
('cat_housing', NULL, '住房', 'expense', '🏡', '#795548', 14),
('cat_car', NULL, '爱车', 'expense', '🚙', '#FF5722', 15),
('cat_red_packet_send', NULL, '发红包', 'expense', '🧧', '#F44336', 16),
('cat_transfer_out', NULL, '转账', 'expense', '💸', '#9C27B0', 17),
('cat_education', NULL, '学习教育', 'expense', '📚', '#DDA0DD', 18),
('cat_virtual', NULL, '网络虚拟', 'expense', '📱', '#00BCD4', 19),
('cat_tobacco_alcohol', NULL, '烟酒', 'expense', '🚬', '#795548', 20),
('cat_medical', NULL, '医疗保健', 'expense', '🏥', '#FFEAA7', 21),
('cat_insurance', NULL, '金融保险', 'expense', '🛡️', '#3F51B5', 22),
('cat_furniture', NULL, '家居家电', 'expense', '🛋️', '#9E9E9E', 23),
('cat_travel', NULL, '酒店旅行', 'expense', '✈️', '#FF9800', 24),
('cat_charity', NULL, '公益', 'expense', '❤️', '#E91E63', 25),
('cat_mutual', NULL, '互助保障', 'expense', '🤝', '#009688', 26),
('cat_other_expense', NULL, '其他', 'expense', '📦', '#BDC3C7', 99),

-- 收入分类
('cat_salary', NULL, '工资', 'income', '💰', '#52C41A', 1),
('cat_freelance', NULL, '兼职', 'income', '💼', '#EB2F96', 2),
('cat_investment', NULL, '投资理财', 'income', '📈', '#722ED1', 3),
('cat_social_income', NULL, '人情社交', 'income', '👥', '#FFA726', 4),
('cat_bonus', NULL, '奖金补贴', 'income', '🎁', '#1890FF', 5),
('cat_reimburse', NULL, '报销', 'income', '📄', '#4CAF50', 6),
('cat_business', NULL, '生意', 'income', '🏢', '#FF5722', 7),
('cat_second_hand', NULL, '卖二手', 'income', '🛍️', '#9C27B0', 8),
('cat_living_expense', NULL, '生活费', 'income', '🏠', '#795548', 9),
('cat_lottery', NULL, '中奖', 'income', '🎰', '#FF9800', 10),
('cat_red_packet_receive', NULL, '收红包', 'income', '🧧', '#F44336', 11),
('cat_transfer_in', NULL, '收转账', 'income', '💰', '#4CAF50', 12),
('cat_insurance_claim', NULL, '保险理赔', 'income', '🛡️', '#3F51B5', 13),
('cat_refund', NULL, '退款', 'income', '↩️', '#13C2C2', 14),
('cat_other_income', NULL, '其他', 'income', '💎', '#BDC3C7', 99);