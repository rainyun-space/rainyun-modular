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
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';
    
    // 脚本配置
    const CONFIG = {
        moduleListUrl: 'https://raw.githubusercontent.com/ndxzzy/rainyun-modular/main/modules/module-list.json',
        baseUrl: 'https://raw.githubusercontent.com/ndxzzy/rainyun-modular/main/modules/',
        updateCheckInterval: 24 * 60 * 60 * 1000 // 24小时
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
        await checkForUpdates();
        registerMenuCommands();
    }
    
    // 加载已安装模块
    function loadInstalledModules() {
        const modules = GM_listValues().filter(key => key.startsWith('module_'));
        state.installedModules = modules.reduce((acc, key) => {
            const moduleId = key.replace('module_', '');
            acc[moduleId] = JSON.parse(GM_getValue(key));
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
    
    // 打开管理器界面
    function openManager() {
        if (managerUI) {
            managerUI.remove();
        }
        
        // 创建UI
        managerUI = document.createElement('div');
        managerUI.id = 'rainyun-script-manager';
        managerUI.style.cssText = `
            position: fixed;
            top: 50px;
            right: 50px;
            width: 600px;
            max-height: 80vh;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            z-index: 9999;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;
        
        // 头部
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px;
            background: #f8f9fa;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Rainyun 脚本管理器';
        title.style.margin = '0';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = `
            background: #f44336;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        `;
        closeBtn.addEventListener('click', () => managerUI.remove());
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // 主体内容
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        `;
        
        // 模块列表
        const moduleList = document.createElement('div');
        content.appendChild(moduleList);
        
        // 加载模块列表
        loadModuleList().then(modules => {
            moduleList.innerHTML = '';
            
            if (!modules || modules.length === 0) {
                moduleList.innerHTML = '<p>未找到可用模块</p>';
                return;
            }
            
            modules.forEach(module => {
                const moduleCard = createModuleCard(module);
                moduleList.appendChild(moduleCard);
            });
        }).catch(err => {
            moduleList.innerHTML = `<p>加载模块列表失败: ${err.message}</p>`;
        });
        
        managerUI.appendChild(header);
        managerUI.appendChild(content);
        document.body.appendChild(managerUI);
    }
    
    // 创建模块卡片
    function createModuleCard(module) {
        const isInstalled = state.installedModules[module.id];
        const isEnabled = isInstalled ? isInstalled.enabled : false;
        
        const card = document.createElement('div');
        card.style.cssText = `
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            transition: box-shadow 0.3s;
        `;
        
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
            // 创建独立的脚本标签，避免作用域污染
            const script = document.createElement('script');
            script.textContent = `(function(){${module.scriptContent}})();`; // 包裹立即执行函数
            script.setAttribute('data-module', module.id);
            document.head.appendChild(script);
        } catch (error) {
            console.error(`执行模块 ${module.name} 失败:`, error);
            showNotification(`执行模块 "${module.name}" 失败: ${error.message}`, 'error');
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