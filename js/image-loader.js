/**
 * YourLair游戏网站图片加载处理脚本
 * 处理网站中的游戏图片加载，添加淡入效果与加载状态管理
 */

// 当DOM内容加载完成后初始化图片处理
document.addEventListener('DOMContentLoaded', function() {
    initializeImageLoading();
    
    // 监听DOM变化以处理动态添加的图片
    observeDOMChanges();
});

// 初始化图片加载处理
function initializeImageLoading() {
    // 选择所有带image-loading类的容器中的图片
    const images = document.querySelectorAll('.image-loading img');
    
    // 遍历处理每个图片
    images.forEach(function(img) {
        // 检查图片是否已经加载完成
        if (img.complete) {
            // 如果图片已加载完成（来自缓存），直接显示
            imageLoadedHandler(img);
        } else {
            // 添加加载完成事件监听
            img.addEventListener('load', function() {
                imageLoadedHandler(img);
            });
            
            // 添加加载失败事件监听
            img.addEventListener('error', function() {
                imageErrorHandler(img);
            });
        }
    });
}

// 图片加载完成后的处理函数
function imageLoadedHandler(img) {
    // 移除透明度0（隐藏状态）
    img.classList.remove('opacity-0');
    
    // 添加透明度100（完全显示）
    img.classList.add('opacity-100');
    
    // 移除父元素的加载动画
    if (img.parentElement) {
        img.parentElement.classList.remove('image-loading');
    }
}

// 图片加载失败处理函数
function imageErrorHandler(img) {
    // 移除父元素的加载动画
    if (img.parentElement) {
        img.parentElement.classList.remove('image-loading');
    }
    
    // 如果原始图片地址不是数据URL或placeholder，保存它以便调试
    if (img.src && !img.src.includes('placeholder') && !img.src.startsWith('data:')) {
        console.warn(`图片加载失败: ${img.src}，已替换为占位图片`);
        img.setAttribute('data-original-src', img.src);
    }
    
    // 设置为外部占位图片服务
    // 使用可自定义的占位图片
    img.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
    
    // 显示图片
    img.classList.remove('opacity-0');
    img.classList.add('opacity-100');
}

// 手动检查并处理新加载的图片
// 当通过AJAX或动态方式添加内容时使用
function checkNewImages(container = document) {
    const images = container.querySelectorAll('.image-loading img');
    images.forEach(function(img) {
        if (img.complete) {
            imageLoadedHandler(img);
        } else {
            img.addEventListener('load', function() {
                imageLoadedHandler(img);
            });
            
            img.addEventListener('error', function() {
                imageErrorHandler(img);
            });
        }
    });
}

// 监听DOM变化以处理动态添加的图片
function observeDOMChanges() {
    // 检查浏览器是否支持MutationObserver
    if (typeof MutationObserver === 'undefined') {
        // 不支持MutationObserver的浏览器使用备用方案
        setInterval(function() {
            checkNewImages();
        }, 2000); // 每2秒检查一次
        return;
    }
    
    // 创建一个MutationObserver来监听DOM变化
    const observer = new MutationObserver(function(mutations) {
        let hasNewImages = false;
        
        // 检查是否有新的图片被添加
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // 元素节点
                        const images = node.querySelectorAll('.image-loading img');
                        if (images.length) {
                            hasNewImages = true;
                        }
                    }
                });
            }
        });
        
        // 如果有新图片，处理它们
        if (hasNewImages) {
            checkNewImages();
        }
    });
    
    // 开始观察整个文档的变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 处理页面加载时可能已经渲染的图片
window.addEventListener('load', function() {
    // 处理所有尚未加载的图片
    checkNewImages();
});

// 将函数暴露到全局，方便其他脚本调用
window.ImageLoader = {
    init: initializeImageLoading,
    check: checkNewImages,
    handleLoad: imageLoadedHandler,
    handleError: imageErrorHandler
};