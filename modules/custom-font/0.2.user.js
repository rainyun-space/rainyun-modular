(function() {
    'use strict';

    let styleElement = null;
    let currentFont = '';

    function applyFontSafely(font) {
        // 防抖处理（300ms）
        clearTimeout(window.fontApplyTimeout);
        window.fontApplyTimeout = setTimeout(() => {
            // 创建/更新样式规则
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'custom-font-style';
                document.head.appendChild(styleElement);
            }
            
            // 使用CSS变量和继承机制
            const cssRule = `
                :root {
                    --custom-font: ${font}, system-ui !important;
                }
                body {
                    font-family: var(--custom-font) !important;
                }
                input, textarea, pre, code {
                    font-family: var(--custom-font), monospace !important;
                }
            `;
            
            styleElement.textContent = cssRule;
            currentFont = font;
        }, 300);
    }

    function initModule() {
        const config = window.RainyunModularConfig?.['custom-font'] || { enabled: true, config: {} };
        if (!config.enabled) return;

        // 初始化应用字体
        applyFontSafely(config.config.font || 'system-ui');

        // 优化的DOM监听（仅观察body子元素变化）
        const observer = new MutationObserver(mutations => {
            if (currentFont !== config.config.font) {
                applyFontSafely(config.config.font);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: false
        });
    }

    // 智能加载机制
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModule);
    } else {
        setTimeout(initModule, 100);
    }

    console.log('[自定义字体] 模块已启动');
})();