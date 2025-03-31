/**
 * YourLair游戏数据加载器
 * 负责从JSON文件加载游戏数据并在网站中动态显示
 */

// 游戏数据存储
let allGames = [];
let selectedGames = [];

// 游戏分类
const gameCategories = [
    'Action', 'Adventure', 'Arcade', 'Board', 'Card', 
    'Casino', 'Casual', 'Educational', 'Puzzle', 'Racing', 
    'RPG', 'Shooter', 'Simulation', 'Sports', 'Strategy'
];

// 获取游戏数据
async function loadGamesData() {
    try {
        const response = await fetch('/yourlair-importer/data/selected-games.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        allGames = await response.json();
        
        // 过滤已选择的游戏
        selectedGames = allGames.filter(game => game.selected);
        
        console.log(`Loaded ${allGames.length} games, ${selectedGames.length} selected`);
        
        // 触发游戏加载完成事件
        const event = new CustomEvent('gamesDataLoaded', { detail: { games: selectedGames } });
        document.dispatchEvent(event);
        
        return selectedGames;
    } catch (error) {
        console.error('Error loading games data:', error);
        return [];
    }
}

// 获取游戏数据并填充特定容器
async function loadAndDisplayGames(containerId, filterFn = null, limit = 8, sortFn = null) {
    // 如果游戏数据尚未加载，先加载数据
    if (selectedGames.length === 0) {
        await loadGamesData();
    }
    
    // 应用过滤器
    let gamesToDisplay = filterFn ? selectedGames.filter(filterFn) : [...selectedGames];
    
    // 应用排序
    if (sortFn) {
        gamesToDisplay.sort(sortFn);
    }
    
    // 限制数量
    if (limit > 0) {
        gamesToDisplay = gamesToDisplay.slice(0, limit);
    }
    
    // 显示游戏
    displayGames(containerId, gamesToDisplay);
}

// 在特定容器中显示游戏
function displayGames(containerId, games) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID "${containerId}" not found`);
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 如果没有游戏，显示提示信息
    if (games.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-xl text-gray-text">No games found.</p>
                <p class="mt-2">Try another category or check back later!</p>
            </div>
        `;
        return;
    }
    
    // 为每个游戏创建卡片
    games.forEach(game => {
        // 从类别中创建标签
        const categoriesArray = game.category ? game.category.split(',').map(cat => cat.trim()) : ['Games'];
        const categoryTags = categoriesArray.slice(0, 2).map(cat => 
            `<span class="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full">${cat}</span>`
        ).join(' ');
        
        // 创建游戏卡片
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card bg-card-bg rounded-xl shadow overflow-hidden transition duration-300';
        gameCard.innerHTML = `
            <a href="/games/${game.slug}.html" onclick="saveRecentGameIfAvailable('${game.slug}', '${game.title.replace(/'/g, "\\'")}', '${categoriesArray.join(', ')}', '${game.thumbnailUrl}')">
                <div class="aspect-w-16 aspect-h-9 bg-gray-700 image-loading">
                    <img src="${game.thumbnailUrl}" alt="${game.title}" class="object-cover w-full h-48 opacity-0 transition-opacity duration-300">
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-bold text-light-text">${game.title}</h3>
                        <span class="flex text-yellow-400 ml-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span class="text-xs text-gray-text ml-1">4.8</span>
                        </span>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${categoryTags}
                    </div>
                </div>
            </a>
        `;
        container.appendChild(gameCard);
    });
    
    // 处理图片加载
    const images = container.querySelectorAll('.image-loading img');
    images.forEach(function(img) {
        if (img.complete) {
            imageLoaded(img);
        } else {
            img.addEventListener('load', function() {
                imageLoaded(img);
            });
            
            img.addEventListener('error', function() {
                img.parentElement.classList.remove('image-loading');
                img.src = '/images/placeholder.jpg'; // 提供一个占位图
            });
        }
    });
}

// 图片加载完成处理
function imageLoaded(img) {
    img.classList.remove('opacity-0');
    img.classList.add('opacity-100');
    img.parentElement.classList.remove('image-loading');
}

// 记录游戏到最近玩过
function saveRecentGame(slug, title, categories, thumbnailUrl) {
    // 获取当前存储的游戏
    let recentGames = JSON.parse(localStorage.getItem('recentGames') || '[]');
    
    // 检查游戏是否已经在列表中
    const existingIndex = recentGames.findIndex(game => game.slug === slug);
    if (existingIndex !== -1) {
        // 如果已存在，移除它（稍后会添加到最前面）
        recentGames.splice(existingIndex, 1);
    }
    
    // 添加游戏到列表开头
    recentGames.unshift({
        slug,
        title,
        categories,
        thumbnailUrl,
        lastPlayed: new Date().toISOString()
    });
    
    // 只保留最近的10个游戏
    if (recentGames.length > 10) {
        recentGames = recentGames.slice(0, 10);
    }
    
    // 保存到本地存储
    localStorage.setItem('recentGames', JSON.stringify(recentGames));
    
    // 如果在主页上，立即更新最近玩过的游戏区域
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        displayRecentGames();
    }
}

