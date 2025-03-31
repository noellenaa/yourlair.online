/**
 * 网站生成器 - YourLair
 * 
 * 此脚本用于根据游戏数据自动生成网站页面
 * 包括游戏详情页、分类页面和导航页面
 */

const fs = require('fs-extra');
const path = require('path');

// 配置
const config = {
  // 爬虫生成的游戏列表文件
  gamesListFile: path.join(__dirname, 'yourlair-importer', 'data', 'selected-games.json'),
  // 游戏模板文件 - 从games目录加载
  gameTemplate: path.join(__dirname, 'games', 'game-template.html'),
  // 分类模板文件 - 从categories目录加载
  categoryTemplate: path.join(__dirname, 'categories', 'category-template.html'),
  // 输出目录
  outputDir: __dirname,
  // 新增：主分类列表页模板
  categoriesTemplate: path.join(__dirname, 'templates', 'categories-template.html'),
  // 新增：排行榜页面模板
  popularTemplate: path.join(__dirname, 'templates', 'popular-template.html'),
  // 新增：新游戏页面模板
  newGamesTemplate: path.join(__dirname, 'templates', 'new-games-template.html'),
  // 新增：关于页面模板
  aboutTemplate: path.join(__dirname, 'templates', 'about-template.html'),
  // 分类配置 - 官方支持的分类列表
  categories: [
    'action',
    'adventure',
    'puzzle',
    'strategy',
    'sports',
    'io',
    'multiplayer',
    'shooting',
    'racing',
    'arcade',
    'rpg'
  ],
  // 分类描述
  categoryDescriptions: {
    'action': 'Action games are fast-paced and emphasize hand-eye coordination and reaction time. Explore our collection of exciting action games that will keep you on the edge of your seat.',
    'adventure': 'Adventure games focus on exploration, puzzle-solving, and interactive storytelling. Discover captivating worlds and embark on epic journeys in our adventure games collection.',
    'puzzle': 'Challenge your mind with our collection of puzzle games. From classic brain teasers to innovative new concepts, these games will test your problem-solving skills.',
    'strategy': 'Strategy games require careful thinking and planning to achieve victory. Build empires, command armies, and outsmart your opponents in our selection of strategy games.',
    'sports': 'Experience the thrill of competition with our sports games collection. From football to basketball, racing to wrestling, find your favorite sport and show off your skills.',
    'io': 'IO games are multiplayer online games that are easy to join and play in your browser. Compete against players from around the world in these addictive and fun games.',
    'multiplayer': 'Play with friends or challenge players from around the world in our multiplayer games collection. Cooperative or competitive, these games are better with others.',
    'shooting': 'Test your aim and reflexes in our shooting games collection. From first-person shooters to arcade-style target practice, these games will challenge your precision.',
    'racing': 'Feel the speed and excitement in our racing games. Race against the clock or compete with opponents in cars, bikes, and other vehicles across various tracks and environments.',
    'arcade': 'Relive the golden age of gaming with our arcade collection. Simple to learn but difficult to master, these games provide quick entertainment and endless replayability.',
    'rpg': 'Role-playing games let you create and develop characters in rich worlds. Level up, complete quests, and make choices that impact the game world in our RPG collection.'
  },
  // 相关分类
  relatedCategories: {
    'action': ['adventure', 'shooting', 'arcade'],
    'adventure': ['action', 'puzzle', 'rpg'],
    'puzzle': ['strategy', 'adventure', 'arcade'],
    'strategy': ['puzzle', 'rpg', 'multiplayer'],
    'sports': ['racing', 'action', 'multiplayer'],
    'io': ['multiplayer', 'action', 'shooting'],
    'multiplayer': ['io', 'shooting', 'action'],
    'shooting': ['action', 'multiplayer', 'io'],
    'racing': ['sports', 'action', 'arcade'],
    'arcade': ['action', 'puzzle', 'racing'],
    'rpg': ['adventure', 'strategy', 'action']
  }
};

// 确保输出目录存在
function ensureDirectories() {
  // 游戏详情页目录
  fs.ensureDirSync(path.join(config.outputDir, 'games'));
  
  // 分类页目录
  fs.ensureDirSync(path.join(config.outputDir, 'categories'));
  
  // 模板目录
  fs.ensureDirSync(path.join(config.outputDir, 'templates'));
  
  console.log('✅ 目录检查/创建完成');
}

// 读取游戏数据
async function loadGames() {
  try {
    // 检查游戏列表文件是否存在
    if (!fs.existsSync(config.gamesListFile)) {
      console.error(`❌ 游戏列表文件不存在: ${config.gamesListFile}`);
      throw new Error('游戏列表文件不存在');
    }
    
    // 读取游戏列表文件
    const gamesData = await fs.readFile(config.gamesListFile, 'utf8');
    const games = JSON.parse(gamesData);
    
    console.log(`✅ 已加载${games.length}个游戏`);
    
    return games;
  } catch (error) {
    console.error(`❌ 加载游戏数据失败:`, error);
    throw error;
  }
}

