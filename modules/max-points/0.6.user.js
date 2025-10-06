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
        btn.addEventListener('click', async () => {
            try {
                // 通过 API 获取用户数据
                const resp = await fetch('https://api.v2.rainyun.com/user/?no_cache=true', {
                    credentials: 'include'
                });
                if (!resp.ok) throw new Error('接口请求失败');
                const result = await resp.json();
                if (result.code !== 200 || !result.data) throw new Error('接口返回异常');

                const userData = result.data;
                // 计算可用积分（总积分 - 锁定积分）
                const availablePoints = userData.Points - (userData.LockPoints || 0);

                // 判断提现方式
                let feeRate = 0;
                const alipayRadio = document.querySelector('input[type="radio"][value="alipay"]');
                if (alipayRadio && alipayRadio.checked) {
                    feeRate = 0.01; // 支付宝提现有1%手续费
                }

                // 计算最大可提现积分
                let maxWithdraw;
                if (feeRate > 0) {
                    // 公式：提现金额 + 提现金额×手续费 ≤ 可用积分 → 提现金额 ≤ 可用积分 ÷ (1 + feeRate)
                    maxWithdraw = Math.floor(availablePoints / (1 + feeRate));
                } else {
                    maxWithdraw = availablePoints;
                }

                // 检查是否达到最低提现额度（最低60000是指用户输入的提现额）
                if (maxWithdraw < 60000) {
                    showToast('最低提现额度为60000积分（未含手续费）', 'warning');
                    return;
                }

                input.value = maxWithdraw;
                // 触发Vue数据更新
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);

                if (feeRate > 0) {
                    showToast(`已填充最大可提现积分：${maxWithdraw}（含手续费后将扣除${Math.ceil(maxWithdraw * (1 + feeRate))}）`, 'success');
                } else {
                    showToast(`已填充最大可提现积分：${maxWithdraw}（余额提现无手续费）`, 'success');
                }
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
        toast.className = 'custom-toast';
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
        `;
        toast.textContent = message;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
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
        @keyframes custom-slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes custom-fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        .custom-toast {
            animation: custom-slideIn 0.3s ease-out;
        }
        .custom-toast.fade-out {
            animation: custom-fadeOut 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);

    // 启动模块
    initModule();
})();