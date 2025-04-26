// ==UserScript==
// @name         雨云控制台模块管理器
// @namespace    https://github.com/ndxzzy/rainyun-modular
// @version      1.0.0
// @description  雨云控制台功能模块管理器，支持模块的安装、卸载、启用、禁用和更新
// @author       ndxzzy, DeepSeek
// @match        https://app.rainyun.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_addElement
// @connect      github.com
// @connect      raw.githubusercontent.com
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @resource     css https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css
// @resource     icons https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css
// @icon         https://console.rainyun.com/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    // 加载Bootstrap CSS
    GM_addStyle(GM_getResourceText('css'));
    GM_addStyle(GM_getResourceText('icons'));

    // 自定义样式
    GM_addStyle(`
        .rainyun-modular-container {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 9999;
            width: 350px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 0 20px rgba(0,0,0,0.2);
            border-radius: 10px;
            background-color: #fff;
            display: none;
        }
        .rainyun-modular-header {
            background-color: #0d6efd;
            color: white;
            padding: 12px 15px;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .rainyun-modular-body {
            padding: 15px;
        }
        .module-card {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            transition: all 0.2s;
        }
        .module-card:hover {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .module-card.disabled {
            opacity: 0.6;
            background-color: #f8f9fa;
        }
        .module-actions {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }
        .module-btn {
            flex: 1;
            padding: 5px;
            font-size: 12px;
        }
        .toggle-btn {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 9998;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #0d6efd;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            border: none;
        }
        .badge-custom {
            font-size: 0.75em;
            font-weight: 500;
        }
        .tab-content {
            padding-top: 15px;
        }
        .update-available {
            border-left: 4px solid #ffc107;
        }
        .new-module {
            border-left: 4px solid #198754;
        }
    `);

    // 模块管理器类
    class RainyunModular {
        constructor() {
            this.modules = [];
            this.installedModules = [];
            this.activeTab = 'installed';
            this.dragging = false;
            this.offsetX = 0;
            this.offsetY = 0;
            this.init();
        }

        async init() {
            this.createUI();
            this.loadInstalledModules();
            await this.fetchModuleList();
            this.renderModules();
            this.setupEventListeners();
        }

        createUI() {
            // 创建容器
            this.container = document.createElement('div');
            this.container.className = 'rainyun-modular-container';
            this.container.id = 'rainyunModularContainer';
            
            // 创建头部
            const header = document.createElement('div');
            header.className = 'rainyun-modular-header';
            header.innerHTML = `
                <h5 class="mb-0"><i class="bi bi-puzzle"></i> 雨云模块管理器</h5>
                <button type="button" class="btn-close btn-close-white" aria-label="Close"></button>
            `;
            this.container.appendChild(header);
            
            // 创建主体
            const body = document.createElement('div');
            body.className = 'rainyun-modular-body';
            body.innerHTML = `
                <ul class="nav nav-tabs" id="modularTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="installed-tab" data-bs-toggle="tab" data-bs-target="#installed" type="button" role="tab">已安装</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="available-tab" data-bs-toggle="tab" data-bs-target="#available" type="button" role="tab">可用模块</button>
                    </li>
                </ul>
                <div class="tab-content" id="modularTabContent">
                    <div class="tab-pane fade show active" id="installed" role="tabpanel" aria-labelledby="installed-tab"></div>
                    <div class="tab-pane fade" id="available" role="tabpanel" aria-labelledby="available-tab"></div>
                </div>
                <div class="d-flex justify-content-between mt-3">
                    <button class="btn btn-sm btn-outline-secondary" id="refreshModules"><i class="bi bi-arrow-clockwise"></i> 刷新</button>
                    <button class="btn btn-sm btn-outline-primary" id="checkUpdates"><i class="bi bi-cloud-arrow-down"></i> 检查更新</button>
                </div>
            `;
            this.container.appendChild(body);
            
            // 创建切换按钮
            this.toggleBtn = document.createElement('button');
            this.toggleBtn.className = 'toggle-btn';
            this.toggleBtn.innerHTML = '<i class="bi bi-puzzle" style="font-size: 1.5rem;"></i>';
            this.toggleBtn.title = '雨云模块管理器';
            
            // 添加到文档
            document.body.appendChild(this.container);
            document.body.appendChild(this.toggleBtn);
        }

        setupEventListeners() {
            // 切换按钮点击事件
            this.toggleBtn.addEventListener('click', () => {
                this.container.style.display = this.container.style.display === 'block' ? 'none' : 'block';
            });
            
            // 关闭按钮点击事件
            this.container.querySelector('.btn-close').addEventListener('click', () => {
                this.container.style.display = 'none';
            });
            
            // 刷新按钮点击事件
            document.getElementById('refreshModules').addEventListener('click', async () => {
                await this.fetchModuleList();
                this.renderModules();
                Swal.fire({
                    title: '刷新成功',
                    text: '模块列表已刷新',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            });
            
            // 检查更新按钮点击事件
            document.getElementById('checkUpdates').addEventListener('click', async () => {
                await this.checkForUpdates();
            });
            
            // 标签页切换事件
            document.querySelectorAll('#modularTabs button').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    this.activeTab = e.target.getAttribute('data-bs-target').replace('#', '');
                });
            });
            
            // 拖拽功能
            const header = this.container.querySelector('.rainyun-modular-header');
            header.addEventListener('mousedown', (e) => {
                this.dragging = true;
                const rect = this.container.getBoundingClientRect();
                this.offsetX = e.clientX - rect.left;
                this.offsetY = e.clientY - rect.top;
                this.container.style.cursor = 'grabbing';
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!this.dragging) return;
                this.container.style.left = (e.clientX - this.offsetX) + 'px';
                this.container.style.top = (e.clientY - this.offsetY) + 'px';
            });
            
            document.addEventListener('mouseup', () => {
                this.dragging = false;
                this.container.style.cursor = '';
            });
        }

        loadInstalledModules() {
            const installed = GM_listValues().filter(v => v.startsWith('module_'));
            this.installedModules = installed.map(key => {
                const moduleData = GM_getValue(key);
                return {
                    id: key.replace('module_', ''),
                    ...moduleData
                };
            });
        }

        async fetchModuleList() {
            try {
                const response = await this.fetchUrl('https://raw.githubusercontent.com/yourname/rainyun-modular/main/modules/module-list.json');
                this.modules = JSON.parse(response);
                
                // 检查是否有新模块或更新
                this.modules.forEach(module => {
                    const installed = this.installedModules.find(m => m.id === module.id);
                    if (installed) {
                        module.installed = true;
                        module.enabled = installed.enabled;
                        if (this.compareVersions(module.version, installed.version) > 0) {
                            module.updateAvailable = true;
                        }
                    } else {
                        module.installed = false;
                    }
                });
            } catch (error) {
                console.error('Failed to fetch module list:', error);
                Swal.fire({
                    title: '错误',
                    text: '无法获取模块列表，请检查网络连接',
                    icon: 'error'
                });
            }
        }

        async fetchUrl(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    onload: (response) => {
                        if (response.status >= 200 && response.status < 300) {
                            resolve(response.responseText);
                        } else {
                            reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                        }
                    },
                    onerror: (error) => {
                        reject(error);
                    }
                });
            });
        }

        compareVersions(v1, v2) {
            const parts1 = v1.split('.').map(Number);
            const parts2 = v2.split('.').map(Number);
            
            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const part1 = parts1[i] || 0;
                const part2 = parts2[i] || 0;
                if (part1 > part2) return 1;
                if (part1 < part2) return -1;
            }
            return 0;
        }

        renderModules() {
            const installedTab = document.getElementById('installed');
            const availableTab = document.getElementById('available');
            
            installedTab.innerHTML = '';
            availableTab.innerHTML = '';
            
            if (this.installedModules.length === 0) {
                installedTab.innerHTML = '<div class="text-center py-3 text-muted">没有安装任何模块</div>';
            } else {
                this.installedModules.forEach(module => {
                    const moduleInfo = this.modules.find(m => m.id === module.id) || module;
                    installedTab.appendChild(this.createModuleCard(moduleInfo, true));
                });
            }
            
            const availableModules = this.modules.filter(m => !m.installed);
            if (availableModules.length === 0) {
                availableTab.innerHTML = '<div class="text-center py-3 text-muted">没有可用的新模块</div>';
            } else {
                availableModules.forEach(module => {
                    availableTab.appendChild(this.createModuleCard(module, false));
                });
            }
        }

        createModuleCard(module, isInstalled) {
            const card = document.createElement('div');
            card.className = `module-card ${!module.enabled && isInstalled ? 'disabled' : ''} ${module.updateAvailable ? 'update-available' : ''} ${!isInstalled ? 'new-module' : ''}`;
            
            // 创建卡片内容
            let html = `
                <div class="d-flex justify-content-between align-items-start">
                    <h6 class="mb-1">${module.name} <span class="badge bg-primary badge-custom">v${module.version}</span></h6>
                    ${module.updateAvailable ? '<span class="badge bg-warning text-dark badge-custom">可更新</span>' : ''}
                </div>
                <p class="small text-muted mb-2">${module.description}</p>
            `;
            
            // 添加作者信息
            if (module.author) {
                html += `<p class="small mb-1"><i class="bi bi-person"></i> ${module.author}</p>`;
            }
            
            // 添加操作按钮
            const actions = document.createElement('div');
            actions.className = 'module-actions';
            
            if (isInstalled) {
                // 已安装模块的操作按钮
                actions.innerHTML = `
                    <button class="btn btn-sm ${module.enabled ? 'btn-warning' : 'btn-success'} module-btn toggle-module" data-id="${module.id}">
                        <i class="bi ${module.enabled ? 'bi-pause' : 'bi-play'}"></i> ${module.enabled ? '禁用' : '启用'}
                    </button>
                    <button class="btn btn-sm btn-danger module-btn uninstall-module" data-id="${module.id}">
                        <i class="bi bi-trash"></i> 卸载
                    </button>
                    ${module.updateAvailable ? `
                    <button class="btn btn-sm btn-info module-btn update-module" data-id="${module.id}">
                        <i class="bi bi-cloud-arrow-down"></i> 更新
                    </button>
                    ` : ''}
                `;
            } else {
                // 未安装模块的操作按钮
                actions.innerHTML = `
                    <button class="btn btn-sm btn-success module-btn install-module" data-id="${module.id}">
                        <i class="bi bi-download"></i> 安装
                    </button>
                    <button class="btn btn-sm btn-outline-secondary module-btn view-details" data-id="${module.id}">
                        <i class="bi bi-info-circle"></i> 详情
                    </button>
                `;
            }
            
            card.innerHTML = html;
            card.appendChild(actions);
            
            // 添加事件监听器
            if (isInstalled) {
                card.querySelector('.toggle-module').addEventListener('click', (e) => this.toggleModule(e.target.dataset.id));
                card.querySelector('.uninstall-module').addEventListener('click', (e) => this.uninstallModule(e.target.dataset.id));
                if (module.updateAvailable) {
                    card.querySelector('.update-module').addEventListener('click', (e) => this.updateModule(e.target.dataset.id));
                }
            } else {
                card.querySelector('.install-module').addEventListener('click', (e) => this.installModule(e.target.dataset.id));
                card.querySelector('.view-details').addEventListener('click', (e) => this.showModuleDetails(e.target.dataset.id));
            }
            
            return card;
        }

        async toggleModule(moduleId) {
            const module = this.installedModules.find(m => m.id === moduleId);
            if (!module) return;
            
            module.enabled = !module.enabled;
            GM_setValue(`module_${moduleId}`, module);
            
            // 重新加载模块脚本
            if (module.enabled) {
                await this.loadModuleScript(moduleId);
            } else {
                this.unloadModuleScript(moduleId);
            }
            
            this.loadInstalledModules();
            this.renderModules();
            
            Swal.fire({
                title: module.enabled ? '模块已启用' : '模块已禁用',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }

        async installModule(moduleId) {
            const module = this.modules.find(m => m.id === moduleId);
            if (!module) return;
            
            try {
                // 获取模块脚本
                const scriptUrl = `https://raw.githubusercontent.com/yourname/rainyun-modular/main/modules/${module.path}`;
                const scriptContent = await this.fetchUrl(scriptUrl);
                
                // 保存模块信息
                const moduleData = {
                    id: module.id,
                    name: module.name,
                    version: module.version,
                    description: module.description,
                    author: module.author,
                    enabled: true,
                    script: scriptContent
                };
                
                GM_setValue(`module_${moduleId}`, moduleData);
                
                // 加载模块脚本
                await this.loadModuleScript(moduleId);
                
                this.loadInstalledModules();
                this.renderModules();
                
                Swal.fire({
                    title: '安装成功',
                    text: `${module.name} 已成功安装并启用`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Failed to install module:', error);
                Swal.fire({
                    title: '安装失败',
                    text: '无法安装模块，请检查网络连接',
                    icon: 'error'
                });
            }
        }

        async updateModule(moduleId) {
            const module = this.modules.find(m => m.id === moduleId);
            if (!module) return;
            
            try {
                // 获取模块脚本
                const scriptUrl = `https://raw.githubusercontent.com/yourname/rainyun-modular/main/modules/${module.path}`;
                const scriptContent = await this.fetchUrl(scriptUrl);
                
                // 更新模块信息
                const moduleData = {
                    id: module.id,
                    name: module.name,
                    version: module.version,
                    description: module.description,
                    author: module.author,
                    enabled: true,
                    script: scriptContent
                };
                
                // 卸载旧版本
                this.unloadModuleScript(moduleId);
                
                // 保存新版本
                GM_setValue(`module_${moduleId}`, moduleData);
                
                // 加载新版本
                await this.loadModuleScript(moduleId);
                
                this.loadInstalledModules();
                await this.fetchModuleList();
                this.renderModules();
                
                Swal.fire({
                    title: '更新成功',
                    text: `${module.name} 已更新到 v${module.version}`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Failed to update module:', error);
                Swal.fire({
                    title: '更新失败',
                    text: '无法更新模块，请检查网络连接',
                    icon: 'error'
                });
            }
        }

        uninstallModule(moduleId) {
            Swal.fire({
                title: '确认卸载',
                text: '您确定要卸载这个模块吗？',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '卸载',
                cancelButtonText: '取消'
            }).then((result) => {
                if (result.isConfirmed) {
                    const module = this.installedModules.find(m => m.id === moduleId);
                    if (!module) return;
                    
                    // 卸载脚本
                    this.unloadModuleScript(moduleId);
                    
                    // 删除存储
                    GM_deleteValue(`module_${moduleId}`);
                    
                    this.loadInstalledModules();
                    this.renderModules();
                    
                    Swal.fire({
                        title: '卸载成功',
                        text: `${module.name} 已成功卸载`,
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            });
        }

        loadModuleScript(moduleId) {
            return new Promise((resolve, reject) => {
                const module = this.installedModules.find(m => m.id === moduleId);
                if (!module || !module.enabled || !module.script) {
                    reject(new Error('Module not found or disabled'));
                    return;
                }
                
                // 检查是否已经加载
                if (document.getElementById(`module-script-${moduleId}`)) {
                    resolve();
                    return;
                }
                
                // 创建脚本元素
                const script = document.createElement('script');
                script.id = `module-script-${moduleId}`;
                script.textContent = module.script;
                
                script.onload = () => resolve();
                script.onerror = (error) => reject(error);
                
                document.body.appendChild(script);
            });
        }

        unloadModuleScript(moduleId) {
            const script = document.getElementById(`module-script-${moduleId}`);
            if (script) {
                script.remove();
            }
        }

        async checkForUpdates() {
            await this.fetchModuleList();
            const updates = this.modules.filter(m => m.updateAvailable);
            
            if (updates.length === 0) {
                Swal.fire({
                    title: '没有可用更新',
                    text: '所有模块都是最新版本',
                    icon: 'info',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                let html = '<p>以下模块有可用更新：</p><ul>';
                updates.forEach(module => {
                    const installed = this.installedModules.find(m => m.id === module.id);
                    html += `<li><strong>${module.name}</strong>: v${installed.version} → v${module.version}</li>`;
                });
                html += '</ul>';
                
                Swal.fire({
                    title: '发现更新',
                    html: html,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: '全部更新',
                    cancelButtonText: '稍后'
                }).then((result) => {
                    if (result.isConfirmed) {
                        this.updateAllModules(updates);
                    }
                });
            }
            
            this.renderModules();
        }

        async updateAllModules(modules) {
            const results = [];
            
            for (const module of modules) {
                try {
                    await this.updateModule(module.id);
                    results.push({
                        name: module.name,
                        success: true
                    });
                } catch (error) {
                    results.push({
                        name: module.name,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            let html = '<p>更新结果：</p><ul>';
            results.forEach(result => {
                html += `<li><strong>${result.name}</strong>: ${result.success ? '✅ 成功' : `❌ 失败 (${result.error})`}</li>`;
            });
            html += '</ul>';
            
            Swal.fire({
                title: '更新完成',
                html: html,
                icon: 'info'
            });
        }

        showModuleDetails(moduleId) {
            const module = this.modules.find(m => m.id === moduleId);
            if (!module) return;
            
            let html = `
                <h5>${module.name} <span class="badge bg-primary">v${module.version}</span></h5>
                <p class="mb-2">${module.description}</p>
                <p class="small"><i class="bi bi-person"></i> 作者: ${module.author || '未知'}</p>
            `;
            
            if (module.details) {
                html += `<div class="mt-3">${module.details}</div>`;
            }
            
            Swal.fire({
                title: '模块详情',
                html: html,
                confirmButtonText: '安装',
                showCancelButton: true,
                cancelButtonText: '关闭'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.installModule(moduleId);
                }
            });
        }
    }

    // 初始化管理器
    new RainyunModular();
})();