// 读取模板文件
async function loadTemplates() {
  try {
    const gameTemplate = await fs.readFile(config.gameTemplate, 'utf8');
    const categoryTemplate = await fs.readFile(config.categoryTemplate, 'utf8');
    
    // 如果主分类页模板存在，则加载它
    let categoriesTemplate = '';
    if (fs.existsSync(config.categoriesTemplate)) {
      categoriesTemplate = await fs.readFile(config.categoriesTemplate, 'utf8');
    } else {
      // 否则使用分类页模板进行修改
      categoriesTemplate = categoryTemplate;
    }
    
    // 如果排行榜模板存在，则加载它
    let popularTemplate = '';
    if (fs.existsSync(config.popularTemplate)) {
      popularTemplate = await fs.readFile(config.popularTemplate, 'utf8');
    } else {
      // 否则使用分类页模板进行修改
      popularTemplate = categoryTemplate;
    }
    
    // 如果新游戏模板存在，则加载它
    let newGamesTemplate = '';
    if (fs.existsSync(config.newGamesTemplate)) {
      newGamesTemplate = await fs.readFile(config.newGamesTemplate, 'utf8');
    } else {
      // 否则使用分类页模板进行修改
      newGamesTemplate = categoryTemplate;
    }
    
    // 如果 about 页面模板存在，则加载它（在主函数中我们不使用这个变量，所以不需要添加到返回值中）
    if (fs.existsSync(config.aboutTemplate)) {
      console.log('✅ About 页面模板存在');
    }

    console.log('✅ 模板文件加载成功');
    
    return { 
      gameTemplate, 
      categoryTemplate, 
      categoriesTemplate, 
      popularTemplate, 
      newGamesTemplate 
    };
  } catch (error) {
    console.error(`❌ 加载模板文件失败:`, error);
    throw error;
  }
}

// 标准化分类
function normalizeCategory(category) {
  return category.toLowerCase().trim();
}

// 按分类对游戏进行分组
function categorizeGames(games) {
  const categorizedGames = {};
  
  // 初始化所有支持的分类
  config.categories.forEach(category => {
    categorizedGames[category] = [];
  });
  
  // 为每个游戏分配分类
  games.forEach(game => {
    // 处理游戏分类
    let gameCategories = [];
    
    if (game.categories && Array.isArray(game.categories)) {
      // 使用直接提供的分类数组
      gameCategories = game.categories.map(cat => normalizeCategory(cat));
    } else if (game.category) {
      // 从字符串分割
      gameCategories = game.category.toLowerCase().split(',').map(cat => cat.trim());
    }
    
    if (gameCategories.length === 0) {
      gameCategories = ['games']; // 默认分类
    }
    
    // 将游戏添加到对应的分类中
    gameCategories.forEach(gameCat => {
      const normalizedCategory = normalizeCategory(gameCat);
      
      config.categories.forEach(category => {
        if (normalizedCategory === category || 
            normalizedCategory.includes(category) || 
            category.includes(normalizedCategory)) {
          if (!categorizedGames[category].includes(game)) {
            categorizedGames[category].push(game);
          }
        }
      });
    });
  });
  
  return categorizedGames;
}

