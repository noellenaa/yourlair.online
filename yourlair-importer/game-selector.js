// 游戏筛选和导入工具
// 此工具用于创建一个简单的Web界面，让你可以浏览和选择要导入的游戏

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const bodyParser = require('body-parser');

// 配置
const config = {
  // 输入文件 (由爬虫生成)
  gamesListFile: 'yourlair-importer/data/crazygames-list.json',
  // 输出文件 (选中的游戏)
  selectedGamesFile: 'yourlair-importer/data/selected-games.json',
  // 导入游戏数据到网站的目标文件
  targetDataFile: 'data/games-data.json',
  // 服务器端口
  port: 3000
};

// 创建Express应用
const app = express();

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 确保必要的目录存在
const ensureDirectories = () => {
  const dirs = [
    path.dirname(config.gamesListFile),
    path.join(__dirname, 'views'),
    path.join(__dirname, 'public')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// 创建EJS模板文件
const createTemplateFiles = () => {
  // 创建主页模板
  const indexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YourLair游戏选择器</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <style>
    .game-card {
      transition: all 0.3s ease;
      height: 100%;
    }
    .game-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    .game-card.selected {
      border: 3px solid #28a745;
    }
    .thumbnail-container {
      height: 200px;
      overflow: hidden;
    }
    .thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .game-title {
      height: 50px;
      overflow: hidden;
    }
    .filter-section {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: white;
      padding: 15px 0;
      border-bottom: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container mb-5">
    <h1 class="my-4 text-center">YourLair游戏选择器</h1>
    
    <div class="filter-section mb-4">
      <div class="row">
        <div class="col-md-4">
          <input type="text" id="searchInput" class="form-control" placeholder="搜索游戏...">
        </div>
        <div class="col-md-3">
          <select id="categoryFilter" class="form-select">
            <option value="">所有分类</option>
            <% categories.forEach(category => { %>
              <option value="<%= category %>"><%= category %></option>
            <% }); %>
          </select>
        </div>
        <div class="col-md-3">
          <select id="statusFilter" class="form-select">
            <option value="">全部状态</option>
            <option value="selected">已选择</option>
            <option value="unselected">未选择</option>
          </select>
        </div>
        <div class="col-md-2">
          <div class="d-flex justify-content-between">
            <button id="saveSelectionBtn" class="btn btn-primary">保存选择</button>
            <span class="ms-2 badge bg-success align-self-center" id="selectedCount">
              <%= games.filter(g => g.selected).length %> 已选择
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row" id="gamesContainer">
      <% games.forEach((game, index) => { %>
        <div class="col-md-3 mb-4 game-item" 
             data-title="<%= game.title.toLowerCase() %>" 
             data-category="<%= game.category %>"
             data-selected="<%= game.selected ? 'true' : 'false' %>">
          <div class="card game-card <%= game.selected ? 'selected' : '' %>" data-index="<%= index %>">
            <div class="thumbnail-container">
              <img src="<%= game.thumbnailUrl %>" class="thumbnail" alt="<%= game.title %>">
            </div>
            <div class="card-body">
              <h5 class="card-title game-title"><%= game.title %></h5>
              <p class="card-text"><small class="text-muted"><%= game.category %></small></p>
              <div class="d-flex justify-content-between align-items-center">
                <div class="form-check">
                  <input class="form-check-input game-checkbox" type="checkbox" value="" id="check<%= index %>" <%= game.selected ? 'checked' : '' %>>
                  <label class="form-check-label" for="check<%= index %>">
                    选择
                  </label>
                </div>
                <button class="btn btn-sm btn-info view-details-btn" data-index="<%= index %>">详情</button>
              </div>
            </div>
          </div>
        </div>
      <% }); %>
    </div>
    
    <!-- 游戏详情模态框 -->
    <div class="modal fade" id="gameDetailsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">游戏详情</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="gameDetailsContent">
            <!-- 详情内容会在JS中动态填充 -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
            <button type="button" class="btn btn-success" id="selectInModalBtn">选择此游戏</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    // 游戏数据
    const games = <%- JSON.stringify(games) %>;
    let currentGameIndex = -1;
    
    // 模态框
    const gameDetailsModal = new bootstrap.Modal(document.getElementById('gameDetailsModal'));
    
    // 显示游戏详情
    document.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        const game = games[index];
        currentGameIndex = index;
        
        const content = document.getElementById('gameDetailsContent');
        content.innerHTML = \`
          <div class="row">
            <div class="col-md-5">
              <img src="\${game.thumbnailUrl}" class="img-fluid" alt="\${game.title}">
            </div>
            <div class="col-md-7">
              <h4>\${game.title}</h4>
              <p><strong>分类:</strong> \${game.category}</p>
              <p><strong>描述:</strong> \${game.description || '无描述'}</p>
              <p><strong>URL:</strong> <a href="\${game.url}" target="_blank">\${game.url}</a></p>
              <p><strong>iframe源:</strong> \${game.iframeSrc}</p>
            </div>
          </div>
          <div class="mt-3">
            <h5>游戏预览</h5>
            <div class="ratio ratio-16x9">
              <iframe src="\${game.iframeSrc}" allowfullscreen></iframe>
            </div>
          </div>
        \`;
        
        // 更新选择按钮状态
        document.getElementById('selectInModalBtn').textContent = 
          game.selected ? '取消选择' : '选择此游戏';
        
        gameDetailsModal.show();
      });
    });
    
    // 在模态框中选择游戏
    document.getElementById('selectInModalBtn').addEventListener('click', function() {
      if (currentGameIndex >= 0) {
        const game = games[currentGameIndex];
        const newStatus = !game.selected;
        game.selected = newStatus;
        
        // 更新卡片UI
        const card = document.querySelector(\`.card[data-index="\${currentGameIndex}"]\`);
        if (newStatus) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
        
        // 更新复选框
        document.getElementById(\`check\${currentGameIndex}\`).checked = newStatus;
        
        // 更新按钮文字
        this.textContent = newStatus ? '取消选择' : '选择此游戏';
        
        // 更新计数
        updateSelectedCount();
      }
    });
    
    // 复选框逻辑
    document.querySelectorAll('.game-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const index = parseInt(this.closest('.card').getAttribute('data-index'));
        games[index].selected = this.checked;
        
        // 更新卡片UI
        if (this.checked) {
          this.closest('.card').classList.add('selected');
        } else {
          this.closest('.card').classList.remove('selected');
        }
        
        // 更新计数
        updateSelectedCount();
      });
    });
    
    // 卡片点击也可以选择
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', function(e) {
        // 如果点击的是复选框或详情按钮，不处理
        if (e.target.classList.contains('game-checkbox') || 
            e.target.classList.contains('view-details-btn') ||
            e.target.closest('.view-details-btn') || 
            e.target.classList.contains('form-check-label')) {
          return;
        }
        
        const index = parseInt(this.getAttribute('data-index'));
        const checkbox = document.getElementById(\`check\${index}\`);
        checkbox.checked = !checkbox.checked;
        
        // 触发change事件
        const event = new Event('change');
        checkbox.dispatchEvent(event);
      });
    });
    
    // 保存选择
    document.getElementById('saveSelectionBtn').addEventListener('click', function() {
      fetch('/save-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(games),
      })
      .then(response => response.json())
      .then(data => {
        alert(\`保存成功! 已选择 \${data.selected} 个游戏\`);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('保存失败，请查看控制台获取详细信息');
      });
    });
    
    // 搜索功能
    document.getElementById('searchInput').addEventListener('input', filterGames);
    document.getElementById('categoryFilter').addEventListener('change', filterGames);
    document.getElementById('statusFilter').addEventListener('change', filterGames);
    
    function filterGames() {
      const searchTerm = document.getElementById('searchInput').value.toLowerCase();
      const category = document.getElementById('categoryFilter').value;
      const status = document.getElementById('statusFilter').value;
      
      document.querySelectorAll('.game-item').forEach(item => {
        const title = item.getAttribute('data-title');
        const itemCategory = item.getAttribute('data-category');
        const selected = item.getAttribute('data-selected');
        
        let visible = true;
        
        // 标题搜索
        if (searchTerm && !title.includes(searchTerm)) {
          visible = false;
        }
        
        // 分类过滤
        if (category && itemCategory !== category) {
          visible = false;
        }
        
        // 状态过滤
        if (status === 'selected' && selected !== 'true') {
          visible = false;
        } else if (status === 'unselected' && selected !== 'false') {
          visible = false;
        }
        
        item.style.display = visible ? '' : 'none';
      });
    }
    
    // 更新已选择计数
    function updateSelectedCount() {
      const count = games.filter(g => g.selected).length;
      document.getElementById('selectedCount').textContent = count + ' 已选择';
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'views', 'index.ejs'), indexTemplate);
  
  // 创建导入完成页面模板
  const doneTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>导入完成 - YourLair</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body>
  <div class="container">
    <div class="row mt-5">
      <div class="col-md-8 offset-md-2 text-center">
        <div class="card">
          <div class="card-body">
            <h1 class="card-title">游戏导入完成!</h1>
            <p class="card-text">成功导入 <%= count %> 个游戏到您的网站。</p>
            <p>导入的游戏已保存到: <%= filePath %></p>
            
            <div class="mt-4">
              <a href="/" class="btn btn-primary">返回选择器</a>
              <a href="/generate-site" class="btn btn-success">生成网站文件</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'views', 'done.ejs'), doneTemplate);
};

// 路由处理
const setupRoutes = (app) => {
  // 主页 - 显示游戏列表并允许选择
  app.get('/', (req, res) => {
    try {
      let games = [];
      
      // 如果游戏列表文件存在，读取它
      if (fs.existsSync(config.gamesListFile)) {
        games = JSON.parse(fs.readFileSync(config.gamesListFile, 'utf-8'));
      }
      
      // 如果选中的游戏文件存在，更新选中状态
      if (fs.existsSync(config.selectedGamesFile)) {
        const selectedGames = JSON.parse(fs.readFileSync(config.selectedGamesFile, 'utf-8'));
        const selectedSlugs = selectedGames.map(game => game.slug);
        
        games = games.map(game => ({
          ...game,
          selected: selectedSlugs.includes(game.slug)
        }));
      }
      
      // 定义网站使用的分类
      const websiteCategories = ['Games', 'Action', 'Puzzle', 'Adventure', 'Strategy', 'Sports'];

      // 从游戏中提取分类，但只保留网站已定义的分类
      let extractedCategories = [...new Set(games.map(game => game.category))];
      extractedCategories = extractedCategories.filter(cat => websiteCategories.includes(cat));

      // 确保所有网站分类都包含在内，即使没有该分类的游戏
      const categories = [...new Set([...websiteCategories, ...extractedCategories])];

      res.render('index', { games, categories });
    } catch (error) {
      console.error('Error rendering index:', error);
      res.status(500).send('发生错误，请查看控制台获取详细信息');
    }
  });
  
  // 保存选择
  app.post('/save-selection', (req, res) => {
    try {
      const games = req.body;
      const selectedGames = games.filter(game => game.selected);
      
      // 确保目录存在
      const dir = path.dirname(config.selectedGamesFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 保存选中的游戏
      fs.writeFileSync(
        config.selectedGamesFile, 
        JSON.stringify(selectedGames, null, 2)
      );
      
      // 导入到网站数据文件
      importToWebsite(selectedGames);
      
      res.json({ success: true, selected: selectedGames.length });
    } catch (error) {
      console.error('Error saving selection:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 导入到网站
  app.get('/generate-site', (req, res) => {
    try {
      if (!fs.existsSync(config.selectedGamesFile)) {
        return res.status(404).send('未找到已选择的游戏文件');
      }
      
      const selectedGames = JSON.parse(fs.readFileSync(config.selectedGamesFile, 'utf-8'));
      const count = importToWebsite(selectedGames);
      
      res.render('done', { 
        count, 
        filePath: path.resolve(config.targetDataFile)
      });
    } catch (error) {
      console.error('Error generating site:', error);
      res.status(500).send('生成网站文件时出错：' + error.message);
    }
  });
};

// 导入游戏到网站数据文件
function importToWebsite(selectedGames) {
  // 转换游戏数据到网站所需的格式
  const websiteGames = selectedGames.map(game => ({
    title: game.title,
    slug: game.slug,
    url: game.url,
    description: game.description || `Play ${game.title} online for free on YourLair.`,
    longDescription: game.description || `Play ${game.title} online for free on YourLair.`,
    coverImage: game.thumbnailUrl,
    category: game.category.toLowerCase(),
    iframeSrc: game.iframeSrc,
    embedCode: `<iframe src="${game.iframeSrc}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`,
    supportsEmbed: true,
    addedDate: new Date().toISOString().split('T')[0],
    rating: Math.floor(Math.random() * 2) + 4,  // 随机评分4-5
    plays: Math.floor(Math.random() * 10000)    // 随机播放次数
  }));
  
  // 确保目录存在
  const dir = path.dirname(config.targetDataFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // 保存到网站数据文件
  fs.writeFileSync(
    config.targetDataFile,
    JSON.stringify(websiteGames, null, 2)
  );
  
  return websiteGames.length;
}

// 主函数
async function main() {
  try {
    ensureDirectories();
    createTemplateFiles();
    setupRoutes(app);
    
    // 启动服务器
    app.listen(config.port, () => {
      console.log(`游戏选择器已启动: http://localhost:${config.port}`);
      console.log('请在浏览器中打开上面的链接以选择游戏');
    });
  } catch (error) {
    console.error('启动游戏选择器时出错:', error);
  }
}

// 启动程序
main();