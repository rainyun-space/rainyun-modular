(function() {
    'use strict';

    // 字段翻译映射表
    const fieldTranslations = {
        "ID": "用户ID",
        "Name": "用户名",
        "Email": "邮箱",
        "Phone": "手机号",
        "Money": "账户余额",
        "RegisterTime": "注册时间",
        "QQOpenID": "QQ登录接口OpenID",
        "QQ": "QQ号码",
        "WechatOpenID": "微信登录接口OpenID",
        "IconUrl": "头像地址",
        "Points": "积分",
        "Inviter": "邀请人",
        "APIKey": "API密钥",
        "LastIP": "最后登录IP",
        "BanReason": "封禁原因",
        "AlipayAccount": "支付宝账号",
        "AlipayName": "支付宝实名",
        "LastLogin": "最后登录时间",
        "LastLoginArea": "最后登录地区",
        "LoginCount": "登录次数",
        "VipLevel": "会员等级",
        "IsAgent": "代理状态",
        "ConsumeMonthly": "月消费金额",
        "ConsumeAll": "总消费金额(已弃用)",
        "ConsumeQuarter": "季度消费金额",
        "ResellDaily": "日销售金额",
        "ResellMonthly": "月销售金额",
        "ResellBeforeMonth": "上月销售金额",
        "ResellQuarter": "季度销售金额",
        "ResellAll": "总销售金额",
        "StockDaily": "日进货金额",
        "StockMonthly": "月进货金额",
        "StockQuarter": "季度进货金额",
        "StockAll": "总进货金额",
        "SecondStockQuarter": "季度二级进货金额",
        "SecondStockAll": "总二级进货金额",
        "SubUserMonthly": "本月客户数",
        "SubUserAll": "总客户数",
        "ResellPointsMonthly": "月度销售积分收益",
        "ResellPointsAll": "总销售积分收益",
        "CertifyStatus": "实名状态",
        "TOTPSecret": "二次验证密钥",
        "IsLoginEnableTFA": "已启用二次验证",
        "UnsubscribeCount": "退订次数",
        "DLWallet": "DL钱包(用途未知)",
        "DLLevel": "DL等级(用途未知)",
        "AdminGroup": "管理员权限组",
        "IsAllowPointUse": "允许使用积分",
        "ShareCode": "自定义优惠码",
        "Valid": "有效状态(用途未知)",
        "Certify": "认证状态",
        "LockPoints": "冻结积分",
        "CertifyType": "认证类型",
        "CertifyAuditNote": "认证审计报告",
        // VIP字段翻译
        "VIP.Title": "会员等级(VIP属性)",
        "VIP.SaleRequire": "销售达标要求(VIP属性)",
        "VIP.ResellRequire": "分销达标要求(VIP属性)",
        "VIP.CertifyRequired": "实名要求(VIP属性)",
        "VIP.SaleProfit": "消费返利比例(VIP属性)",
        "VIP.ResellProfit": "一级分销提成(VIP属性)",
        "VIP.SecondResellProfit": "二级分销提成(VIP属性)",
        "VIP.SecondStockProfit": "二级进货返利(VIP属性)",
        "VIP.CanSendCoupons": "优惠券发放资格(VIP属性)",
        "VIP.CanCustomCode": "自定义优惠码(VIP属性)",
        "VIP.CanSendMsg": "站内信功能(VIP属性)",
        "VIP.CanTryUsual": "产品试用权限(VIP属性)",
        "VIP.FreeDomainCount": "免费域名数量(VIP属性)",
        "VIP.FreeSSLCount": "免费SSL证书数量(VIP属性)",
        "VIP.CanBeAgent": "代理资格(VIP属性)",
        "VIP.AgentTitle": "代理称号(VIP属性)",
        "VIP.StockRequire": "进货金额要求(VIP属性)",
        "VIP.SecondStockRequire": "二级进货要求(VIP属性)",
        "VIP.StockDiscount": "进货折扣率(VIP属性)",
    };

    // 初始化模块
    function initModule() {
        // 设置监听逻辑
        let lastUrl = location.href;
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                checkAndInject();
            }
        }).observe(document, {subtree: true, childList: true});

        checkAndInject();
    }

    // 检查并注入信息表格
    async function checkAndInject() {
        if (location.href === 'https://app.rainyun.com/account/settings/general') {
            const checkbox = await waitForElement('.custom-control.custom-checkbox', 1000);
            if (checkbox && !document.getElementById('custom-info-table')) {
                injectInfoTable();
            }
        }
    }

    // 注入信息表格（改为API获取）
    async function injectInfoTable() {
        try {
            const response = await fetch('https://api.v2.rainyun.com/user/?no_cache=true', {
                credentials: 'include'
            });
            const result = await response.json();
            if (result.code !== 200 || !result.data) return;

            const userData = result.data;
            const table = createInfoTable(userData);

            // 创建折叠面板容器
            const container = document.createElement('div');
            container.id = 'custom-info-table';
            container.innerHTML = `
                <div class="custom-info-card" style="margin-top: 20px;">
                    <div class="custom-info-header"
                         style="cursor: pointer; padding: 12px 15px; background: #f8f9fa; border-radius: 5px;"
                         onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                        <h5 style="margin: 0; font-size: 16px;">📊 完整账户信息（点击展开）</h5>
                    </div>
                    <div class="custom-info-body" style="display: none; padding: 15px 0;">
                        ${table}
                    </div>
                </div>
            `;

            // 插入位置
            document.querySelector('.custom-control.custom-checkbox').closest('.row')
                .after(container);

            // 添加箭头指示
            addCollapseArrow();

        } catch (e) {
            console.error('用户信息处理失败:', e);
        }
    }

    // 添加折叠箭头
    function addCollapseArrow() {
        const header = document.querySelector('.custom-info-header');
        if (!header) return;

        const arrow = document.createElement('span');
        arrow.innerHTML = '▼';
        arrow.style = `
            float: right;
            transition: transform 0.3s;
            font-size: 14px;
        `;

        header.prepend(arrow);

        header.addEventListener('click', function() {
            const isOpen = this.nextElementSibling.style.display === 'none';
            arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        });
    }

    // 创建信息表格
    function createInfoTable(data) {
        return `
            <table class="table table-bordered table-striped mb-0">
                <tbody>
                    ${generateTableRows(data).join('')}
                </tbody>
            </table>
        `;
    }

    // 生成表格行
    function generateTableRows(data, prefix = '') {
        const rows = [];
        for (const [key, value] of Object.entries(data)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'object' && value !== null) {
                rows.push(...generateTableRows(value, fullKey));
                continue;
            }

            rows.push(`
                <tr>
                    <th style="width:35%;">${getFieldName(fullKey)}</th>
                    <td>${formatValue(fullKey, value)}</td>
                </tr>
            `);
        }
        return rows;
    }

    // 获取字段名称
    function getFieldName(key) {
        if (fieldTranslations[key]) return fieldTranslations[key];
        return key.replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .replace(/Qq/gi, 'QQ')
                  .replace(/Id/gi, 'ID')
                  .replace(/Api/gi, 'API');
    }

    // 格式化值
    function formatValue(key, value) {
        switch(key) {
            case 'RegisterTime':
            case 'LastLogin':
                return formatTimestamp(value);
            case 'Money':
            case 'ConsumeMonthly':
                return `¥${Number(value).toFixed(2)}`;
            case 'IsAgent':
            case 'IsLoginEnableTFA':
                return value ? '✅ 已开启' : '❌ 未开启';
            case 'CertifyStatus':
                return value === 'passed' ? '✅ 已认证' : '❌ 未认证';
            case 'TOTPSecret':
                return value === '***' ? '🔒 已设置' : '⚠️ 未设置';
        }

        if (typeof value === 'boolean') return value ? '是' : '否';
        if (value === null || value === undefined) return '空';
        return value;
    }

    // 格式化时间戳
    function formatTimestamp(timestamp) {
        if (!timestamp) return '未知时间';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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

    // 启动模块
    initModule();

    console.log('[个人信息展示] 模块已启动');

})();