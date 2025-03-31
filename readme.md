# YourLair 在线游戏网站

YourLair是一个展示免费在线游戏的网站项目，通过爬虫自动收集游戏数据（包括游戏分类），提供筛选功能，并生成展示这些游戏的网页。

## 项目功能

- 自动爬取在线游戏数据（标题、描述、缩略图、iframe源、**游戏分类**等）
- 提供游戏选择界面，筛选要展示的游戏
- 自动生成游戏详情页面和分类页面
- 自动生成关于页面、排行榜页面和新游戏页面
- 响应式设计，适配不同设备
- 支持游戏搜索、分类浏览和最近游玩功能
- 现代化界面设计，类似Toolify.ai风格

## 项目结构

- **根目录**：网站主要文件
  - `index.html`：网站主页
  - `site-generator.js`：网站生成脚本
  - `about.html`：关于页面
  - `popular.html`：排行榜页面
  - `new.html`：新游戏页面
  - `data/games-data.json`：处理后的游戏数据（供网站使用）
  - `js/`：网站使用的JavaScript文件
    - `image-loader.js`：图片加载处理脚本
    - `main.js`：主要JavaScript功能实现
  - `games/`：游戏详情页面
    - `game-template.html`：游戏页面模板
  - `categories/`：游戏分类页面
    - `category-template.html`：分类页面模板
  - `templates/`：其他页面模板
    - `about-template.html`：关于页面模板
    - `categories-template.html`：主分类页面模板
    - `popular-template.html`：排行榜页面模板
    - `new-games-template.html`：新游戏页面模板

- **yourlair-importer**：数据采集和处理工具
  - `crazygames-crawler.js`：游戏数据爬虫（支持多分类）
  - `game-selector.js`：游戏选择工具
  - `data/`：存储爬取和处理的数据
    - `crazygames-list.json`：爬虫抓取的原始数据
    - `selected-games.json`：选中的游戏数据
  - `logs/`：存储运行日志
  - `views/`：游戏选择界面模板

## 更新内容

### 1. 游戏分类系统改进

已优化游戏分类系统，实现了以下功能：
- 支持为每个游戏爬取并存储多个分类标签
- 改进了分类数据结构，保持向后兼容
- 增强了分类过滤和展示功能
- 优化了分类页面生成逻辑

### 2. 现代化界面设计

新增现代化界面设计：
- 顶部固定导航栏和大型搜索框设计
- 两级分类标签导航系统
- 卡片式游戏展示布局
- 按分类组织的内容展示
- 更现代的视觉设计和交互效果

### 3. JavaScript功能增强

新增和优化了JavaScript功能：
- 添加了`main.js`脚本负责加载游戏数据和界面交互
- 实现了游戏搜索和分类筛选功能
- 添加了最近游玩记录功能
- 优化了图片加载体验
- 实现了响应式设计的交互逻辑

### 4. 图片加载机制优化

改进了图片加载系统，提升用户体验：
- 实现了图片加载动画，减少用户等待感知
- 使用外部占位图片服务(via.placeholder.com)处理加载失败的图片
- 优化了图片懒加载逻辑，提高页面性能
- 通过MutationObserver监控DOM变化，确保动态添加的图片正确加载
- 针对不同页面层级自动调整图片路径，解决子目录页面图片加载问题

### 5. 新增关于页面

新增了网站关于页面：
- 添加了网站使命和提供的服务内容
- 包含网站历史和发展故事
- 提供联系信息和社交媒体链接
- 添加了常见问题解答部分
- 优化了页面设计，与整体网站风格保持一致

## 使用方法

### 1. 爬取游戏数据（支持多分类）

```bash
cd yourlair-importer
node crazygames-crawler.js
```

这将从游戏网站抓取游戏数据（包括多个分类标签），并保存到 `yourlair-importer/data/crazygames-list.json`

### 2. 选择要展示的游戏

```bash
cd yourlair-importer
node game-selector.js
```

然后在浏览器中打开 http://localhost:3000 进入游戏选择界面，选择您想要展示的游戏并保存。

### 3. 生成网站

```bash
# 确保在项目根目录下
cd ..  # 如果当前在yourlair-importer目录
node site-generator.js
```

这将处理选中的游戏数据，生成网站页面，包括首页、游戏详情页、分类页面、关于页面等。

### 4. 查看网站

可以使用任意HTTP服务器（如VS Code的Live Server插件）来查看生成的网站：

1. 安装Live Server插件（如果使用VS Code）
2. 右键点击根目录中的`index.html`文件
3. 选择"Open with Live Server"

## 技术栈

- HTML/CSS/JavaScript
- Tailwind CSS：用于样式和响应式设计
- Node.js：运行爬虫、选择器和生成器脚本
- Express：提供游戏选择器的Web界面
- Puppeteer：用于爬取游戏数据

## 项目说明

- 所有脚本使用基于脚本位置的路径（`__dirname`），因此可以从任何目录运行
- 数据流如下:
  1. 爬虫生成 → `yourlair-importer/data/crazygames-list.json`
  2. 选择器生成 → `yourlair-importer/data/selected-games.json`
  3. 网站生成器读取 → `yourlair-importer/data/selected-games.json`并生成 → `data/games-data.json`
  4. 前端JavaScript从 → `data/games-data.json`加载数据并显示在网页上
- 网站已集成Google Analytics，可以接入Google AdSense进行广告投放
- 支持未来扩展付费功能和其他商业化方案

## 图片加载系统说明

本项目使用`image-loader.js`脚本处理图片的加载状态和显示效果：

- **懒加载机制**：图片只在进入视口或即将进入视口时才加载，减少初始加载时间
- **加载状态动画**：未加载完成的图片显示渐变动画，提供视觉反馈
- **外部占位图片**：当图片加载失败时，自动使用外部图片服务(via.placeholder.com)提供占位图
- **动态内容支持**：通过MutationObserver监听DOM变化，确保动态添加的图片也能正确处理
- **路径自适应**：根据页面所在路径自动调整图片相对路径，解决子目录页面的图片加载问题

当图片加载失败时，系统会自动记录原始图片URL到`data-original-src`属性，并替换为占位图片，确保页面布局不被破坏。

## 注意事项

- 确保运行Node.js脚本前安装必要的依赖: `npm install`
- 在更新游戏数据时，请按顺序执行上述步骤
- 避免手动修改自动生成的数据文件，以免造成不一致
- 自定义网站外观请修改模板文件（`game-template.html`、`category-template.html`和`about-template.html`等）
- 如需修改游戏加载和显示逻辑，请编辑`js/main.js`文件

## 故障排除

### 常见问题解决

如果遇到网站无法正常显示游戏的问题，请检查：
1. `data/games-data.json`是否已正确生成
2. 页面中是否正确引用了`js/main.js`和`js/image-loader.js`
3. 网站是否通过HTTP服务器运行（而非直接打开HTML文件）
4. 浏览器控制台中是否有任何错误信息

### 图片加载问题

如果遇到图片加载问题，请尝试以下步骤：
1. 确保网络连接正常，能够访问图片源和外部占位图片服务
2. 检查HTML结构，确保图片容器包含`image-loading`类
3. 图片标签应包含`opacity-0`类，并在加载完成后通过脚本切换为`opacity-100`
4. 针对特定页面的图片问题，检查图片路径是否正确（尤其是在子目录页面）
5. 打开浏览器开发者工具，查看网络请求和控制台错误信息