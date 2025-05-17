(function() {
    'use strict';

    // 从模块管理器获取配置
    const moduleConfig = unsafeWindow.RainyunModularConfig 
        ? unsafeWindow.RainyunModularConfig['mcsm-new-tab'] || {} 
        : {};

    const enabled = moduleConfig.enabled !== undefined 
        ? moduleConfig.enabled 
        : true;

    if (!enabled) return;

    // 保存原始open方法
    const originalOpen = window.open;

    // 重写open方法
    window.open = function(url, target, features) {
        // 检测MCSM登录特征
        if (url.includes('mcsm.rainyun.com/#/login') && features.includes('incognito=yes')) {
            // 移除隐私模式参数，强制使用普通标签页
            return originalOpen(url, '_blank', 'noopener,noreferrer');
        }

        // 其他情况使用原始打开方式
        return originalOpen(url, target, features);
    };

    // 监听错误避免影响正常功能
    window.addEventListener('error', (e) => {
        if (e.message.includes('window.open')) {
            e.preventDefault();
        }
    });
    
    console.log('[雨云MCSM新标签页打开] 模块已启动');
})();  