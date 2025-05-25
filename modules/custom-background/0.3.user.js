(function() {
    'use strict';

    const CLASS_NAME = 'rainyun-custom-bg';
    let retryCount = 0;
    const MAX_RETRY = 5;

    function applyBackground(url) {
        // 清理旧样式
        document.body.classList.remove(CLASS_NAME);
        const oldStyle = document.getElementById(CLASS_NAME);
        if (oldStyle) oldStyle.remove();

        // 创建新样式
        const style = document.createElement('style');
        style.id = CLASS_NAME;
        
        // 预加载图片
        const img = new Image();
        img.src = url;
        
        img.onload = () => {
            style.textContent = `
                body.${CLASS_NAME} {
                    background: url("${encodeURI(url)}") no-repeat center center fixed !important;
                    background-size: cover !important;
                    background-color: transparent !important;
                }
            `;
            document.head.appendChild(style);
            document.body.classList.add(CLASS_NAME);
            retryCount = 0;  // 重置重试计数器
        };

        img.onerror = () => {
            if (retryCount < MAX_RETRY) {
                console.warn(`[自定义背景] 图片加载失败，第 ${++retryCount} 次重试...`);
                setTimeout(() => applyBackground(url), 1000);
            } else {
                console.error('[自定义背景] 图片最终加载失败，停止重试');
            }
        };
    }

    function initModule() {
        const config = window.RainyunModularConfig?.['custom-background'] || { enabled: true, config: {} };
        if (!config.enabled || !config.config.background) return;

        // 立即应用背景
        applyBackground(config.config.background);

        // 持续监控body类变化
        new MutationObserver(() => {
            // 确保自定义类存在
            if (!document.body.classList.contains(CLASS_NAME)) {
                document.body.classList.add(CLASS_NAME);
            }
            // 持续移除原生背景类
            document.body.classList.remove('bg_img1', 'bg_img2', 'bg_img3');
        }).observe(document.body, { attributes: true });

        // 初始化清理原生类
        document.body.classList.remove('bg_img1', 'bg_img2', 'bg_img3');

        // 定时清理原生背景类（双保险）
        setInterval(() => {
            document.body.classList.remove('bg_img1', 'bg_img2', 'bg_img3');
        }, 1500);
    }

    // 强化加载策略
    const load = () => {
        try {
            initModule();
            // 确保在DOM变更后重新应用
            new MutationObserver(initModule).observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        } catch (e) {
            console.error('[自定义背景] 初始化错误:', e);
            setTimeout(load, 500);
        }
    };

    if (document.readyState === 'complete') {
        load();
    } else {
        document.addEventListener('DOMContentLoaded', load);
        window.addEventListener('load', load);
    }

    console.log('[自定义背景] 模块已启动');
})();