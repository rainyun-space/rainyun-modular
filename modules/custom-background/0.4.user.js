(function() {
    'use strict';

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

        console.log('[自定义背景] 模块已启动');
    }
})();