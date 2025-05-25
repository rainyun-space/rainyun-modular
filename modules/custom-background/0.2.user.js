(function() {
    'use strict';

    const CLASS_NAME = 'rainyun-custom-bg';

    function applyBackground(url) {
        // 清理旧样式
        document.body.classList.remove(CLASS_NAME);
        const oldStyle = document.getElementById(CLASS_NAME);
        if (oldStyle) oldStyle.remove();

        // 创建新样式
        const style = document.createElement('style');
        style.id = CLASS_NAME;
        style.textContent = `
            body.${CLASS_NAME} {
                background: url("${encodeURI(url)}") no-repeat center center fixed !important;
                background-size: cover !important;
            }
        `;
        document.head.appendChild(style);
        document.body.classList.add(CLASS_NAME);
    }

    function initModule() {
        const config = window.RainyunModularConfig?.['custom-background'] || { enabled: true, config: {} };
        if (!config.enabled || !config.config.background) return;

        // 智能等待jQuery加载（兼容旧逻辑）
        const checkJquery = () => {
            if (typeof window.jQuery !== 'undefined') {
                applyBackground(config.config.background);
                // 持续监控body类变化
                new MutationObserver(mutations => {
                    if (!document.body.classList.contains(CLASS_NAME)) {
                        document.body.classList.add(CLASS_NAME);
                    }
                }).observe(document.body, { attributes: true });
            } else {
                setTimeout(checkJquery, 100);
            }
        };

        // 移除原始背景类（关键修复）
        document.body.classList.remove('bg_img1', 'bg_img2', 'bg_img3');
        checkJquery();
    }

    // 更积极的加载策略
    if (document.readyState === 'complete') {
        initModule();
    } else {
        document.addEventListener('DOMContentLoaded', initModule);
        window.addEventListener('load', initModule);
    }

    console.log('[自定义背景] 模块已启动');
})();