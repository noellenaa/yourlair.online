/**
 * YourLair.online - 主JavaScript文件
 * 
 * 负责加载游戏数据和页面交互功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化网站功能
    initSite();
});

// 网站初始化
async function initSite() {
    // 移动端菜单功能
    initMobileMenu();
    
    // 加载游戏数据
    const games = await loadGamesData();
    
    if (games && games.length > 0) {
        // 填充游戏内容
        populateGameContainers(games);
        
        // 初始化搜索功能
        initSearch(games);
        
        // 初始化分类标签筛选
        initCategoryTabs(games);
        
        // 初始化次要分类按钮
        initSecondaryCategories();
        
        // 初始化主导航链接
        initMainNavigation();
        
        // 显示最近游玩的游戏
        displayRecentGames();
    } else {
        console.error('没有找到游戏数据或数据为空');
        displayDataError();
    }
}

// 显示数据加载错误
function displayDataError() {
    const containers = ['featured-games', 'popular-games-container', 'action-games-container', 'puzzle-games-container'];
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="col-span-full text-center py-6">
                <p class="text-xl text-red-500">无法加载游戏数据。请确保 data/games-data.json 文件存在并包含有效数据。</p>
                <p class="mt-2">运行 node site-generator.js 生成网站数据。</p>
            </div>`;
        }
    });
}

// 移动端菜单初始化
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// 加载游戏数据
async function loadGamesData() {
    try {
        const response = await fetch('data/games-data.json');
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('加载游戏数据失败:', error);
        return [];
    }
}

// 填充游戏内容到各个容器
function populateGameContainers(games) {
    // 填充精选游戏
    fillGameContainer('featured-games', filterGames(games, null, 8));
    
    // 填充热门游戏
    fillGameContainer('popular-games-container', filterGames(games, null, 10, 'plays', true));
    
    // 填充各个分类的游戏
    fillGameContainer('action-games-container', filterGames(games, 'Action', 10));
    fillGameContainer('puzzle-games-container', filterGames(games, 'Puzzle', 10));
    
    // 初始化图片加载
    if (window.ImageLoader && typeof window.ImageLoader.check === 'function') {
        window.ImageLoader.check(document);
    }
}

// 初始化分类标签筛选
function initCategoryTabs(games) {
    const categoryTabs = document.querySelectorAll('.flex-shrink-0');
    if (!categoryTabs.length) return;
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有标签的活跃状态
            categoryTabs.forEach(t => {
                t.classList.remove('bg-primary');
                t.classList.add('bg-card-bg');
            });
            
            // 设置当前标签为活跃
            this.classList.remove('bg-card-bg');
            this.classList.add('bg-primary');
            
            // 获取标签类型
            const category = this.textContent.trim().toLowerCase();
            
            // 根据标签显示相应游戏
            switch(category) {
                case 'today':
                    fillGameContainer('featured-games', filterGames(games, null, 8));
                    break;
                case 'most popular':
                    fillGameContainer('featured-games', filterGames(games, null, 10, 'plays', true));
                    break;
                case 'browser games':
                    fillGameContainer('featured-games', games.slice(0, 10));
                    break;
                case 'featured games':
                    fillGameContainer('featured-games', filterGames(games, null, 8, 'rating', true));
                    break;
                case 'recommended':
                    // 随机推荐8个游戏
                    const recommended = [...games].sort(() => 0.5 - Math.random()).slice(0, 8);
                    fillGameContainer('featured-games', recommended);
                    break;
                case 'io games':
                    fillGameContainer('featured-games', filterGames(games, 'IO', 10));
                    break;
                default:
                    fillGameContainer('featured-games', filterGames(games, null, 8));
                    break;
            }
        });
    });
}

// 初始化次要分类按钮
function initSecondaryCategories() {
    // 处理所有分类按钮
    const categoryButtons = document.querySelectorAll('.whitespace-nowrap');
    if (categoryButtons) {
        categoryButtons.forEach(button => {
            // 检查按钮是否有href属性
            const href = button.getAttribute('href');
            if (href === '#' || !href) {
                // 对于没有正确链接的按钮，添加事件处理
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // 获取按钮文本内容
                    const category = this.textContent.trim();
                    
                    // 特殊处理"More +"按钮
                    if (category === 'More +') {
                        // 重定向到分类页面
                        window.location.href = 'categories.html';
                        return;
                    }
                    
                    // 其他分类按钮 - 提取分类名称（移除"Games"部分）
                    const categoryName = category.replace(' Games', '').toLowerCase();
                    
                    // 重定向到相应的分类页面
                    window.location.href = `categories/${categoryName}.html`;
                });
            }
        });
    }
}

// 初始化主导航链接
function initMainNavigation() {
    // 选择所有主导航链接
    const navLinks = document.querySelectorAll('header nav a, header div a');
    
    navLinks.forEach(link => {
        // 获取链接的href属性
        const href = link.getAttribute('href');
        const linkText = link.textContent.trim().toLowerCase();
        
        // 如果链接存在但页面可能不存在，修正链接行为
        link.addEventListener('click', function(e) {
            // 检查是否是login按钮
            if (linkText === 'login') {
                e.preventDefault();
                alert('登录功能尚未实现');
                return;
            }
            
            // 检查链接是否指向存在的页面
            const targetPage = href.split('#')[0]; // 移除任何hash部分
            
            // 如果是指向首页的链接，不做处理
            if (targetPage === 'index.html' || targetPage === '/') {
                return;
            }
            
            // 使用fetch检查页面是否存在
            fetch(targetPage, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        // 页面不存在，阻止默认行为
                        e.preventDefault();
                        
                        // 显示合适的消息
                        switch (linkText) {
                            case 'categories':
                                alert('分类页面尚未生成。请运行 node site-generator.js 生成所有页面。');
                                break;
                            case 'rankings':
                            case 'popular':
                                alert('排行榜页面尚未生成。请运行 node site-generator.js 生成所有页面。');
                                break;
                            case 'new games':
                                alert('新游戏页面尚未生成。请运行 node site-generator.js 生成所有页面。');
                                break;
                            default:
                                alert(`页面 "${targetPage}" 不存在。请运行 node site-generator.js 生成所有页面。`);
                        }
                    }
                })
                .catch(() => {
                    // 网络错误，页面可能不存在
                    e.preventDefault();
                    alert(`无法检查页面 "${targetPage}" 是否存在。请确保正在使用本地服务器运行网站。`);
                });
        });
    });
}

// 根据条件筛选游戏
function filterGames(games, category, limit, sortBy = 'addedDate', desc = true) {
    let filtered = [...games];
    
    // 按分类筛选
    if (category) {
        filtered = filtered.filter(game => {
            // 检查游戏的分类数组
            if (game.categories && Array.isArray(game.categories)) {
                return game.categories.some(cat => 
                    cat.toLowerCase() === category.toLowerCase()
                );
            }
            // 或者检查字符串分类
            else if (game.category) {
                const categories = game.category.split(',').map(cat => cat.trim());
                return categories.some(cat => 
                    cat.toLowerCase() === category.toLowerCase()
                );
            }
            return false;
        });
    }
    
    // 排序
    if (sortBy) {
        filtered.sort((a, b) => {
            if (desc) {
                return (b[sortBy] || 0) - (a[sortBy] || 0);
            } else {
                return (a[sortBy] || 0) - (b[sortBy] || 0);
            }
        });
    }
    
    // 限制数量
    if (limit && limit > 0) {
        filtered = filtered.slice(0, limit);
    }
    
    return filtered;
}

// 填充游戏到指定容器
function fillGameContainer(containerId, games) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = ''; // 清空容器
    
    if (games.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center py-4">No games found.</p>';
        return;
    }
    
    games.forEach(game => {
        // 创建游戏卡片
        const gameCard = createGameCard(game);
        container.appendChild(gameCard);
    });
}

// 创建游戏卡片元素
function createGameCard(game) {
    // 获取游戏分类
    let categories = [];
    if (game.categories && Array.isArray(game.categories)) {
        categories = game.categories;
    } else if (game.category) {
        categories = game.category.split(',').map(cat => cat.trim());
    }
    
    // 主分类标签
    const primaryCategory = categories[0] || 'Games';
    const categoryTag = `<span class="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded">${primaryCategory}</span>`;
    
    // 创建卡片元素
    const card = document.createElement('div');
    card.className = 'game-card bg-card-bg rounded-lg shadow overflow-hidden hover:transform hover:translate-y-[-5px] transition duration-300';
    card.innerHTML = `
        <a href="games/${game.slug}.html" onclick="saveRecentGame('${game.slug}', '${game.title.replace(/'/g, "\\'")}', '${categories.join(', ')}', '${game.coverImage || game.thumbnailUrl}')">
            <div class="aspect-w-16 aspect-h-9 bg-gray-800 image-loading">
                <img src="${game.coverImage || game.thumbnailUrl}" alt="${game.title}" class="object-cover w-full h-40 opacity-0 transition-opacity duration-300">
            </div>
            <div class="p-4">
                <h3 class="text-md font-bold text-light-text mb-1 truncate">${game.title}</h3>
                <div class="flex justify-between items-center">
                    <div class="flex mt-1 gap-1">
                        ${categoryTag}
                    </div>
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span class="text-xs text-gray-text ml-1">${game.rating || 4.5}</span>
                    </div>
                </div>
            </div>
        </a>
    `;
    return card;
}

// 初始化搜索功能
function initSearch(games) {
    const searchInput = document.querySelector('input[type="text"][placeholder*="search"]');
    const searchButton = searchInput ? searchInput.nextElementSibling : null;
    
    if (searchInput) {
        // 处理搜索输入
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                performSearch(searchInput.value, games);
            }
        });
        
        // 处理搜索按钮点击
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                performSearch(searchInput.value, games);
            });
        }
    }
}

// 执行搜索
function performSearch(query, games) {
    if (!query || query.trim() === '') return;
    
    query = query.toLowerCase().trim();
    
    // 筛选匹配的游戏
    const matchedGames = games.filter(game => {
        const title = (game.title || '').toLowerCase();
        const description = (game.description || '').toLowerCase();
        
        // 获取分类以便搜索
        let categories = [];
        if (game.categories && Array.isArray(game.categories)) {
            categories = game.categories.map(cat => cat.toLowerCase());
        } else if (game.category) {
            categories = game.category.toLowerCase().split(',').map(cat => cat.trim());
        }
        
        return title.includes(query) || 
               description.includes(query) || 
               categories.some(cat => cat.includes(query));
    });
    
    // 显示搜索结果
    displaySearchResults(matchedGames, query);
}

// 显示搜索结果
function displaySearchResults(games, query) {
    // 创建搜索结果容器
    const mainContent = document.querySelector('main');
    let resultsSection = document.getElementById('search-results');
    
    if (!resultsSection) {
        resultsSection = document.createElement('section');
        resultsSection.id = 'search-results';
        resultsSection.className = 'mb-12';
        mainContent.prepend(resultsSection);
    }
    
    // 构建搜索结果内容
    resultsSection.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Search Results for "${query}"</h2>
            <span class="text-gray-text">${games.length} games found</span>
        </div>
        <div id="search-results-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            ${games.length === 0 ? '<p class="col-span-full text-center py-8">No games found matching your search.</p>' : ''}
        </div>
    `;
    
    // 填充搜索结果游戏
    const resultsContainer = document.getElementById('search-results-container');
    games.forEach(game => {
        const gameCard = createGameCard(game);
        resultsContainer.appendChild(gameCard);
    });
    
    // 初始化图片加载
    if (window.ImageLoader && typeof window.ImageLoader.check === 'function') {
        window.ImageLoader.check(resultsContainer);
    }
    
    // 滚动到搜索结果
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// 显示最近游玩的游戏
function displayRecentGames() {
    try {
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
            // 确保categories是字符串
            const categoriesStr = typeof game.categories === 'string' ? game.categories : '';
            const categoryArray = categoriesStr.split(',').map(cat => cat.trim());
            const primaryCategory = categoryArray[0] || 'Games';
            
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card bg-card-bg rounded-lg shadow overflow-hidden';
            gameCard.innerHTML = `
                <a href="games/${game.slug}.html">
                    <div class="aspect-w-16 aspect-h-9 bg-gray-800 image-loading">
                        <img src="${game.thumbnailUrl || game.thumbnail}" alt="${game.title}" class="object-cover w-full h-40 opacity-0 transition-opacity duration-300">
                    </div>
                    <div class="p-4">
                        <h3 class="text-md font-bold text-light-text mb-1 truncate">${game.title}</h3>
                        <div class="flex justify-between items-center">
                            <div class="flex mt-1 gap-1">
                                <span class="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded">${primaryCategory}</span>
                            </div>
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span class="text-xs text-gray-text ml-1">4.5</span>
                            </div>
                        </div>
                    </div>
                </a>
            `;
            container.appendChild(gameCard);
        });
        
        // 处理图片加载
        if (window.ImageLoader && typeof window.ImageLoader.check === 'function') {
            window.ImageLoader.check(container);
        }
        
        // 清除历史按钮事件
        const clearRecentButton = document.getElementById('clear-recent');
        if (clearRecentButton) {
            clearRecentButton.addEventListener('click', function() {
                localStorage.removeItem('recentGames');
                section.classList.add('hidden');
            });
        }
    } catch (error) {
        console.error('显示最近游玩的游戏失败:', error);
    }
}

// 保存最近游玩的游戏
function saveRecentGame(slug, title, categories, thumbnailUrl) {
    try {
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
    } catch (error) {
        console.error('保存最近游玩记录失败:', error);
    }
}

// 将saveRecentGame函数暴露为全局函数，以便在HTML中调用
window.saveRecentGame = saveRecentGame;