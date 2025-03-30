/**
 * 网站生成器 - YourLair
 * 
 * 此脚本用于根据游戏数据自动生成网站页面
 * 包括游戏详情页和分类页面
 */

const fs = require('fs-extra');
const path = require('path');

// 配置
const config = {
  // 爬虫生成的游戏列表文件
  gamesListFile: 'yourlair-importer/data/crazygames-list.json',
  // 游戏模板文件
  gameTemplate: 'game-template.html',
  // 分类模板文件
  categoryTemplate: 'category-template.html',
  // 输出目录
  outputDir: './',
  // 分类配置
  categories: [
    'action',
    'adventure',
    'puzzle',
    'strategy',
    'sports'
  ],
  // 分类描述
  categoryDescriptions: {
    'action': 'Action games are fast-paced and emphasize hand-eye coordination and reaction time. Explore our collection of exciting action games that will keep you on the edge of your seat.',
    'adventure': 'Adventure games focus on exploration, puzzle-solving, and interactive storytelling. Discover captivating worlds and embark on epic journeys in our adventure games collection.',
    'puzzle': 'Challenge your mind with our collection of puzzle games. From classic brain teasers to innovative new concepts, these games will test your problem-solving skills.',
    'strategy': 'Strategy games require careful thinking and planning to achieve victory. Build empires, command armies, and outsmart your opponents in our selection of strategy games.',
    'sports': 'Experience the thrill of competition with our sports games collection. From football to basketball, racing to wrestling, find your favorite sport and show off your skills.'
  },
  // 相关分类
  relatedCategories: {
    'action': ['adventure', 'puzzle', 'sports'],
    'adventure': ['action', 'puzzle', 'strategy'],
    'puzzle': ['adventure', 'strategy', 'action'],
    'strategy': ['puzzle', 'adventure', 'sports'],
    'sports': ['action', 'strategy', 'puzzle']
  }
};

// 确保输出目录存在
function ensureDirectories() {
  // 游戏详情页目录
  fs.ensureDirSync(path.join(config.outputDir, 'games'));
  
  // 分类页目录
  fs.ensureDirSync(path.join(config.outputDir, 'categories'));
  
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
    
    // 过滤已选择的游戏
    const selectedGames = games.filter(game => game.selected);
    
    console.log(`✅ 已加载${games.length}个游戏，其中${selectedGames.length}个被选择`);
    
    return selectedGames;
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
    
    console.log('✅ 模板文件加载成功');
    
    return { gameTemplate, categoryTemplate };
  } catch (error) {
    console.error(`❌ 加载模板文件失败:`, error);
    throw error;
  }
}

// 按分类对游戏进行分组
function categorizeGames(games) {
  const categorizedGames = {};
  
  // 初始化分类
  config.categories.forEach(category => {
    categorizedGames[category] = [];
  });
  
  // 为每个游戏分配分类
  games.forEach(game => {
    if (!game.category) return;
    
    const categories = game.category.toLowerCase().split(',').map(cat => cat.trim());
    
    categories.forEach(category => {
      if (config.categories.includes(category)) {
        categorizedGames[category].push(game);
      }
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
      
      // 分类标签
      const categories = game.category ? game.category.split(',').map(cat => cat.trim()) : ['Games'];
      const primaryCategory = categories[0];
      
      gameHtml = gameHtml.replace(/<a href="#" id="game-category-breadcrumb" class="text-primary hover:underline">.*?<\/a>/g, 
                          `<a href="../categories/${primaryCategory.toLowerCase()}.html" id="game-category-breadcrumb" class="text-primary hover:underline">${primaryCategory}</a>`);
      
      // 游戏标签
      const tagHtml = categories.map(cat => `<span class="bg-card-bg px-3 py-1 rounded-full text-sm">${cat}</span>`).join('\n');
      gameHtml = gameHtml.replace(/<div class="flex flex-wrap gap-2 mb-4" id="game-tags">.*?<\/div>/s, 
                          `<div class="flex flex-wrap gap-2 mb-4" id="game-tags">\n${tagHtml}\n</div>`);
      
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
      gameHtml = gameHtml.replace(/<span id="game-detail-category">.*?<\/span>/g, `<span id="game-detail-category">${game.category || 'Games'}</span>`);
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
          const gameCategories = game.category ? game.category.split(',').map(cat => cat.trim()) : ['Games'];
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
        if (game.category) {
          const cats = game.category.split(',').map(cat => cat.trim());
          cats.forEach(cat => {
            if (cat.toLowerCase() !== category) {
              subcategories.add(cat);
            }
          });
        }
      });
      
      // 最多添加5个子分类
      Array.from(subcategories).slice(0, 5).forEach(subcat => {
        subcategoryFiltersHtml += `<a href="#" class="bg-gray-600 hover:bg-primary/70 text-light-text px-3 py-1 rounded-full text-sm transition-colors" data-filter="${subcat.toLowerCase()}">${subcat}</a>\n`;
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

// 主函数
async function main() {
  try {
    console.log('🚀 网站生成器启动');
    
    // 确保目录存在
    ensureDirectories();
    
    // 加载游戏数据
    const games = await loadGames();
    
    // 加载模板文件
    const { gameTemplate, categoryTemplate } = await loadTemplates();
    
    // 对游戏进行分类
    const categorizedGames = categorizeGames(games);
    
    // 生成游戏详情页
    await generateGamePages(games, gameTemplate);
    
    // 生成分类页面
    await generateCategoryPages(categorizedGames, categoryTemplate);
    
    console.log('✨ 网站生成完成!');
    
  } catch (error) {
    console.error('🔥 生成过程中发生错误:', error);
  }
}

// 执行主函数
main();