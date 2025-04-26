// ==UserScript==
// @name         雨云MCSM新标签页打开
// @namespace    https://github.com/ndxzzy/rainyun-modular
// @version      0.1
// @description  将MCSM一键登录改为新标签页打开
// @author       ndxzzy, DeepSeek
// @match        https://app.rainyun.com/*
// @grant        none
// @supportURL   https://github.com/ndxzzy/rainyun-modular/issues
// @updateURL    https://raw.githubusercontent.com/ndxzzy/rainyun-modular/main/modules/mcsm-redirect/mcsm-redirect.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 模块初始化函数
    function initModule() {
        // 保存原始open方法
        const originalOpen = window.open;

        // 重写open方法
        window.open = function(url, target, features) {
            // 检测MCSM登录特征
            if (url.includes('mcsm.rainyun.com/#/login') && features && features.includes('incognito=yes')) {
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

        console.log('[MCSM新标签页模块] 已启用');
    }

    // 模块卸载函数
    function cleanupModule() {
        // 恢复原始window.open方法
        if (window._originalOpen) {
            window.open = window._originalOpen;
            delete window._originalOpen;
        }

        // 移除错误监听器
        const errorListeners = window._mcsmErrorListeners || [];
        errorListeners.forEach(listener => {
            window.removeEventListener('error', listener);
        });
        delete window._mcsmErrorListeners;

        console.log('[MCSM新标签页模块] 已禁用');
    }

    // 检查是否在模块管理器环境中
    if (typeof GM_getValue === 'function' && GM_getValue('module_mcsm-redirect')) {
        // 模块管理器环境 - 立即初始化
        initModule();
    } else {
        // 独立运行环境 - 直接初始化
        initModule();
        
        // 添加卸载钩子
        window.addEventListener('unload', () => {
            cleanupModule();
        });
    }

    // 导出模块接口以供管理器使用
    if (typeof window.rainyunModules === 'undefined') {
        window.rainyunModules = {};
    }

    window.rainyunModules['mcsm-redirect'] = {
        init: initModule,
        cleanup: cleanupModule
    };
})();