// 仅当函数存在时才保存最近玩过的游戏（避免在某些页面出错）
function saveRecentGameIfAvailable(slug, title, categories, thumbnailUrl) {
    if (typeof saveRecentGame === 'function') {
        saveRecentGame(slug, title, categories, thumbnailUrl);
    }
}

// 显示最近玩过的游戏
function displayRecentGames() {
    const recentGames = JSON.parse(localStorage.getItem('recentGames') || '[]');
    const container = document.getElementById('recent-games-container');
    const section = document.getElementById('recently-played');
    
    if (!container || !section) return;
    
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
        gameCard.className = 'game-card bg-card-bg rounded-xl shadow overflow-hidden';
        gameCard.innerHTML = `
            <a href="/games/${game.slug}.html">
                <div class="aspect-w-16 aspect-h-9 h-36">
                    <img src="${game.thumbnailUrl}" alt="${game.title}" class="object-cover w-full h-full">
                </div>
                <div class="p-3">
                    <h3 class="text-md font-bold text-light-text truncate">${game.title}</h3>
                    <p class="text-xs text-gray-text">${game.categories}</p>
                </div>
            </a>
        `;
        container.appendChild(gameCard);
    });
    
    // 清除历史按钮事件
    const clearButton = document.getElementById('clear-recent');
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            localStorage.removeItem('recentGames');
            section.classList.add('hidden');
        });
    }
}

