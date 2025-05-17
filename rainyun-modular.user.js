// ==UserScript==
// @name         雨云控制台模块管理器
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  雨云控制台功能模块管理器，支持模块的安装、卸载、启用、禁用和更新
// @author       ndxzzy
// @match        https://app.rainyun.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @connect      github.com
// ==/UserScript==

(function() {
    'use strict';
    
    // 脚本配置
    const CONFIG = {
        moduleListUrl: 'https://raw.githubusercontent.com/ndxzzy/rainyun-modular/main/modules/module-list.json',
        baseUrl: 'https://raw.githubusercontent.com/ndxzzy/rainyun-modular/main/modules/',
        updateCheckInterval: 24 * 60 * 60 * 1000 // 24小时
    };

    // 样式配置
    const STYLE_CONFIG = {
        primaryColor: "#37b5c1",
        secondaryColor: "#2f9ba3",
        textColor: "#2c3e50",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
    };
    
    // 状态管理
    const state = {
        menuCommands: [],
        modules: {},
        installedModules: {}
    };
    
    // DOM元素
    let managerUI = null;
    
    // 初始化
    async function init() {
        loadInstalledModules();
        document.body.appendChild(createFloatingButton());
        await checkForUpdates();
        registerMenuCommands();
        
        // 新增自启动逻辑
        if (document.readyState === 'complete') {
            autoStartModules();
        } else {
            window.addEventListener('load', () => autoStartModules());
        }
    }

    // 自动启动模块
    function autoStartModules() {
    Object.values(state.installedModules).forEach(module => {
        if (module.enabled) {
            console.log(`[管理器] 自动启动模块: ${module.name}`);
            executeModule(module);
        }
    });
}
    
    // 加载已安装模块
    function loadInstalledModules() {
        state.installedModules = GM_listValues()
            .filter(key => key.startsWith('module_'))
            .reduce((acc, key) => {
                try {
                    const moduleId = key.replace('module_', '');
                    acc[moduleId] = JSON.parse(GM_getValue(key));
                } catch (e) {
                    console.error('解析模块配置失败:', key, e);
                    GM_deleteValue(key); // 自动清理损坏数据
                }
                return acc;
            }, {});
    }
    
    // 注册菜单命令
    function registerMenuCommands() {
        // 注销旧命令
        state.menuCommands.forEach(cmd => GM_unregisterMenuCommand(cmd));
        state.menuCommands = [];
        
        // 注册新命令
        state.menuCommands.push(GM_registerMenuCommand('打开脚本管理器', openManager));
        state.menuCommands.push(GM_registerMenuCommand('检查脚本更新', checkForUpdates));
        
        // 为已安装模块添加快速开关
        Object.keys(state.installedModules).forEach(moduleId => {
            const module = state.installedModules[moduleId];
            const command = GM_registerMenuCommand(
                `${module.enabled ? '✅' : '❌'} ${module.name}`, 
                () => toggleModule(moduleId)
            );
            state.menuCommands.push(command);
        });
    }
    
    // 创建悬浮按钮
    function createFloatingButton() {
        const btn = document.createElement('div');
        btn.innerHTML = `
            <div style="
                background: ${STYLE_CONFIG.primaryColor};
                width: 48px;
                height: 48px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" 
                     stroke="#fff" stroke-width="2" stroke-linecap="round" 
                     stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
            </div>
        `;

        // 定位样式
        Object.assign(btn.style, {
            position: 'fixed',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: '9998',
            transition: 'transform 0.3s ease'
        });

        // 悬停动画
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-50%) scale(1.1)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(-50%) scale(1)';
        });

        // 点击事件
        btn.addEventListener('click', openManager);
        return btn;
    }

    // 打开管理器界面
    function openManager() {
        if (managerUI) return;

        // 创建主容器
        managerUI = document.createElement('div');
        Object.assign(managerUI.style, {
            position: 'fixed',
            left: '80px', // 距离左侧距离
            top: '50%',
            transform: 'translateY(-50%)',
            width: '360px',
            maxHeight: '80vh',
            backgroundColor: STYLE_CONFIG.backgroundColor,
            borderRadius: STYLE_CONFIG.borderRadius,
            boxShadow: STYLE_CONFIG.boxShadow,
            zIndex: '9999',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease'
        });

        // 头部
        const header = document.createElement('div');
        Object.assign(header.style, {
            padding: '20px',
            borderBottom: `1px solid rgba(0,0,0,0.1)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        });

        const title = document.createElement('h3');
        title.textContent = '模块管理器';
        Object.assign(title.style, {
            margin: '0',
            color: STYLE_CONFIG.textColor,
            fontSize: '1.2em'
        });

        const closeBtn = createIconButton('✕');
        closeBtn.addEventListener('click', () => {
            managerUI.style.opacity = '0';
            setTimeout(() => managerUI.remove(), 300);
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // 内容区域
        const content = document.createElement('div');
        Object.assign(content.style, {
            padding: '16px',
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 68px)'
        });

        // 加载模块列表
        loadModuleList().then(modules => {
            content.innerHTML = '';
            modules.forEach(module => {
                content.appendChild(createModuleCard(module));
            });
        });

        managerUI.appendChild(header);
        managerUI.appendChild(content);
        document.body.appendChild(managerUI);

        // 入场动画
        setTimeout(() => {
            managerUI.style.opacity = '1';
            managerUI.style.transform = 'translateY(-50%) translateX(0)';
        }, 10);
    }

    // 创建图标按钮
    function createIconButton(icon) {
        const btn = document.createElement('div');
        btn.innerHTML = icon;
        Object.assign(btn.style, {
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            color: STYLE_CONFIG.textColor
        });
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(0,0,0,0.05)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'transparent';
        });
        return btn;
    }
    
    // 创建模块卡片
    function createModuleCard(module) {
        const isInstalled = state.installedModules[module.id];
        const isEnabled = isInstalled ? isInstalled.enabled : false;
        
        const card = document.createElement('div');
        Object.assign(card.style, {
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            transition: 'box-shadow 0.3s ease',
            border: '1px solid rgba(0,0,0,0.05)'
        });
        
        card.onmouseover = () => {
            card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        };
        
        card.onmouseout = () => {
            card.style.boxShadow = 'none';
        };
        
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        `;
        
        const title = document.createElement('h4');
        title.textContent = module.name;
        title.style.margin = '0';
        
        const status = document.createElement('span');
        status.textContent = isInstalled 
            ? (isEnabled ? '已启用' : '已禁用') 
            : '未安装';
        status.style.cssText = `
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        `;
        
        if (isInstalled) {
            status.style.backgroundColor = isEnabled ? '#4CAF5033' : '#F4433633';
            status.style.color = isEnabled ? '#4CAF50' : '#F44336';
        } else {
            status.style.backgroundColor = '#2196F333';
            status.style.color = '#2196F3';
        }
        
        header.appendChild(title);
        header.appendChild(status);
        
        const description = document.createElement('p');
        description.textContent = module.description;
        description.style.cssText = `
            margin: 0 0 12px 0;
            color: #666;
            font-size: 14px;
        `;
        
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 8px;
        `;
        
        // 安装/卸载按钮
        const installBtn = document.createElement('button');
        installBtn.textContent = isInstalled ? '卸载' : '安装';
        installBtn.style.cssText = `
            flex: 1;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
        `;
        
        if (isInstalled) {
            installBtn.style.backgroundColor = '#F44336';
            installBtn.style.color = 'white';
            installBtn.onclick = () => uninstallModule(module.id);
        } else {
            installBtn.style.backgroundColor = '#4CAF50';
            installBtn.style.color = 'white';
            installBtn.onclick = () => installModule(module);
        }
        
        // 启用/禁用按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = isInstalled ? (isEnabled ? '禁用' : '启用') : '不可用';
        toggleBtn.style.cssText = `
            flex: 1;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
        `;
        
        if (isInstalled) {
            toggleBtn.style.backgroundColor = isEnabled ? '#F44336' : '#4CAF50';
            toggleBtn.style.color = 'white';
            toggleBtn.onclick = () => toggleModule(module.id);
        } else {
            toggleBtn.style.backgroundColor = '#ccc';
            toggleBtn.style.color = '#666';
            toggleBtn.disabled = true;
        }
        
        // 检查更新按钮
        const updateBtn = document.createElement('button');
        updateBtn.textContent = '检查更新';
        updateBtn.style.cssText = `
            flex: 1;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
            background-color: #2196F3;
            color: white;
        `;
        
        updateBtn.onclick = () => checkModuleUpdate(module);
        
        actions.appendChild(installBtn);
        actions.appendChild(toggleBtn);
        if (isInstalled) {
            actions.appendChild(updateBtn);
        }
        
        card.appendChild(header);
        card.appendChild(description);
        card.appendChild(actions);
        
        return card;
    }
    
    // 加载模块列表
    async function loadModuleList() {
        try {
            const response = await fetch(CONFIG.moduleListUrl);
            if (!response.ok) {
                throw new Error(`HTTP错误，状态码: ${response.status}`);
            }
            const modules = await response.json();
            state.modules = modules;
            return modules;
        } catch (error) {
            console.error('加载模块列表失败:', error);
            throw error;
        }
    }
    
    // 安装模块
    async function installModule(module) {
        try {
            const scriptUrl = `${CONFIG.baseUrl}${module.path}/${module.script}`;
            const response = await fetch(scriptUrl);
            
            if (!response.ok) {
                throw new Error(`下载脚本失败，状态码: ${response.status}`);
            }
            
            const scriptContent = await response.text();
            const moduleData = {
                id: module.id,
                name: module.name,
                description: module.description,
                version: module.version,
                enabled: true,
                installedAt: new Date().toISOString(),
                scriptContent
            };
            
            GM_setValue(`module_${module.id}`, JSON.stringify(moduleData));
            loadInstalledModules();
            registerMenuCommands();
            
            if (managerUI) {
                openManager(); // 刷新界面
            }
            
            showNotification(`模块 "${module.name}" 安装成功`);
            executeModule(moduleData);
        } catch (error) {
            console.error('安装模块失败:', error);
            showNotification(`安装模块失败: ${error.message}`, 'error');
        }
    }
    
    // 卸载模块
    function uninstallModule(moduleId) {
        const module = state.installedModules[moduleId];
        if (!module) return;
        
        GM_deleteValue(`module_${moduleId}`);
        loadInstalledModules();
        registerMenuCommands();
        
        if (managerUI) {
            openManager(); // 刷新界面
        }
        
        showNotification(`模块 "${module.name}" 已卸载`);
    }
    
    // 切换模块状态
    function toggleModule(moduleId) {
        const module = state.installedModules[moduleId];
        if (!module) return;
        
        module.enabled = !module.enabled;
        GM_setValue(`module_${moduleId}`, JSON.stringify(module));
        registerMenuCommands();
        
        if (managerUI) {
            openManager(); // 刷新界面
        }
        
        const status = module.enabled ? '启用' : '禁用';
        showNotification(`模块 "${module.name}" 已${status}`);
        
        if (module.enabled) {
            executeModule(module);
        }
    }
    
    // 执行模块
    function executeModule(module) {
        if (!module.enabled) return;
        try {
            const config = {
                enabled: module.enabled,
                // 可扩展其他配置参数
            };

            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    // 配置注入
                    window.RainyunModularConfig = window.RainyunModularConfig || {};
                    window.RainyunModularConfig['${module.id}'] = ${JSON.stringify(config)};
                    
                    // 智能等待DOM就绪
                    const executor = () => {
                        try {
                            ${module.scriptContent}
                        } catch (e) {
                            console.error('[模块加载] 执行错误:', e);
                        }
                    };
                    
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', executor);
                    } else {
                        setTimeout(executor, 100); // 确保异步执行
                    }
                })();
            `;
            script.setAttribute('data-module', module.id);
            document.head.appendChild(script);
        } catch (error) {
            console.error(`执行模块 ${module.name} 失败:`, error);
        }
    }
    
    // 检查更新
    async function checkForUpdates() {
        try {
            const lastCheck = GM_getValue('lastUpdateCheck');
            const now = Date.now();
            
            // 如果距离上次检查不足24小时，则不检查
            if (lastCheck && now - lastCheck < CONFIG.updateCheckInterval) {
                return;
            }
            
            GM_setValue('lastUpdateCheck', now);
            
            await loadModuleList();
            
            let updateAvailable = false;
            Object.keys(state.installedModules).forEach(moduleId => {
                const installedModule = state.installedModules[moduleId];
                const remoteModule = state.modules.find(m => m.id === moduleId);
                
                if (remoteModule && remoteModule.version > installedModule.version) {
                    updateAvailable = true;
                    installedModule.updateAvailable = true;
                    GM_setValue(`module_${moduleId}`, JSON.stringify(installedModule));
                } else if (installedModule.updateAvailable) {
                    installedModule.updateAvailable = false;
                    GM_setValue(`module_${moduleId}`, JSON.stringify(installedModule));
                }
            });
            
            loadInstalledModules();
            registerMenuCommands();
            
            if (updateAvailable) {
                showNotification('有可用更新，请在管理器中查看', 'info');
            }
            
            return updateAvailable;
        } catch (error) {
            console.error('检查更新失败:', error);
            return false;
        }
    }
    
    // 检查模块更新
    async function checkModuleUpdate(moduleInfo) {
        const moduleId = moduleInfo.id;
        const installedModule = state.installedModules[moduleId];
        
        if (!installedModule) {
            showNotification('模块未安装', 'error');
            return;
        }
        
        try {
            await loadModuleList();
            const remoteModule = state.modules.find(m => m.id === moduleId);
            
            if (!remoteModule) {
                showNotification('找不到远程模块信息', 'error');
                return;
            }
            
            if (remoteModule.version > installedModule.version) {
                const confirmUpdate = confirm(`发现更新: ${installedModule.name} ${installedModule.version} → ${remoteModule.version}\n是否更新?`);
                if (confirmUpdate) {
                    await installModule(remoteModule);
                }
            } else {
                showNotification('模块已是最新版本', 'success');
            }
        } catch (error) {
            console.error('检查模块更新失败:', error);
            showNotification(`检查更新失败: ${error.message}`, 'error');
        }
    }
    
    // 显示通知
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 99999;
            transform: translateY(20px);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
        `;
        
        if (type === 'error') {
            notification.style.backgroundColor = '#F44336';
        } else if (type === 'success') {
            notification.style.backgroundColor = '#4CAF50';
        } else {
            notification.style.backgroundColor = '#2196F3';
        }
        
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // 自动关闭
        setTimeout(() => {
            notification.style.transform = 'translateY(20px)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // 初始化
    init();
})();  