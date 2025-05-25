(function() {
    'use strict';

    function applyBackground(url) {
        const existing = document.getElementById('custom-background-style');
        if (existing) existing.remove();

        const style = document.createElement('style');
        style.id = 'custom-background-style';
        style.textContent = `
            body {
                background: url(${url}) no-repeat center center fixed !important;
                background-size: cover !important;
                background-attachment: fixed !important;
            }
        `;
        document.head.appendChild(style);
    }

    function initModule() {
        const config = window.RainyunModularConfig?.['custom-background'] || { enabled: true, config: {} };
        if (!config.enabled) return;

        applyBackground(config.config.background);
    }

    // 延迟加载以避免布局抖动
    if (document.readyState === 'complete') {
        setTimeout(initModule, 500);
    } else {
        window.addEventListener('load', () => setTimeout(initModule, 500));
    }
})();