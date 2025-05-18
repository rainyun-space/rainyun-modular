(function() {
    'use strict';

    // 本项目搬运自 https://github.com/xiaoyuban1213/beautify/
    // 由管理器作者进行配置项适配

    // 动态加载jQuery
    if (typeof window.jQuery === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.bootcdn.net/ajax/libs/jquery/2.2.4/jquery.min.js';
        script.onload = initModule;
        document.head.appendChild(script);
    } else {
        initModule();
    }

    function initModule() {
        const config = window.RainyunModularConfig?.beautify || { enabled: true, config: {} };
        if (!config.enabled) return;

        // 应用背景
        $("body:first").removeClass("bg_img1 bg_img2 bg_img3");
        document.body.style.background = `url(${config.config.background}) no-repeat center center fixed`;
        document.body.style.backgroundSize = "cover";

        // 应用字体
        const applyFont = () => {
            $('*').css('font-family', config.config.font);
        };

        // 监听DOM变化
        new MutationObserver(applyFont).observe(document, {
            attributes: true,
            childList: true,
            subtree: true
        });

        // 初始应用
        applyFont();

    }

    console.log('[界面美化] 模块已启动');

})();