// ==UserScript==
// @name         雨云截图隐私保护
// @namespace    https://github.com/ndxzzy/rainyun-modular
// @version      0.16
// @description  给包含特定隐私内容的元素添加模糊效果，并提供开关按钮控制
// @author       ndxzzy, ChatGPT, DeepSeek
// @match        *://app.rainyun.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @resource     eyeIcon https://raw.githubusercontent.com/ndxzzy/rainyun-modular/main/resources/eye-icon.svg
// @resource     slashedEyeIcon https://raw.githubusercontent.com/ndxzzy/rainyun-modular/main/resources/slashed-eye-icon.svg
// @supportURL   https://github.com/ndxzzy/rainyun-modular/issues
// @updateURL    https://raw.githubusercontent.com/ndxzzy/rainyun-modular/main/modules/privacy-protection/privacy-protection.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 模块配置
    const config = {
        enabled: GM_getValue('privacyProtectionEnabled', false),
        keywordsForH4: [
            '公网IP列表', '面板用户名', 'CDN设置', '发票抬头列表', '我的发票', '发起提现',
            '域名管理', '我的模板', 'NAT端口映射管理', 'Nat端口映射', '绑定支付宝', '绑定邮箱',
            '账号变动日志', 'API秘钥', 'IP列表'
        ],
        keywordsForH5: [
            'IP 地址管理'
        ],
        keywordsForTable: ['日志ID', 'CNAME', '桶名', '服务名称'],
        keywordsForP: ['公网IP', '服务器ID', '标签'],
        smallKeywordsForTD: [
            '公网 IP 地址：', '公网IP地址：', '内网IP：', '远程连接地址 (RDP/SSH)：', 
            '面板主账户：', '安装结果输出', 'IPv4公网地址'
        ],
        blurStrength: '5px'
    };

    // 模块状态
    let toggleButton;
    let observer;

    // 模块初始化函数
    function initModule() {
        // 创建切换按钮
        createToggleButton();

        // 初始化状态
        if (config.enabled) {
            enablePrivacyProtection();
        }

        // 设置菜单命令
        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('切换隐私保护', togglePrivacyProtection);
        }

        // 设置DOM观察器
        setupObserver();

        console.log('[隐私保护模块] 已加载');
    }

    // 模块卸载函数
    function cleanupModule() {
        // 移除切换按钮
        if (toggleButton && toggleButton.parentNode) {
            toggleButton.parentNode.removeChild(toggleButton);
        }

        // 停止观察器
        if (observer) {
            observer.disconnect();
        }

        // 移除隐私保护效果
        disablePrivacyProtection();

        console.log('[隐私保护模块] 已卸载');
    }

    // 创建切换按钮
    function createToggleButton() {
        toggleButton = document.createElement('div');
        toggleButton.innerHTML = config.enabled ? getSlashedEyeIcon() : getNormalEyeIcon();

        // 按钮样式
        Object.assign(toggleButton.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            width: '40px',
            height: '40px',
            backgroundColor: '#37b5c1',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: '1000',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)'
        });

        document.body.appendChild(toggleButton);

        // 添加拖拽功能
        setupButtonDrag();
    }

    // 获取正常眼睛图标
    function getNormalEyeIcon() {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }

    // 获取划掉眼睛图标
    function getSlashedEyeIcon() {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }

    // 设置按钮拖拽功能
    function setupButtonDrag() {
        let isDragging = false;
        let hasMoved = false;
        let offsetX = 0;
        let offsetY = 0;
        let initialX = 0;
        let initialY = 0;
        const dragThreshold = 3;

        toggleButton.addEventListener('mousedown', (e) => {
            isDragging = true;
            hasMoved = false;
            offsetX = e.clientX - toggleButton.offsetLeft;
            offsetY = e.clientY - toggleButton.offsetTop;
            initialX = e.clientX;
            initialY = e.clientY;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const moveX = e.clientX - initialX;
                const moveY = e.clientY - initialY;
                if (Math.abs(moveX) > dragThreshold || Math.abs(moveY) > dragThreshold) {
                    hasMoved = true;
                    toggleButton.style.cursor = 'move';
                    toggleButton.style.left = `${e.clientX - offsetX}px`;
                    toggleButton.style.top = `${e.clientY - offsetY}px`;
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                const moveX = e.clientX - initialX;
                const moveY = e.clientY - initialY;
                isDragging = false;
                toggleButton.style.cursor = 'pointer';
                if (!hasMoved && Math.abs(moveX) <= dragThreshold && Math.abs(moveY) <= dragThreshold) {
                    togglePrivacyProtection();
                }
            }
        });
    }

    // 切换隐私保护状态
    function togglePrivacyProtection() {
        config.enabled = !config.enabled;
        GM_setValue('privacyProtectionEnabled', config.enabled);

        if (config.enabled) {
            enablePrivacyProtection();
            toggleButton.innerHTML = getSlashedEyeIcon();
        } else {
            disablePrivacyProtection();
            toggleButton.innerHTML = getNormalEyeIcon();
        }
    }

    // 启用隐私保护
    function enablePrivacyProtection() {
        applyPrivacyProtection();
        console.log('[隐私保护模块] 已启用');
    }

    // 禁用隐私保护
    function disablePrivacyProtection() {
        removePrivacyProtection();
        console.log('[隐私保护模块] 已禁用');
    }

    // 设置DOM观察器
    function setupObserver() {
        observer = new MutationObserver(function(mutations) {
            if (config.enabled) {
                applyPrivacyProtection();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 应用隐私保护效果
    function applyPrivacyProtection() {
        // 处理h4元素
        document.querySelectorAll('h4').forEach(h4Element => {
            if (config.keywordsForH4.some(keyword => h4Element.textContent.includes(keyword))) {
                const divParent = h4Element.parentNode;
                if (divParent.tagName === 'DIV') {
                    divParent.style.filter = `blur(${config.blurStrength})`;
                }
            }
        });

        // 处理h5元素
        document.querySelectorAll('h5').forEach(h5Element => {
            if (config.keywordsForH5.some(keyword => h5Element.textContent.includes(keyword))) {
                const divParent = h5Element.parentNode;
                if (divParent.tagName === 'DIV') {
                    divParent.style.filter = `blur(${config.blurStrength})`;
                }
            }
        });

        // 处理表格元素
        document.querySelectorAll('table').forEach(tableElement => {
            if (config.keywordsForTable.some(keyword => tableElement.textContent.includes(keyword))) {
                const divParent = tableElement.parentNode;
                if (divParent.tagName === 'DIV') {
                    divParent.style.filter = `blur(${config.blurStrength})`;
                }
            }
        });

        // 处理其他元素
        document.querySelectorAll('p, td, div').forEach(element => {
            if (element.tagName === 'P' && config.keywordsForP.some(keyword => element.textContent.includes(keyword))) {
                element.style.filter = `blur(${config.blurStrength})`;
            } else if (element.tagName === 'TD') {
                const smallElement = element.querySelector('small');
                if (smallElement && config.smallKeywordsForTD.some(keyword => smallElement.textContent.includes(keyword))) {
                    element.style.filter = `blur(${config.blurStrength})`;
                }
            }
        });
    }

    // 移除隐私保护效果
    function removePrivacyProtection() {
        document.querySelectorAll('p, td, div').forEach(element => {
            element.style.filter = 'none';
        });
    }

    // 检查是否在模块管理器环境中
    if (typeof GM_getValue === 'function' && GM_getValue('module_privacy-protection')) {
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

    window.rainyunModules['privacy-protection'] = {
        init: initModule,
        cleanup: cleanupModule,
        enable: enablePrivacyProtection,
        disable: disablePrivacyProtection,
        toggle: togglePrivacyProtection
    };
})();