(function() {
    'use strict';

    var privacyProtectionEnabled = false;

    // 敏感关键词列表
    const keywordsForH4 = [
        '面板用户名', 'CDN设置', '发票抬头列表', '我的发票',
        '域名管理', '我的模板', '绑定支付宝', '绑定邮箱', '绑定手机',
        '账号变动日志', 'API密钥', 'IP列表'
    ];

    const keywordsForH5 = [
        'IP 地址管理'
    ];

    // 旧表格打码关键词
    const keywordsForTable = ['CNAME', '桶名', '服务名称'];

    const keywordsForP = ['公网IP', '服务器ID', '标签'];

    const smallKeywordsForTD = [
        '公网 IP 地址：', '公网IP地址：', '内网IP：', '远程连接地址 (RDP/SSH)：', '面板主账户：', '安装结果输出', 'IPv4公网地址'
    ];

    // 特殊表格处理配置：表头文本 -> 需要模糊的列索引
    const specialTableConfigs = [
        { header: '提现账户', columnIndex: 2 },
        { header: '信息', columnIndex: 3 },
        { header: '映射公网地址', columnIndex: 3 },
        { header: '对外地址:端口', columnIndex: 0 },
        { header: 'IP地址', columnIndex: 0 }
    ];

    // SVG icons for normal and slashed-eye states
    const normalEyeIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    `;
    const slashedEyeIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    `;

    // Create and style the toggle button
    function createToggleButton() {
        const button = document.createElement('div');
        button.innerHTML = normalEyeIcon; // Set the initial icon to the normal eye

        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.left = '20px';
        button.style.width = '40px';
        button.style.height = '40px';
        button.style.backgroundColor = '#37b5c1';
        button.style.borderRadius = '50%';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
        document.body.appendChild(button);

        // Add dragging functionality
        let isDragging = false;
        let hasMoved = false;
        let offsetX = 0;
        let offsetY = 0;
        let initialX = 0;
        let initialY = 0;
        const dragThreshold = 3; // 拖动的最小距离阈值

        button.addEventListener('mousedown', (e) => {
            isDragging = true;
            hasMoved = false;
            offsetX = e.clientX - button.offsetLeft;
            offsetY = e.clientY - button.offsetTop;
            initialX = e.clientX;
            initialY = e.clientY;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const moveX = e.clientX - initialX;
                const moveY = e.clientY - initialY;
                if (Math.abs(moveX) > dragThreshold || Math.abs(moveY) > dragThreshold) {
                    hasMoved = true;
                    button.style.cursor = 'move';
                    button.style.left = `${e.clientX - offsetX}px`;
                    button.style.top = `${e.clientY - offsetY}px`;
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                const moveX = e.clientX - initialX;
                const moveY = e.clientY - initialY;
                isDragging = false;
                button.style.cursor = 'pointer';
                if (!hasMoved && Math.abs(moveX) <= dragThreshold && Math.abs(moveY) <= dragThreshold) {
                    togglePrivacyProtection();
                }
            }
        });

        return button;
    }

    const toggleButton = createToggleButton();

    function togglePrivacyProtection() {
        privacyProtectionEnabled = !privacyProtectionEnabled;
        if (privacyProtectionEnabled) {
            applyPrivacyProtection();
            toggleButton.innerHTML = slashedEyeIcon; // Change to slashed-eye icon
        } else {
            removePrivacyProtection();
            toggleButton.innerHTML = normalEyeIcon; // Change back to normal eye icon
        }
    }

    // 监听页面变化，持续应用隐私保护效果
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (privacyProtectionEnabled) {
                applyPrivacyProtection();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 特殊表格列模糊处理
    function applySpecialTableBlurring() {
        document.querySelectorAll('table').forEach(table => {
            // 查找表头行
            const headerRow = table.querySelector('thead tr') || table.querySelector('tr:first-child');
            if (!headerRow) return;

            const headerCells = headerRow.querySelectorAll('th, td');

            // 检查每个预设配置
            specialTableConfigs.forEach(config => {
                let targetColumnIndex = -1;

                // 查找匹配的表头
                headerCells.forEach((cell, index) => {
                    if (cell.textContent.trim().includes(config.header)) {
                        targetColumnIndex = config.columnIndex;
                    }
                });

                // 模糊整列
                if (targetColumnIndex !== -1) {
                    // 选择所有行（包括表头）
                    const rows = table.querySelectorAll('tr');
                    rows.forEach(row => {
                        // 获取当前行的所有单元格（包括 th 和 td）
                        const cells = row.querySelectorAll('th, td');
                        if (cells.length > targetColumnIndex) {
                            const targetCell = cells[targetColumnIndex];
                            targetCell.style.filter = 'blur(5px)';
                        }
                    });
                }
            });
        });
    }

    function applyPrivacyProtection() {
        // 原有元素模糊处理
        var h4Elements = document.querySelectorAll('h4');
        h4Elements.forEach(h4Element => {
            if (keywordsForH4.some(keyword => h4Element.textContent.includes(keyword))) {
                var divParent = h4Element.parentNode;
                if (divParent.tagName === 'DIV') {
                    divParent.style.filter = 'blur(5px)';
                }
            }
        });

        var h5Elements = document.querySelectorAll('h5');
        h5Elements.forEach(h5Element => {
            if (keywordsForH5.some(keyword => h5Element.textContent.includes(keyword))) {
                var divParent = h5Element.parentNode;
                if (divParent.tagName === 'DIV') {
                    divParent.style.filter = 'blur(5px)';
                }
            }
        });

        // 旧表格打码功能（整个表格父级模糊）
        var tableElements = document.querySelectorAll('table');
        tableElements.forEach(tableElement => {
            if (keywordsForTable.some(keyword => tableElement.textContent.includes(keyword))) {
                var divParent = tableElement.parentNode;
                if (divParent.tagName === 'DIV') {
                    divParent.style.filter = 'blur(5px)';
                }
            }
        });

        var elements = document.querySelectorAll('p, td, div');
        elements.forEach(element => {
            if (element.tagName === 'P' && keywordsForP.some(keyword => element.textContent.includes(keyword))) {
                element.style.filter = 'blur(5px)';
            } else if (element.tagName === 'TD') {
                var smallElement = element.querySelector('small');
                if (smallElement && smallKeywordsForTD.some(keyword => smallElement.textContent.includes(keyword))) {
                    element.style.filter = 'blur(5px)';
                }
            }
        });

        // 新增特殊表格列模糊
        applySpecialTableBlurring();
    }

    function removePrivacyProtection() {
        // 移除原有元素模糊
        var elements = document.querySelectorAll('p, td, div');
        elements.forEach(element => {
            element.style.filter = 'none';
        });

        // 移除表格列模糊
        document.querySelectorAll('td').forEach(td => {
            td.style.filter = 'none';
        });

        // 移除表格头模糊
        document.querySelectorAll('th').forEach(th => {
            th.style.filter = 'none';
        });

        // 移除旧表格父级div模糊
        document.querySelectorAll('div').forEach(div => {
            div.style.filter = 'none';
        });
    }

    console.log('[隐私保护] 模块已启动');
})();