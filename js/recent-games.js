/**
 * YourLair最近玩过游戏管理器
 * 使用localStorage保存和管理用户最近玩过的游戏
 */

class RecentGamesManager {
    constructor(options = {}) {
        // 配置选项
        this.options = {
            storageKey: 'recentGames',          // 本地存储键名
            maxGames: 10,                       // 最大保存游戏数量
            containerID: 'recent-games-container', // 显示容器ID
            sectionID: 'recently-played',       // 区域容器ID
            clearButtonID: 'clear-recent',      // 清除按钮ID
            ...options
        };
        
        // 初始化
        this.init();
    }
    
    // 初始化
    init() {
        // 如果有清除按钮，添加事件监听
        const clearButton = document.getElementById(this.options.clearButtonID);
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearAll());
        }
    }
    
    // 获取所有最近玩过的游戏
    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.options.storageKey) || '[]');
        } catch (error) {
            console.error('Error parsing recent games from localStorage:', error);
            return [];
        }
    }
    
    // 保存所有游戏
    saveAll(games) {
        try {
            localStorage.setItem(this.options.storageKey, JSON.stringify(games));
        } catch (error) {
            console.error('Error saving recent games to localStorage:', error);
        }
    }
    
    // 添加游戏到最近玩过列表
    add(game) {
        // 参数校验
        if (!game || !game.slug || !game.title) {
            console.error('Invalid game data provided to RecentGamesManager.add()');
            return;
        }
        
        // 获取当前存储的游戏
        let recentGames = this.getAll();
        
        // 规范化游戏对象
        const normalizedGame = {
            slug: game.slug,
            title: game.title,
            categories: game.categories || game.category || 'Games',
            thumbnailUrl: game.thumbnailUrl || '/images/placeholder.jpg',
            lastPlayed: new Date().toISOString()
        };
        
        // 检查游戏是否已经在列表中
        const existingIndex = recentGames.findIndex(g => g.slug === normalizedGame.slug);
        if (existingIndex !== -1) {
            // 如果已存在，移除它（稍后会添加到最前面）
            recentGames.splice(existingIndex, 1);
        }
        
        // 添加游戏到列表开头
        recentGames.unshift(normalizedGame);
        
        // 限制游戏数量
        if (recentGames.length > this.options.maxGames) {
            recentGames = recentGames.slice(0, this.options.maxGames);
        }
        
        // 保存到本地存储
        this.saveAll(recentGames);
        
        // 更新显示
        this.display();
        
        return recentGames;
    }
    
    // 从最近玩过列表中移除游戏
    remove(slug) {
        if (!slug) return;
        
        let recentGames = this.getAll();
        recentGames = recentGames.filter(game => game.slug !== slug);
        
        this.saveAll(recentGames);
        this.display();
        
        return recentGames;
    }
    
    // 清空最近玩过列表
    clearAll() {
        localStorage.removeItem(this.options.storageKey);
        this.display();
        
        // 触发清空事件
        document.dispatchEvent(new CustomEvent('recentGamesCleared'));
    }
    
    // 显示最近玩过的游戏
    display() {
        const container = document.getElementById(this.options.containerID);
        const section = document.getElementById(this.options.sectionID);
        
        if (!container || !section) return;
        
        const recentGames = this.getAll();
        
        // 如果没有游戏，隐藏区域
        if (recentGames.length === 0) {
            section.classList.add('hidden');
            return;
        }
        
        // 显示区域
        section.classList.remove('hidden');
        
        // 清空容器
        container.innerHTML = '';
        
        // 添加游戏卡片
        recentGames.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card bg-card-bg rounded-xl shadow overflow-hidden transition duration-300';
            gameCard.innerHTML = `
                <a href="/games/${game.slug}.html">
                    <div class="aspect-w-16 aspect-h-9 bg-gray-700 image-loading">
                        <img src="${game.thumbnailUrl}" alt="${game.title}" class="object-cover w-full h-36 opacity-0 transition-opacity duration-300">
                    </div>
                    <div class="p-3">
                        <h3 class="text-md font-bold text-light-text truncate">${game.title}</h3>
                        <p class="text-xs text-gray-text">${game.categories}</p>
                    </div>
                </a>
            `;
            container.appendChild(gameCard);
            
            // 处理图片加载
            const img = gameCard.querySelector('img');
            if (img) {
                if (img.complete) {
                    this.imageLoaded(img);
                } else {
                    img.addEventListener('load', () => this.imageLoaded(img));
                    img.addEventListener('error', () => {
                        img.src = '/images/placeholder.jpg';
                        this.imageLoaded(img);
                    });
                }
            }
        });
    }
    
    // 图片加载完成处理
    imageLoaded(img) {
        img.classList.remove('opacity-0');
        img.classList.add('opacity-100');
        img.parentElement.classList.remove('image-loading');
    }
}

// 创建全局实例
window.recentGames = new RecentGamesManager();

// 暴露便捷函数
function saveRecentGame(slug, title, categories, thumbnailUrl) {
    window.recentGames.add({
        slug,
        title,
        categories,
        thumbnailUrl
    });
}

// 文档加载完成后显示
document.addEventListener('DOMContentLoaded', () => {
    window.recentGames.display();
});