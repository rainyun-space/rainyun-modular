(function() {
    'use strict';

    // 初始化模块
    function initModule() {
        // 监听URL变化
        let lastUrl = location.href;
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                checkAndInject();
            }
        }).observe(document, {subtree: true, childList: true});

        checkAndInject();
    }

    // 检查并注入按钮
    async function checkAndInject() {
        if (location.href === 'https://app.rainyun.com/account/reward/withdraw') {
            const input = await waitForElement('input[placeholder*="提现的积分"]', 5000);
            if (input && !document.getElementById('maxPointsBtn')) {
                injectMaxButton(input);
            }
        }
    }

    // 注入最大积分按钮
    function injectMaxButton(input) {
        // 创建按钮容器
        const btnGroup = document.createElement('div');
        btnGroup.className = 'input-group-append';

        // 创建按钮
        const btn = document.createElement('button');
        btn.id = 'maxPointsBtn';
        btn.className = 'btn btn-outline-primary';
        btn.type = 'button';
        btn.innerHTML = '填充最大积分';
        btn.style.cssText = 'white-space: nowrap; transition: all 0.3s;';

        // 添加点击事件
        btn.addEventListener('click', () => {
            try {
                const cookieData = document.cookie.match(/user-data=([^;]+)/);
                if (!cookieData) throw new Error('未找到用户数据');

                const userData = JSON.parse(decodeURIComponent(cookieData[1]));
                const maxPoints = userData.Points - (userData.LockPoints || 0);

                if (maxPoints < 60000) {
                    showToast('最低提现额度为60000积分', 'warning');
                    return;
                }

                input.value = maxPoints;
                // 触发Vue数据更新
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
                showToast(`已填充最大可用积分：${maxPoints}`, 'success');
            } catch (e) {
                showToast('获取积分数据失败，请刷新页面', 'error');
                console.error(e);
            }
        });

        // 添加悬停效果
        btn.addEventListener('mouseover', () => {
            btn.style.transform = 'translateY(-1px)';
            btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
        });
        btn.addEventListener('mouseout', () => {
            btn.style.transform = 'none';
            btn.style.boxShadow = 'none';
        });

        // 插入到DOM
        btnGroup.appendChild(btn);
        input.closest('.input-group').appendChild(btnGroup);
    }

    // 显示提示信息
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${getColor(type)};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function getColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || '#333';
    }

    // 等待元素加载
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el) {
                    resolve(el);
                } else if (Date.now() - start > timeout) {
                    reject(new Error('元素加载超时'));
                } else {
                    setTimeout(check, 200);
                }
            };
            check();
        });
    }

    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // 启动模块
    initModule();
})();