// 修正的CrazyGames游戏爬虫
// 专注于正确点击Embed按钮并获取iframe链接

const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

// 配置
const config = {
  // 目标游戏列表页面
  gamesListUrl: 'https://www.crazygames.com/games',
  // 要抓取的游戏数量
  maxGames: 100,
  // 页面加载等待时间 (毫秒)
  waitTime: 3000,
  // 请求间隔时间 (毫秒)
  delayBetweenRequests: 2000,
  // 对话框等待时间 (毫秒)
  dialogWaitTime: 2000,
  // 超时设置 (毫秒)
  timeout: 60000,
  // 输出文件
  outputFile: path.join(__dirname, 'data', 'crazygames-list.json'),
  // 日志文件
  logFile: path.join(__dirname, 'logs', 'crazygames-crawler.log')
};

// 设置日志
function setupLogger() {
  const logDir = path.dirname(config.logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  return {
    info: (message) => {
      const logMessage = `[INFO][${new Date().toISOString()}] ${message}`;
      console.log(logMessage);
      fs.appendFileSync(config.logFile, logMessage + '\n');
    },
    error: (message, error) => {
      const logMessage = `[ERROR][${new Date().toISOString()}] ${message}`;
      console.error(logMessage);
      if (error) console.error(error);
      fs.appendFileSync(config.logFile, logMessage + '\n');
      if (error) fs.appendFileSync(config.logFile, error.stack + '\n');
    }
  };
}

const logger = setupLogger();
// 显示文件将保存的位置
console.log('数据文件将保存到:', path.resolve(config.outputFile));
console.log('日志文件将保存到:', path.resolve(config.logFile));

// 等待函数
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 主函数
async function main() {
  logger.info('开始抓取CrazyGames游戏数据');
  
  // 确保输出目录存在
  const dataDir = path.dirname(config.outputFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: false, // 非无头模式，便于观察
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1366,768'
    ]
  });
  
  const allGames = [];
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setDefaultNavigationTimeout(config.timeout);
    
    // 访问游戏列表页面
    logger.info(`访问游戏列表页面: ${config.gamesListUrl}`);
    await page.goto(config.gamesListUrl, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(config.waitTime);
    
    // 滚动页面加载更多游戏
    logger.info('滚动页面加载更多游戏...');
    await autoScroll(page);
    
    // 获取游戏链接
    const gameLinks = await page.evaluate((maxGames) => {
      // 寻找游戏链接
      const links = Array.from(document.querySelectorAll('a[href*="/game/"]'))
        .filter(link => link.href && link.href.includes('/game/'))
        .map(link => link.href)
        .filter((value, index, self) => self.indexOf(value) === index) // 去重
        .slice(0, maxGames);
      
      return links;
    }, config.maxGames);
    
    logger.info(`找到 ${gameLinks.length} 个游戏链接`);
    
    // 处理每个游戏
    for (let i = 0; i < gameLinks.length; i++) {
      const gameUrl = gameLinks[i];
      logger.info(`处理游戏 ${i+1}/${gameLinks.length}: ${gameUrl}`);
      
      try {
        // 访问游戏页面
        await page.goto(gameUrl, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(config.waitTime);
        
        // 获取游戏基本信息，特别注意获取正确的缩略图
        const gameInfo = await page.evaluate(() => {
          // 提取标题
          const title = document.querySelector('h1')?.textContent.trim() || 
                       document.title.replace(' - CrazyGames', '').trim();
          
          // 提取描述
          const description = document.querySelector('meta[name="description"]')?.content || '';
          
          // 获取正确的游戏缩略图
          let thumbnail = '';
          
          // 策略1: 尝试获取主游戏图片
          const mainImage = document.querySelector('.game-main-image img, .game-image img');
          if (mainImage && mainImage.src) {
            thumbnail = mainImage.src;
          }
          
          // 策略2: 尝试获取游戏封面图
          if (!thumbnail) {
            const coverImg = document.querySelector('img[alt*="cover"], img[alt*="logo"]');
            if (coverImg && coverImg.src) {
              thumbnail = coverImg.src;
            }
          }
          
          // 策略3: 尝试获取Open Graph图片标签（通常用于社交媒体分享）
          if (!thumbnail) {
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage && ogImage.content) {
              thumbnail = ogImage.content;
            }
          }
          
          // 策略4: 避免获取Google Play或App Store的图片
          if (thumbnail && (thumbnail.includes('google-play') || thumbnail.includes('app-store'))) {
            // 尝试找其他图片
            const allImages = Array.from(document.querySelectorAll('img'))
              .filter(img => img.width > 100 && img.height > 100) // 过滤掉太小的图片
              .filter(img => !img.src.includes('google-play') && !img.src.includes('app-store'))
              .map(img => img.src);
            
            if (allImages.length > 0) {
              thumbnail = allImages[0]; // 使用第一个合适的图片
            }
          }
           
          // 提取分类 - 使用多种策略
          let categories = []; // 存储多个分类

          try {
            // 策略1: 针对性地查找底部面包屑导航中的分类链接
            const breadcrumbLinks = document.querySelectorAll('a[href*="/games/"], a[href*="/io-games/"], a[href*="/adventure-games/"], a[href*="/minecraft-games/"]');
            if (breadcrumbLinks && breadcrumbLinks.length > 0) {
              // 提取所有分类名称，排除"Games"
              const foundCategories = Array.from(breadcrumbLinks)
                .map(el => {
                  // 提取文本内容并修剪空白
                  const text = el.textContent.trim();
                  // 检查文本内容是.Io这样以点开头的特殊情况
                  if (text.startsWith('.')) {
                    return text.substring(1); // 移除前导点，如".Io"变为"Io"
                  }
                  return text;
                })
                .filter(text => text && text !== 'Games');
              
              if (foundCategories.length > 0) {
                categories = foundCategories;
              }
            }

            // 如果上面的方法没找到分类，尝试其他策略
            if (categories.length === 0) {
              // 策略2: 尝试查找面包屑的不同实现方式
              const alternativeBreadcrumb = document.querySelector('[aria-label="breadcrumb"], .breadcrumb, .breadcrumbs, .game-breadcrumb');
              if (alternativeBreadcrumb) {
                const links = alternativeBreadcrumb.querySelectorAll('a');
                const foundCategories = Array.from(links)
                  .map(el => el.textContent.trim())
                  .filter(text => text && text !== 'Games' && text !== 'Home');
                
                if (foundCategories.length > 0) {
                  categories = foundCategories;
                }
              }
            }

            // 策略3: 检查URL路径提取分类信息
            if (categories.length === 0) {
              const path = window.location.pathname;
              
              // 检查URL中的各种游戏分类路径
              if (path.includes('/io-games/')) {
                categories.push('Io');
              }
              if (path.includes('/adventure-games/')) {
                categories.push('Adventure');
              }
              if (path.includes('/minecraft-games/') || path.toLowerCase().includes('minecraft')) {
                categories.push('Minecraft');
              }
              if (path.includes('/puzzle-games/')) {
                categories.push('Puzzle');
              }
              if (path.includes('/action-games/')) {
                categories.push('Action');
              }
              if (path.includes('/multiplayer-games/')) {
                categories.push('Multiplayer');
              }
              if (path.includes('/shooting-games/')) {
                categories.push('Shooting');
              }
              if (path.includes('/strategy-games/')) {
                categories.push('Strategy');
              }
              if (path.includes('/sports-games/')) {
                categories.push('Sports');
              }
            }

            // 策略4: 尝试从游戏标题和描述中提取关键词作为分类
            if (categories.length === 0) {
              const title = document.querySelector('h1')?.textContent.toLowerCase() || '';
              const description = document.querySelector('meta[name="description"]')?.content.toLowerCase() || '';
              
              const categoryKeywords = {
                'minecraft': 'Minecraft',
                'io': 'Io',
                'puzzle': 'Puzzle',
                'adventure': 'Adventure',
                'action': 'Action',
                'strategy': 'Strategy',
                'battle': 'Action',
                'multiplayer': 'Multiplayer',
                'shooter': 'Shooting',
                'shooting': 'Shooting',
                'racing': 'Racing',
                'sports': 'Sports'
              };
              
              for (const [keyword, category] of Object.entries(categoryKeywords)) {
                if (title.includes(keyword) || description.includes(keyword)) {
                  categories.push(category);
                }
              }
            }
          } catch (error) {
            // 错误处理，确保即使出错也能继续
            console.error("提取分类时发生错误:", error);
          }

          // 如果仍然没有找到分类，使用默认值
          if (categories.length === 0) {
            categories.push('Games');
          }

          // 移除重复项并只保留前3个分类
          categories = [...new Set(categories)].slice(0, 3);

          // 标准化分类名称（确保首字母大写）
          categories = categories.map(cat => {
            // 对于特殊情况IO，确保正确的大小写
            if (cat.toLowerCase() === 'io') return 'IO';
            return cat.charAt(0).toUpperCase() + cat.slice(1);
          });
          
          // 生成slug
          const slug = title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
            
          return {
            title,
            slug,
            thumbnail,
            description,
            categories
          };
        });
        
        // 滚动页面以确保Embed按钮可见
        await page.evaluate(() => {
          window.scrollBy(0, 500);
        });
        
        await page.waitForTimeout(1000);
        
        // 查找Embed按钮
        logger.info(`  尝试查找Embed按钮...`);
        
        const embedButtonInfo = await page.evaluate(() => {
          // 策略1: 查找所有按钮元素
          const buttons = Array.from(document.querySelectorAll('button'));
          
          // 策略2: 找到包含"Embed"文本的按钮
          let embedButton = buttons.find(btn => 
            btn.innerText.trim() === 'Embed' || 
            btn.innerText.includes('Embed')
          );
          
          // 策略3: 尝试找到其他可能的Embed元素
          if (!embedButton) {
            embedButton = document.querySelector('.embed-button, [data-testid="embed-button"]');
          }
          
          // 策略4: 查找所有可能包含"Embed"的元素
          if (!embedButton) {
            const allElements = Array.from(document.querySelectorAll('*'));
            embedButton = allElements.find(el => 
              el.innerText === 'Embed' && 
              (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'DIV')
            );
          }
          
          // 如果找到了按钮
          if (embedButton) {
            const rect = embedButton.getBoundingClientRect();
            return {
              found: true,
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2
            };
          }
          
          return { found: false };
        });
        
        let iframeSrc = '';
        
        // 如果找到了Embed按钮，点击它
        if (embedButtonInfo.found) {
          logger.info(`  找到Embed按钮，位置: x=${embedButtonInfo.x}, y=${embedButtonInfo.y}`);
          
          // 滚动到按钮位置
          await page.evaluate((y) => {
            window.scrollTo(0, y - 200); // 滚动到按钮上方200像素处
          }, embedButtonInfo.y);
          
          // 等待滚动完成
          await page.waitForTimeout(1000);
          
          // 点击按钮
          await page.mouse.click(embedButtonInfo.x, embedButtonInfo.y);
          logger.info('  点击了Embed按钮');
          
          // 等待嵌入对话框出现
          await page.waitForTimeout(config.dialogWaitTime);
          
          // 查找并获取对话框中的iframe代码
          const embedInfo = await page.evaluate(() => {
            // 查找textarea
            const textarea = document.querySelector('textarea');
            if (textarea && textarea.value && textarea.value.includes('<iframe')) {
              return { code: textarea.value, foundTextarea: true };
            }
            
            // 如果没找到textarea，查找对话框中的任何文本
            const dialogText = document.querySelector('.modal-content, .dialog-content')?.innerText;
            if (dialogText && dialogText.includes('<iframe')) {
              return { code: dialogText, foundTextarea: false };
            }
            
            return { code: '', foundTextarea: false };
          });
          
          // 从嵌入代码中提取iframe src
          if (embedInfo.code && embedInfo.code.includes('<iframe')) {
            const match = embedInfo.code.match(/src=["']([^"']+)["']/);
            if (match && match[1]) {
              iframeSrc = match[1];
              logger.info(`  成功获取iframe源: ${iframeSrc}`);
            }
          }
          
          if (embedInfo.foundTextarea) {
            logger.info('  找到了包含iframe代码的文本区域');
          } else if (embedInfo.code) {
            logger.info('  未找到文本区域，但可能从对话框内容中提取了iframe');
          }
          
          // 查找并点击Copy按钮(可选)
          const copyButtonClicked = await page.evaluate(() => {
            const copyButton = Array.from(document.querySelectorAll('button')).find(
              button => button.innerText.toLowerCase().includes('copy')
            );
            
            if (copyButton) {
              copyButton.click();
              return true;
            }
            return false;
          });
          
          if (copyButtonClicked) {
            logger.info('  点击了Copy按钮');
          }
          
          // 关闭对话框
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          
          // 备用方法关闭对话框
          const dialogClosed = await page.evaluate(() => {
            // 尝试点击关闭按钮
            const closeButtons = document.querySelectorAll('.modal .close, .dialog .close, button[aria-label="Close"], .modal-close');
            let closed = false;
            
            closeButtons.forEach(btn => {
              btn.click();
              closed = true;
            });
            
            return closed;
          });
          
          if (dialogClosed) {
            logger.info('  通过点击关闭按钮关闭了对话框');
          }
          
          await page.waitForTimeout(500);
        } else {
          logger.info('  未找到Embed按钮');
        }
        
        // 如果没有获取到iframe，或者格式不正确，尝试构建一个正确的链接
        if (!iframeSrc || !iframeSrc.includes('/embed/')) {
          // 从游戏URL中提取游戏名称
          const gameUrlObj = new URL(gameUrl);
          const pathParts = gameUrlObj.pathname.split('/');
          const gameName = pathParts[pathParts.length - 1]; // 获取路径最后一部分作为游戏名
  
          // 使用正确的格式构建iframe源
          iframeSrc = `https://www.crazygames.com/embed/${gameName}`;
          logger.info(`  构建正确格式的iframe源: ${iframeSrc}`);
        }
        
        // 添加游戏信息到列表
        allGames.push({
          title: gameInfo.title,
          slug: gameInfo.slug,
          url: gameUrl,
          thumbnailUrl: gameInfo.thumbnail,
          description: gameInfo.description,
          categories: gameInfo.categories,
          category: gameInfo.categories.join(', '), // 保持向后兼容
          iframeSrc,
          selected: false
        });
        
        // 在请求之间添加延迟
        await wait(config.delayBetweenRequests);
        
        // 每抓取5个游戏保存一次，避免全部失败
        if ((i + 1) % 5 === 0 || i === gameLinks.length - 1) {
          fs.writeFileSync(
            config.outputFile,
            JSON.stringify(allGames, null, 2)
          );
          logger.info(`已保存 ${allGames.length} 个游戏数据`);
        }
        
      } catch (gameError) {
        logger.error(`处理游戏时出错: ${gameUrl}`, gameError);
      }
    }
    
    // 保存最终结果
    fs.writeFileSync(
      config.outputFile,
      JSON.stringify(allGames, null, 2)
    );
    
    logger.info(`完成! 已抓取 ${allGames.length} 个游戏，结果保存到 ${config.outputFile}`);
    logger.info('请使用筛选工具来选择要导入的游戏');
    
  } catch (error) {
    logger.error('抓取过程中发生错误', error);
  } finally {
    // 等待一会儿再关闭浏览器，便于观察结果
    await wait(5000);
    await browser.close();
  }
}

// 自动滚动页面加载更多内容
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      let timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= 5000) {  // 限制最大滚动高度
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// 启动脚本
main().catch(err => {
  logger.error('未处理的错误', err);
  process.exit(1);
});