// 生成游戏详情页
async function generateGamePages(games, template) {
  console.log('🎮 开始生成游戏详情页...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const game of games) {
    try {
      let gameHtml = template;
      
      // 替换页面标题和描述
      gameHtml = gameHtml.replace(/<title id="game-title">.*?<\/title>/g, `<title id="game-title">${game.title} - YourLair</title>`);
      gameHtml = gameHtml.replace(/<meta id="game-meta-description" name="description" content=".*?">/g, 
                          `<meta id="game-meta-description" name="description" content="Play ${game.title} online - ${game.description || 'An exciting game at YourLair'}">`);
      gameHtml = gameHtml.replace(/<link id="game-canonical" rel="canonical" href=".*?" \/>/g, 
                          `<link id="game-canonical" rel="canonical" href="https://yourlair.online/games/${game.slug}.html" />`);
      
      // 替换页面内容
      // 标题和导航
      gameHtml = gameHtml.replace(/<h1 class="text-4xl font-bold mb-2" id="header-game-title">.*?<\/h1>/g, 
                          `<h1 class="text-4xl font-bold mb-2" id="header-game-title">${game.title}</h1>`);
      gameHtml = gameHtml.replace(/<span class="text-gray-text" id="game-breadcrumb-title">.*?<\/span>/g, 
                          `<span class="text-gray-text" id="game-breadcrumb-title">${game.title}</span>`);
      
      // 处理分类标签
      let categories = [];
      
      if (game.categories && Array.isArray(game.categories)) {
        categories = game.categories;
      } else if (game.category) {
        categories = game.category.split(',').map(cat => cat.trim());
      } else {
        categories = ['Games'];
      }
      
      const primaryCategory = categories[0];
      
      gameHtml = gameHtml.replace(/<a href="#" id="game-category-breadcrumb" class="text-primary hover:underline">.*?<\/a>/g, 
                          `<a href="../categories/${normalizeCategory(primaryCategory)}.html" id="game-category-breadcrumb" class="text-primary hover:underline">${primaryCategory}</a>`);
      
      // 分类标签
      let categoryTags = '';
      categoryTags = categories.map(cat => 
        `<span class="bg-card-bg px-3 py-1 rounded-full text-sm">${cat}</span>`
      ).join('\n');

      gameHtml = gameHtml.replace(/<div class="flex flex-wrap gap-2 mb-4" id="game-tags">.*?<\/div>/s, 
                        `<div class="flex flex-wrap gap-2 mb-4" id="game-tags">\n${categoryTags}\n</div>`);
      
      // 游戏描述
      gameHtml = gameHtml.replace(/<p class="text-xl text-gray-text" id="game-short-description">.*?<\/p>/g, 
                          `<p class="text-xl text-gray-text" id="game-short-description">${game.description || `Play ${game.title} online for free at YourLair.`}</p>`);
      
      // iframe 源
      gameHtml = gameHtml.replace(/<iframe id="game-iframe" src=".*?" allowfullscreen><\/iframe>/g, 
                          `<iframe id="game-iframe" src="${game.iframeSrc}" allowfullscreen></iframe>`);
      
      // 游戏介绍和说明
      gameHtml = gameHtml.replace(/<p id="how-to-play">.*?<\/p>/g, 
                          `<p id="how-to-play">Use your keyboard and mouse to play ${game.title}. Follow on-screen instructions for controls.</p>`);
      
      gameHtml = gameHtml.replace(/<p id="game-overview">.*?<\/p>/g, 
                          `<p id="game-overview">${game.description || `${game.title} is an exciting online game that you can play for free in your browser.`}</p>`);
      
      gameHtml = gameHtml.replace(/<p id="game-tips">.*?<\/p>/g, 
                          `<p id="game-tips">Take your time to learn the controls and mechanics. Start with easier levels to build skills before tackling more challenging content in ${game.title}.</p>`);
      
      // 游戏特性
      const featuresHtml = `<li>Engaging gameplay</li>
<li>Beautiful graphics</li>
<li>Easy to learn controls</li>
<li>Challenging levels</li>
<li>Free to play in your browser</li>`;
      
      gameHtml = gameHtml.replace(/<ul id="game-features">.*?<\/ul>/s, `<ul id="game-features">\n${featuresHtml}\n</ul>`);
      
      // 游戏详情
      const categoryDisplay = categories.join(', ');
      gameHtml = gameHtml.replace(/<span id="game-detail-category">.*?<\/span>/g, `<span id="game-detail-category">${categoryDisplay}</span>`);
      gameHtml = gameHtml.replace(/<span id="game-added-date">.*?<\/span>/g, `<span id="game-added-date">${new Date().toLocaleDateString()}</span>`);
      gameHtml = gameHtml.replace(/<span id="game-plays">.*?<\/span>/g, `<span id="game-plays">${Math.floor(Math.random() * 10000) + 1000}</span>`);
      gameHtml = gameHtml.replace(/<span id="game-rating">.*?<\/span>/g, `<span id="game-rating">4.8</span>`);
      
      // 保存文件
      const outputPath = path.join(config.outputDir, 'games', `${game.slug}.html`);
      await fs.writeFile(outputPath, gameHtml, 'utf8');
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ 生成游戏页面失败 (${game.title}):`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ 游戏详情页生成完成: 成功${successCount}个, 失败${errorCount}个`);
}

// 生成分类页面
async function generateCategoryPages(categorizedGames, template) {
  console.log('📂 开始生成分类页面...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const category of config.categories) {
    try {
      let categoryHtml = template;
      const games = categorizedGames[category] || [];
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      const description = config.categoryDescriptions[category] || `Play the best free ${categoryName} games online at YourLair.`;
      
      // 替换页面标题和描述
      categoryHtml = categoryHtml.replace(/<title id="page-title">.*?<\/title>/g, 
                              `<title id="page-title">${categoryName} Games - YourLair</title>`);
      categoryHtml = categoryHtml.replace(/<meta id="page-description" name="description" content=".*?">/g, 
                              `<meta id="page-description" name="description" content="${description}">`);
      categoryHtml = categoryHtml.replace(/<link id="page-canonical" rel="canonical" href=".*?" \/>/g, 
                              `<link id="page-canonical" rel="canonical" href="https://yourlair.online/categories/${category}.html" />`);
      
      // 替换分类信息
      categoryHtml = categoryHtml.replace(/<span class="text-gray-text" id="category-breadcrumb-name">.*?<\/span>/g, 
                              `<span class="text-gray-text" id="category-breadcrumb-name">${categoryName}</span>`);
      categoryHtml = categoryHtml.replace(/<h1 class="text-4xl font-bold mb-4" id="category-title">.*?<\/h1>/g, 
                              `<h1 class="text-4xl font-bold mb-4" id="category-title">${categoryName} Games</h1>`);
      categoryHtml = categoryHtml.replace(/<p class="text-xl text-gray-text" id="category-description">.*?<\/p>/g, 
                              `<p class="text-xl text-gray-text" id="category-description">${description}</p>`);
      
      // 特色游戏分类名称
      categoryHtml = categoryHtml.replace(/<span id="featured-category-name">.*?<\/span>/g, 
                              `<span id="featured-category-name">${categoryName}</span>`);
      
      // 生成游戏网格
      let gamesGridHtml = '';
      
      if (games.length === 0) {
        gamesGridHtml = `
          <div class="col-span-full text-center py-12">
            <p class="text-xl text-gray-text">No games found in this category.</p>
            <p class="mt-2">Try another category or check back later!</p>
          </div>
        `;
      } else {
        for (const game of games.slice(0, 12)) { // 每个分类页面最多显示12个游戏
          let gameCategories = [];
          
          if (game.categories && Array.isArray(game.categories)) {
            gameCategories = game.categories;
          } else if (game.category) {
            gameCategories = game.category.split(',').map(cat => cat.trim());
          } else {
            gameCategories = ['Games'];
          }
          
          const categoryTags = gameCategories.slice(0, 2).map(cat => 
            `<span class="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full">${cat}</span>`
          ).join(' ');
          
          gamesGridHtml += `
            <div class="game-card bg-card-bg rounded-xl shadow overflow-hidden transition duration-300" data-categories="${gameCategories.join(',')}">
              <a href="../games/${game.slug}.html" onclick="saveRecentGame('${game.slug}', '${game.title.replace(/'/g, "\\'")}', '${gameCategories.join(', ')}', '${game.thumbnailUrl}')">
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
            </div>
          `;
        }
      }
      
      // 替换游戏网格
      categoryHtml = categoryHtml.replace(/<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12" id="games-grid">[\s\S]*?<\/div>/,
                              `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12" id="games-grid">${gamesGridHtml}</div>`);
      
      // 生成特色游戏
      if (games.length > 0) {
        // 随机选一个游戏作为特色游戏
        const featuredGame = games[Math.floor(Math.random() * games.length)];
        
        // 替换特色游戏信息
        categoryHtml = categoryHtml.replace(/<img src="" alt="" id="featured-game-image" class="w-full h-full object-cover opacity-0 transition-opacity duration-300">/g,
                                `<img src="${featuredGame.thumbnailUrl}" alt="${featuredGame.title}" id="featured-game-image" class="w-full h-full object-cover opacity-100 transition-opacity duration-300">`);
        categoryHtml = categoryHtml.replace(/<h3 class="text-2xl font-bold mb-2" id="featured-game-title">.*?<\/h3>/g,
                                `<h3 class="text-2xl font-bold mb-2" id="featured-game-title">${featuredGame.title}</h3>`);
        categoryHtml = categoryHtml.replace(/<p class="text-gray-text mb-4" id="featured-game-description">.*?<\/p>/g,
                                `<p class="text-gray-text mb-4" id="featured-game-description">${featuredGame.description || `Play ${featuredGame.title} online - one of our best ${categoryName} games!`}</p>`);
        categoryHtml = categoryHtml.replace(/<a href="#" id="featured-game-link" class="inline-block bg-primary text-light-text py-2 px-6 rounded-full hover:bg-primary-dark transition">.*?<\/a>/g,
                                `<a href="../games/${featuredGame.slug}.html" id="featured-game-link" class="inline-block bg-primary text-light-text py-2 px-6 rounded-full hover:bg-primary-dark transition">Play Now</a>`);
      } else {
        // 如果没有游戏，隐藏特色游戏部分
        categoryHtml = categoryHtml.replace(/<section class="mb-16" id="featured-game-section">[\s\S]*?<\/section>/g, '');
      }
      
      // 生成相关分类
      const relatedCats = config.relatedCategories[category] || ['action', 'puzzle', 'strategy'];
      let relatedCategoriesHtml = '';
      
      for (const relatedCat of relatedCats) {
        const relatedCatName = relatedCat.charAt(0).toUpperCase() + relatedCat.slice(1);
        const relatedDesc = config.categoryDescriptions[relatedCat] || `Play the best free ${relatedCatName} games online at YourLair.`;
        
        relatedCategoriesHtml += `
          <a href="${relatedCat}.html" class="block p-6 bg-card-bg rounded-lg text-center hover:bg-gray-700 hover:shadow-lg transition">
            <h3 class="text-xl font-bold mb-2">${relatedCatName} Games</h3>
            <p class="text-gray-text">${relatedDesc.split('.')[0]}.</p>
          </a>
        `;
      }
      
      // 替换相关分类
      categoryHtml = categoryHtml.replace(/<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="related-categories-container">[\s\S]*?<\/div>/g,
                              `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="related-categories-container">${relatedCategoriesHtml}</div>`);
      
      // 生成子分类过滤器
      let subcategoryFiltersHtml = '<a href="#" class="bg-primary text-light-text px-3 py-1 rounded-full text-sm" data-filter="all">All</a>\n';
      
      // 获取所有游戏中的子分类
      const subcategories = new Set();
      games.forEach(game => {
        // 使用新的多分类数组
        if (game.categories && Array.isArray(game.categories)) {
          game.categories.forEach(cat => {
            const normalizedCat = normalizeCategory(cat);
            if (normalizedCat !== category) {
              subcategories.add(cat);
            }
          });
        } else if (game.category) {
          const cats = game.category.split(',').map(cat => cat.trim());
          cats.forEach(cat => {
            const normalizedCat = normalizeCategory(cat);
            if (normalizedCat !== category) {
              subcategories.add(cat);
            }
          });
        }
      });
      
      // 最多添加5个子分类
      Array.from(subcategories).slice(0, 5).forEach(subcat => {
        subcategoryFiltersHtml += `<a href="#" class="bg-gray-600 hover:bg-primary/70 text-light-text px-3 py-1 rounded-full text-sm transition-colors" data-filter="${normalizeCategory(subcat)}">${subcat}</a>\n`;
      });
      
      // 替换子分类过滤器
      categoryHtml = categoryHtml.replace(/<div class="flex flex-wrap gap-2" id="subcategory-filters">[\s\S]*?<\/div>/g,
                              `<div class="flex flex-wrap gap-2" id="subcategory-filters">${subcategoryFiltersHtml}</div>`);
      
      // 保存文件
      const outputPath = path.join(config.outputDir, 'categories', `${category}.html`);
      await fs.writeFile(outputPath, categoryHtml, 'utf8');
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ 生成分类页面失败 (${category}):`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ 分类页面生成完成: 成功${successCount}个, 失败${errorCount}个`);
}

// 新增：生成主分类页面 (categories.html)
async function generateCategoriesPage(categorizedGames, template) {
  console.log('📂 开始生成主分类页面 (categories.html)...');
  
  try {
    let categoriesHtml = template;
    
    // 替换页面标题和描述
    categoriesHtml = categoriesHtml.replace(/<title id="page-title">.*?<\/title>/g, 
                            `<title id="page-title">All Categories - YourLair</title>`);
    categoriesHtml = categoriesHtml.replace(/<meta id="page-description" name="description" content=".*?">/g, 
                            `<meta id="page-description" name="description" content="Browse all game categories on YourLair. Find action, adventure, puzzle, strategy games and more.">`);
    categoriesHtml = categoriesHtml.replace(/<link id="page-canonical" rel="canonical" href=".*?" \/>/g, 
                            `<link id="page-canonical" rel="canonical" href="https://yourlair.online/categories.html" />`);
    
    // 替换页面内容
    categoriesHtml = categoriesHtml.replace(/<span class="text-gray-text" id="category-breadcrumb-name">.*?<\/span>/g, 
                            `<span class="text-gray-text" id="category-breadcrumb-name">All Categories</span>`);
    categoriesHtml = categoriesHtml.replace(/<h1 class="text-4xl font-bold mb-4" id="category-title">.*?<\/h1>/g, 
                            `<h1 class="text-4xl font-bold mb-4" id="category-title">All Game Categories</h1>`);
    categoriesHtml = categoriesHtml.replace(/<p class="text-xl text-gray-text" id="category-description">.*?<\/p>/g, 
                            `<p class="text-xl text-gray-text" id="category-description">Browse our collection of online games by category. Find your favorite type of games.</p>`);
                            
    // 隐藏子分类过滤器和特色游戏部分
    categoriesHtml = categoriesHtml.replace(/<div class="mb-8" id="filter-container">[\s\S]*?<\/div>/g, '');
    categoriesHtml = categoriesHtml.replace(/<section class="mb-16" id="featured-game-section">[\s\S]*?<\/section>/g, '');
    
    // 显示所有分类
    let categoriesGridHtml = '';
    
    for (const category of config.categories) {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      const description = config.categoryDescriptions[category] || `Play the best free ${categoryName} games online at YourLair.`;
      const gamesCount = categorizedGames[category] ? categorizedGames[category].length : 0;
      
      categoriesGridHtml += `
        <a href="categories/${category}.html" class="block bg-card-bg rounded-xl p-6 shadow hover:shadow-lg transition hover:bg-gray-700">
          <h3 class="text-2xl font-bold mb-2">${categoryName} Games <span class="text-sm text-gray-text">(${gamesCount})</span></h3>
          <p class="text-gray-text mb-4">${description.split('.')[0]}.</p>
          <div class="flex justify-between items-center">
            <span class="text-primary">View All</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </a>
      `;
    }
    
    // 替换页面内容
    categoriesHtml = categoriesHtml.replace(/<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12" id="games-grid">[\s\S]*?<\/div>/g,
                            `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">${categoriesGridHtml}</div>`);
    
    // 删除相关分类部分
    categoriesHtml = categoriesHtml.replace(/<section>[\s\S]*?<h2 class="text-2xl font-bold mb-6">Explore Related Categories<\/h2>[\s\S]*?<\/section>/g, '');
    
    // 保存文件
    const outputPath = path.join(config.outputDir, 'categories.html');
    await fs.writeFile(outputPath, categoriesHtml, 'utf8');
    
    console.log('✅ 主分类页面生成完成');
    
  } catch (error) {
    console.error('❌ 生成主分类页面失败:', error);
  }
}

// 新增：生成排行榜页面 (popular.html)
async function generatePopularPage(games, template) {
  console.log('📊 开始生成排行榜页面 (popular.html)...');
  
  try {
    let popularHtml = template;
    
    // 排序游戏（按人气）
    const popularGames = [...games].sort((a, b) => {
      const playsA = a.plays || Math.floor(Math.random() * 10000);
      const playsB = b.plays || Math.floor(Math.random() * 10000);
      return playsB - playsA;
    }).slice(0, 40);  // 最多显示40个游戏
    
    // 替换页面标题和描述
    popularHtml = popularHtml.replace(/<title id="page-title">.*?<\/title>/g, 
                           `<title id="page-title">Most Popular Games - YourLair</title>`);
    popularHtml = popularHtml.replace(/<meta id="page-description" name="description" content=".*?">/g, 
                           `<meta id="page-description" name="description" content="Play the most popular games on YourLair. These top-rated games are loved by players worldwide.">`);
    popularHtml = popularHtml.replace(/<link id="page-canonical" rel="canonical" href=".*?" \/>/g, 
                           `<link id="page-canonical" rel="canonical" href="https://yourlair.online/popular.html" />`);
    
    // 替换面包屑和标题
    popularHtml = popularHtml.replace(/<span class="text-gray-text" id="category-breadcrumb-name">.*?<\/span>/g, 
                            `<span class="text-gray-text" id="category-breadcrumb-name">Popular Games</span>`);
    popularHtml = popularHtml.replace(/<h1 class="text-4xl font-bold mb-4" id="category-title">.*?<\/h1>/g, 
                            `<h1 class="text-4xl font-bold mb-4" id="category-title">Most Popular Games</h1>`);
    popularHtml = popularHtml.replace(/<p class="text-xl text-gray-text" id="category-description">.*?<\/p>/g, 
                            `<p class="text-xl text-gray-text" id="category-description">These are the most played games on YourLair. Updated regularly based on player activity.</p>`);
    
    // 隐藏子分类过滤器
    popularHtml = popularHtml.replace(/<div class="mb-8" id="filter-container">[\s\S]*?<\/div>/g, '');
    
    // 生成游戏列表
    let gamesGridHtml = '';
    
    if (popularGames.length === 0) {
      gamesGridHtml = `
        <div class="col-span-full text-center py-12">
          <p class="text-xl text-gray-text">No games available yet.</p>
          <p class="mt-2">Check back later for updates!</p>
        </div>
      `;
    } else {
      // 添加排名编号
      for (let i = 0; i < popularGames.length; i++) {
        const game = popularGames[i];
        const rank = i + 1;
        
        // 获取游戏分类
        let gameCategories = [];
        if (game.categories && Array.isArray(game.categories)) {
          gameCategories = game.categories;
        } else if (game.category) {
          gameCategories = game.category.split(',').map(cat => cat.trim());
        } else {
          gameCategories = ['Games'];
        }
        
        // 只显示最多2个分类标签
        const categoryTags = gameCategories.slice(0, 2).map(cat => 
          `<span class="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full">${cat}</span>`
        ).join(' ');
        
        // 创建带排名的游戏卡片
        gamesGridHtml += `
          <div class="game-card bg-card-bg rounded-xl shadow overflow-hidden transition duration-300 relative">
            <div class="absolute top-0 left-0 bg-primary text-white px-3 py-1 rounded-br-lg font-bold">#${rank}</div>
            <a href="../games/${game.slug}.html" onclick="saveRecentGame('${game.slug}', '${game.title.replace(/'/g, "\\'")}', '${gameCategories.join(', ')}', '${game.thumbnailUrl}')">
              <div class="aspect-w-16 aspect-h-9 bg-gray-700 image-loading">
                <img src="${game.thumbnailUrl}" alt="${game.title}" class="object-cover w-full h-48 opacity-0 transition-opacity duration-300">
              </div>
              <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-lg font-bold text-light-text">${game.title}</h3>
                  <div class="flex text-yellow-400 ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="text-xs text-gray-text ml-1">${game.rating || 4.8}</span>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <div class="flex flex-wrap gap-2">
                    ${categoryTags}
                  </div>
                  <span class="text-xs text-gray-text">${game.plays || Math.floor(Math.random() * 10000) + 1000} plays</span>
                </div>
              </div>
            </a>
          </div>
        `;
      }
    }
    
    // 替换游戏网格
    popularHtml = popularHtml.replace(/<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12" id="games-grid">[\s\S]*?<\/div>/g,
                          `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12" id="games-grid">${gamesGridHtml}</div>`);
    
    // 隐藏特色游戏部分
    popularHtml = popularHtml.replace(/<section class="mb-16" id="featured-game-section">[\s\S]*?<\/section>/g, '');
    
    // 替换相关分类
    const relatedCategoriesHtml = `
      <a href="categories/action.html" class="block p-6 bg-card-bg rounded-lg text-center hover:bg-gray-700 hover:shadow-lg transition">
        <h3 class="text-xl font-bold mb-2">Action Games</h3>
        <p class="text-gray-text">Action games are fast-paced and emphasize hand-eye coordination and reaction time.</p>
      </a>
      <a href="categories/puzzle.html" class="block p-6 bg-card-bg rounded-lg text-center hover:bg-gray-700 hover:shadow-lg transition">
        <h3 class="text-xl font-bold mb-2">Puzzle Games</h3>
        <p class="text-gray-text">Challenge your mind with our collection of puzzle games and brain teasers.</p>
      </a>
      <a href="categories.html" class="block p-6 bg-card-bg rounded-lg text-center hover:bg-gray-700 hover:shadow-lg transition">
        <h3 class="text-xl font-bold mb-2">All Categories</h3>
        <p class="text-gray-text">Browse all our game categories to find your favorite type of games.</p>
      </a>
    `;
    
    popularHtml = popularHtml.replace(/<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="related-categories-container">[\s\S]*?<\/div>/g,
                          `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="related-categories-container">${relatedCategoriesHtml}</div>`);
    
    // 保存文件
    const outputPath = path.join(config.outputDir, 'popular.html');
    await fs.writeFile(outputPath, popularHtml, 'utf8');
    
    console.log('✅ 排行榜页面生成完成');
    
  } catch (error) {
    console.error('❌ 生成排行榜页面失败:', error);
  }
}

// 新增：生成新游戏页面 (new.html)
async function generateNewGamesPage(games, template) {
  console.log('🆕 开始生成新游戏页面 (new.html)...');
  
  try {
    let newGamesHtml = template;
    
    // 按添加日期排序游戏（最新的排在前面）
    const newGames = [...games].sort((a, b) => {
      const dateA = a.addedDate ? new Date(a.addedDate) : new Date();
      const dateB = b.addedDate ? new Date(b.addedDate) : new Date();
      return dateB - dateA;
    }).slice(0, 30);  // 最多显示30个游戏
    
    // 替换页面标题和描述
    newGamesHtml = newGamesHtml.replace(/<title id="page-title">.*?<\/title>/g, 
                           `<title id="page-title">New Games - YourLair</title>`);
    newGamesHtml = newGamesHtml.replace(/<meta id="page-description" name="description" content=".*?">/g, 
                           `<meta id="page-description" name="description" content="Check out the newest games added to YourLair. Fresh and exciting games updated regularly.">`);
    newGamesHtml = newGamesHtml.replace(/<link id="page-canonical" rel="canonical" href=".*?" \/>/g, 
                           `<link id="page-canonical" rel="canonical" href="https://yourlair.online/new.html" />`);
    
    // 替换面包屑和标题
    newGamesHtml = newGamesHtml.replace(/<span class="text-gray-text" id="category-breadcrumb-name">.*?<\/span>/g, 
                            `<span class="text-gray-text" id="category-breadcrumb-name">New Games</span>`);
    newGamesHtml = newGamesHtml.replace(/<h1 class="text-4xl font-bold mb-4" id="category-title">.*?<\/h1>/g, 
                            `<h1 class="text-4xl font-bold mb-4" id="category-title">New Games</h1>`);
    newGamesHtml = newGamesHtml.replace(/<p class="text-xl text-gray-text" id="category-description">.*?<\/p>/g, 
                            `<p class="text-xl text-gray-text" id="category-description">The latest games added to our collection. Check back regularly for new additions.</p>`);
    
    // 隐藏子分类过滤器
    newGamesHtml = newGamesHtml.replace(/<div class="mb-8" id="filter-container">[\s\S]*?<\/div>/g, '');
    
    // 生成游戏列表
    let gamesGridHtml = '';
    
    if (newGames.length === 0) {
      gamesGridHtml = `
        <div class="col-span-full text-center py-12">
          <p class="text-xl text-gray-text">No new games available yet.</p>
          <p class="mt-2">Check back later for updates!</p>
        </div>
      `;
    } else {
      for (const game of newGames) {
        // 获取游戏分类
        let gameCategories = [];
        if (game.categories && Array.isArray(game.categories)) {
          gameCategories = game.categories;
        } else if (game.category) {
          gameCategories = game.category.split(',').map(cat => cat.trim());
        } else {
          gameCategories = ['Games'];
        }
        
        // 只显示最多2个分类标签
        const categoryTags = gameCategories.slice(0, 2).map(cat => 
          `<span class="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full">${cat}</span>`
        ).join(' ');
        
        // 添加"NEW"标签到游戏卡片
        gamesGridHtml += `
          <div class="game-card bg-card-bg rounded-xl shadow overflow-hidden transition duration-300 relative">
            <div class="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 rounded-br-lg font-bold">NEW</div>
            <a href="../games/${game.slug}.html" onclick="saveRecentGame('${game.slug}', '${game.title.replace(/'/g, "\\'")}', '${gameCategories.join(', ')}', '${game.thumbnailUrl}')">
              <div class="aspect-w-16 aspect-h-9 bg-gray-700 image-loading">
                <img src="${game.thumbnailUrl}" alt="${game.title}" class="object-cover w-full h-48 opacity-0 transition-opacity duration-300">
              </div>
              <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-lg font-bold text-light-text">${game.title}</h3>
                  <div class="flex text-yellow-400 ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="text-xs text-gray-text ml-1">${game.rating || 4.8}</span>
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  ${categoryTags}
                </div>
              </div>
            </a>
          </div>
        `;
      }
    }
    
    // 替换游戏网格
    newGamesHtml = newGamesHtml.replace(/<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12" id="games-grid">[\s\S]*?<\/div>/g,
                          `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12" id="games-grid">${gamesGridHtml}</div>`);
    
    // 展示特色游戏：如果有新游戏，随机选一个作为特色
    if (newGames.length > 0) {
      const featuredGame = newGames[Math.floor(Math.random() * Math.min(5, newGames.length))];
      
      // 替换特色游戏信息
      newGamesHtml = newGamesHtml.replace(/<span id="featured-category-name">.*?<\/span>/g, 
                            `<span id="featured-category-name">New</span>`);
                            
      newGamesHtml = newGamesHtml.replace(/<img src="" alt="" id="featured-game-image" class="w-full h-full object-cover opacity-0 transition-opacity duration-300">/g,
                          `<img src="${featuredGame.thumbnailUrl}" alt="${featuredGame.title}" id="featured-game-image" class="w-full h-full object-cover opacity-100 transition-opacity duration-300">`);
      newGamesHtml = newGamesHtml.replace(/<h3 class="text-2xl font-bold mb-2" id="featured-game-title">.*?<\/h3>/g,
                          `<h3 class="text-2xl font-bold mb-2" id="featured-game-title">${featuredGame.title}</h3>`);
      newGamesHtml = newGamesHtml.replace(/<p class="text-gray-text mb-4" id="featured-game-description">.*?<\/p>/g,
                          `<p class="text-gray-text mb-4" id="featured-game-description">${featuredGame.description || `Try ${featuredGame.title}, one of our newest additions to YourLair!`}</p>`);
      newGamesHtml = newGamesHtml.replace(/<a href="#" id="featured-game-link" class="inline-block bg-primary text-light-text py-2 px-6 rounded-full hover:bg-primary-dark transition">.*?<\/a>/g,
                          `<a href="../games/${featuredGame.slug}.html" id="featured-game-link" class="inline-block bg-primary text-light-text py-2 px-6 rounded-full hover:bg-primary-dark transition">Play Now</a>`);
    } else {
      // 如果没有游戏，隐藏特色游戏部分
      newGamesHtml = newGamesHtml.replace(/<section class="mb-16" id="featured-game-section">[\s\S]*?<\/section>/g, '');
    }
    
    // 替换相关分类
    const relatedCategoriesHtml = `
      <a href="popular.html" class="block p-6 bg-card-bg rounded-lg text-center hover:bg-gray-700 hover:shadow-lg transition">
        <h3 class="text-xl font-bold mb-2">Popular Games</h3>
        <p class="text-gray-text">Check out the most popular games on YourLair.</p>
      </a>
      <a href="categories/action.html" class="block p-6 bg-card-bg rounded-lg text-center hover:bg-gray-700 hover:shadow-lg transition">
        <h3 class="text-xl font-bold mb-2">Action Games</h3>
        <p class="text-gray-text">Action games are fast-paced and emphasize hand-eye coordination and reaction time.</p>
      </a>
      <a href="categories.html" class="block p-6 bg-card-bg rounded-lg text-center hover:bg-gray-700 hover:shadow-lg transition">
        <h3 class="text-xl font-bold mb-2">All Categories</h3>
        <p class="text-gray-text">Browse all our game categories to find your favorite type of games.</p>
      </a>
    `;
    
    newGamesHtml = newGamesHtml.replace(/<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="related-categories-container">[\s\S]*?<\/div>/g,
                          `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="related-categories-container">${relatedCategoriesHtml}</div>`);
    
    // 保存文件
    const outputPath = path.join(config.outputDir, 'new.html');
    await fs.writeFile(outputPath, newGamesHtml, 'utf8');
    
    console.log('✅ 新游戏页面生成完成');
    
  } catch (error) {
    console.error('❌ 生成新游戏页面失败:', error);
  }
}

// 新增：生成或更新网站数据文件 (games-data.json)
async function generateGamesDataFile(games) {
  console.log('💾 开始生成网站数据文件 (games-data.json)...');
  
  try {
    // 准备游戏数据
    const gamesData = games.map(game => {
      // 确保游戏有必要的属性
      return {
        title: game.title,
        slug: game.slug,
        description: game.description || `Play ${game.title} online for free at YourLair.`,
        thumbnailUrl: game.thumbnailUrl,
        coverImage: game.coverImage || game.thumbnailUrl,
        categories: game.categories || (game.category ? game.category.split(',').map(cat => cat.trim()) : ['Games']),
        rating: game.rating || (4 + Math.random()).toFixed(1),
        plays: game.plays || Math.floor(Math.random() * 10000) + 1000,
        addedDate: game.addedDate || new Date().toISOString()
      };
    });
    
    // 保存到数据文件
    const outputPath = path.join(config.outputDir, 'data', 'games-data.json');
    
    // 确保data目录存在
    fs.ensureDirSync(path.join(config.outputDir, 'data'));
    
    // 写入文件
    await fs.writeFile(outputPath, JSON.stringify(gamesData, null, 2), 'utf8');
    
    console.log(`✅ 网站数据文件生成完成: ${gamesData.length}个游戏`);
    
  } catch (error) {
    console.error('❌ 生成网站数据文件失败:', error);
  }
}

// 生成简单的模板文件（如果不存在）
async function generateDefaultTemplates() {
  console.log('📄 检查和生成默认模板文件...');
  
  try {
    // 确保templates目录存在
    fs.ensureDirSync(path.join(config.outputDir, 'templates'));
    
    // 检查主分类页模板
    if (!fs.existsSync(config.categoriesTemplate)) {
      console.log('创建默认主分类页模板...');
      
      // 复制category-template.html作为基础
      if (fs.existsSync(config.categoryTemplate)) {
        await fs.copyFile(config.categoryTemplate, config.categoriesTemplate);
      }
    }
    
    // 检查排行榜页模板
    if (!fs.existsSync(config.popularTemplate)) {
      console.log('创建默认排行榜页模板...');
      
      // 复制category-template.html作为基础
      if (fs.existsSync(config.categoryTemplate)) {
        await fs.copyFile(config.categoryTemplate, config.popularTemplate);
      }
    }
    
    // 检查新游戏页模板
    if (!fs.existsSync(config.newGamesTemplate)) {
      console.log('创建默认新游戏页模板...');
      
      // 复制category-template.html作为基础
      if (fs.existsSync(config.categoryTemplate)) {
        await fs.copyFile(config.categoryTemplate, config.newGamesTemplate);
      }
    }
    
    // 检查 about 页面模板
    if (!fs.existsSync(config.aboutTemplate)) {
      console.log('创建默认 About 页面模板...');
      
      // 创建一个基本的 about-template.html 文件
      // 注意：我们已经在另一个步骤中创建了详细的模板，所以这里只是一个备用方案
      const basicAboutContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About - YourLair</title>
    <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-dark-bg text-light-text">
    <h1>About YourLair</h1>
    <p>Your premier destination for free online games.</p>
    </body>
    </html>`;
      
      await fs.writeFile(config.aboutTemplate, basicAboutContent, 'utf8');
    }

    console.log('✅ 模板文件检查完成');
    
  } catch (error) {
    console.error('❌ 检查/生成默认模板失败:', error);
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 网站生成器启动');
    
    // 确保目录存在
    ensureDirectories();
    
    // 检查和生成默认模板
    await generateDefaultTemplates();
    
    // 加载游戏数据
    const games = await loadGames();
    
    // 加载模板文件
    const { 
      gameTemplate, 
      categoryTemplate, 
      categoriesTemplate, 
      popularTemplate, 
      newGamesTemplate 
    } = await loadTemplates();
    
    // 对游戏进行分类
    const categorizedGames = categorizeGames(games);
    
    // 生成游戏详情页
    await generateGamePages(games, gameTemplate);
    
    // 生成分类页面
    await generateCategoryPages(categorizedGames, categoryTemplate);
    
    // 生成主分类页面 (categories.html)
    await generateCategoriesPage(categorizedGames, categoriesTemplate);
    
    // 生成排行榜页面 (popular.html)
    await generatePopularPage(games, popularTemplate);
    
    // 生成新游戏页面 (new.html)
    await generateNewGamesPage(games, newGamesTemplate);

    // 新增：生成关于页面 (about.html)
    await generateAboutPage();
    async function generateAboutPage() {
      console.log('📄 开始生成关于页面 (about.html)...');
      
      try {
        // 读取 about 页面模板
        if (!fs.existsSync(config.aboutTemplate)) {
          console.error(`❌ About 页面模板文件不存在: ${config.aboutTemplate}`);
          throw new Error('About 页面模板文件不存在');
        }
        
        let aboutHtml = await fs.readFile(config.aboutTemplate, 'utf8');
        
        // 保存文件
        const outputPath = path.join(config.outputDir, 'about.html');
        await fs.writeFile(outputPath, aboutHtml, 'utf8');
        
        console.log('✅ 关于页面生成完成');
        
      } catch (error) {
        console.error('❌ 生成关于页面失败:', error);
      }
    }
    
    // 生成网站数据文件
    await generateGamesDataFile(games);
    
    console.log('✨ 网站生成完成!');
    
  } catch (error) {
    console.error('🔥 生成过程中发生错误:', error);
  }
}

// 执行主函数
main();