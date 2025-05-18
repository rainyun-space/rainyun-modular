(function() {
    'use strict';

    // 创建观察器处理动态加载的内容
    const observer = new MutationObserver((mutations) => {
        if (document.body && !document.body.classList.contains('dark-layout')) {
            document.body.classList.add('dark-layout');
        }
    });

    // 立即尝试添加 class
    if (document.body) {
        document.body.classList.add('dark-layout');
    } else {
        // 监听整个文档的变化
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // 处理单页应用路由变化
    window.addEventListener('popstate', () => {
        if (document.body) {
            document.body.classList.add('dark-layout');
        }
    });

    // 处理可能的动态内容加载
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
            document.body.classList.add('dark-layout');
        }
    });

    console.log('[深色模式] 模块已启动');
    
})();