// 获取随机游戏
function getRandomGames(count = 4) {
    const shuffled = [...selectedGames].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 获取特定分类的游戏
function getGamesByCategory(category, count = 8) {
    const filtered = selectedGames.filter(game => {
        if (!game.category) return false;
        const categories = game.category.toLowerCase().split(',').map(cat => cat.trim());
        return categories.includes(category.toLowerCase());
    });
    
    return filtered.slice(0, count);
}

// 获取最新游戏
function getNewGames(count = 8) {
    // 这里应该根据上传日期排序，但由于没有日期字段，这里使用随机顺序模拟
    return getRandomGames(count);
}

// 获取热门游戏
function getPopularGames(count = 8) {
    // 这里应该根据游戏热度排序，但由于没有热度字段，这里使用随机顺序模拟
    return getRandomGames(count);
}

// 获取相关游戏
function getRelatedGames(currentSlug, category, count = 4) {
    // 先查找同一分类的游戏
    let related = selectedGames.filter(game => {
        if (game.slug === currentSlug) return false; // 排除当前游戏
        if (!game.category) return false;
        
        const categories = game.category.toLowerCase().split(',').map(cat => cat.trim());
        return categories.includes(category.toLowerCase());
    });
    
    // 如果相关游戏不足，添加随机游戏
    if (related.length < count) {
        const randomGames = selectedGames
            .filter(game => game.slug !== currentSlug && !related.includes(game))
            .sort(() => 0.5 - Math.random())
            .slice(0, count - related.length);
        
        related = [...related, ...randomGames];
    }
    
    return related.slice(0, count);
}

// 按游戏标题搜索游戏
function searchGames(query, limit = 20) {
    if (!query || query.trim() === '') return [];
    
    const searchTerm = query.toLowerCase().trim();
    
    return selectedGames
        .filter(game => {
            const title = game.title?.toLowerCase() || '';
            const description = game.description?.toLowerCase() || '';
            const category = game.category?.toLowerCase() || '';
            
            return title.includes(searchTerm) || 
                   description.includes(searchTerm) || 
                   category.includes(searchTerm);
        })
        .slice(0, limit);
}

// 加载特定游戏的详细信息
async function loadGameDetails(slug) {
    // 如果游戏数据尚未加载，先加载数据
    if (selectedGames.length === 0) {
        await loadGamesData();
    }
    
    // 查找游戏
    const game = selectedGames.find(g => g.slug === slug);
    
    if (!game) {
        console.error(`Game with slug "${slug}" not found`);
        return null;
    }
    
    return game;
}

// 填充游戏详情页面
function fillGameDetails(game, options = {}) {
    if (!game) return;
    
    // 设置页面标题和元数据
    if (options.updateMetadata !== false) {
        document.title = `${game.title} - YourLair`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = game.description || `Play ${game.title} online at YourLair.`;
        }
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.href = `https://yourlair.online/games/${game.slug}.html`;
        }
    }
    
    // 填充面包屑导航
    const breadcrumbTitle = document.getElementById('game-breadcrumb-title');
    if (breadcrumbTitle) {
        breadcrumbTitle.textContent = game.title;
    }
    
    const categoryLink = document.getElementById('game-category-breadcrumb');
    if (categoryLink) {
        const category = game.category ? game.category.split(',')[0].trim() : 'Games';
        categoryLink.textContent = category;
        categoryLink.href = `/categories/${category.toLowerCase()}.html`;
    }
    
    // 设置标题和简短描述
    const headerTitle = document.getElementById('header-game-title');
    if (headerTitle) {
        headerTitle.textContent = game.title;
    }
    
    const shortDescription = document.getElementById('game-short-description');
    if (shortDescription) {
        shortDescription.textContent = game.description || `Play ${game.title} online for free.`;
    }
    
    // 设置游戏标签
    const tagsContainer = document.getElementById('game-tags');
    if (tagsContainer) {
        tagsContainer.innerHTML = '';
        const categories = game.category ? game.category.split(',') : ['Games'];
        categories.forEach(cat => {
            const tag = document.createElement('span');
            tag.className = 'bg-card-bg px-3 py-1 rounded-full text-sm';
            tag.textContent = cat.trim();
            tagsContainer.appendChild(tag);
        });
    }
    
    // 设置游戏iframe
    const gameIframe = document.getElementById('game-iframe');
    if (gameIframe) {
        gameIframe.src = game.iframeSrc;
    }
    
    // 设置游戏详细信息
    const howToPlay = document.getElementById('how-to-play');
    if (howToPlay) {
        howToPlay.textContent = `Use your keyboard and mouse to play ${game.title}. Follow on-screen instructions for controls.`;
    }
    
    const gameOverview = document.getElementById('game-overview');
    if (gameOverview) {
        gameOverview.textContent = game.description || `${game.title} is an exciting online game that you can play for free in your browser.`;
    }
    
    // 填充游戏特性
    const featuresContainer = document.getElementById('game-features');
    if (featuresContainer) {
        featuresContainer.innerHTML = '';
        const features = [
            'Engaging gameplay',
            'Beautiful graphics',
            'Easy to learn controls',
            'Challenging levels',
            'Free to play in your browser'
        ];
        features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresContainer.appendChild(li);
        });
    }
    
    // 填充游戏技巧
    const gameTips = document.getElementById('game-tips');
    if (gameTips) {
        gameTips.textContent = `Take your time to learn the controls and mechanics. Start with easier levels to build skills before tackling more challenging content in ${game.title}.`;
    }
    
    // 填充游戏详情侧边栏
    const gameDetailCategory = document.getElementById('game-detail-category');
    if (gameDetailCategory) {
        gameDetailCategory.textContent = game.category || 'Games';
    }
    
    const gameAddedDate = document.getElementById('game-added-date');
    if (gameAddedDate) {
        gameAddedDate.textContent = new Date().toLocaleDateString();
    }
    
    const gamePlays = document.getElementById('game-plays');
    if (gamePlays) {
        gamePlays.textContent = Math.floor(Math.random() * 50000) + 5000;
    }
    
    const gameRating = document.getElementById('game-rating');
    if (gameRating) {
        gameRating.textContent = '4.8';
    }
    
    // 记录到最近玩过
    saveRecentGameIfAvailable(game.slug, game.title, game.category || 'Games', game.thumbnailUrl);
    
    // 设置分享链接
    setupShareLinks(game);
}

// 设置分享链接
function setupShareLinks(game) {
    const currentUrl = window.location.href;
    const gameTitle = encodeURIComponent(game.title);
    
    // Twitter分享
    const twitterShare = document.getElementById('share-twitter');
    if (twitterShare) {
        twitterShare.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=Play ${gameTitle} on YourLair!`;
    }
    
    // Facebook分享
    const facebookShare = document.getElementById('share-facebook');
    if (facebookShare) {
        facebookShare.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    }
    
    // Pinterest分享
    const pinterestShare = document.getElementById('share-pinterest');
    if (pinterestShare) {
        pinterestShare.href = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&media=${encodeURIComponent(game.thumbnailUrl)}&description=Play ${gameTitle} on YourLair!`;
    }
}

// 初始化首页
async function initHomepage() {
    // 加载游戏数据
    await loadGamesData();
    
    // 显示最近玩过的游戏
    displayRecentGames();
    
    // 填充热门游戏区域
    loadAndDisplayGames('popular-games-container', null, 8);
    
    // 填充新游戏区域
    loadAndDisplayGames('new-games-container', null, 8, () => 0.5 - Math.random());
}

// 暴露公共函数
window.GamesLoader = {
    loadGamesData,
    loadAndDisplayGames,
    displayGames,
    saveRecentGame,
    displayRecentGames,
    getRandomGames,
    getGamesByCategory,
    getNewGames,
    getPopularGames,
    getRelatedGames,
    searchGames,
    loadGameDetails,
    fillGameDetails,
    initHomepage
};