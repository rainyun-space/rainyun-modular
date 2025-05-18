(function() {
    'use strict';

    // 渐进式样式隐藏 (避免布局抖动)
    const safeHide = (img) => {
        img.style.setProperty('opacity', '0', 'important');
        img.style.setProperty('pointer-events', 'none', 'important');
        img.style.setProperty('width', '1px', 'important');
        img.style.setProperty('height', '1px', 'important');
        requestAnimationFrame(() => img.remove());
    };

    // 精准定位器
    const isTarget = (node) => {
        return node.nodeType === Node.ELEMENT_NODE &&
               node.tagName === 'IMG' &&
               (node.src.includes('watermark.png') ||
                node.src.endsWith('/watermark.png'));
    };

    // 低优先级DOM观察器
    const lazyObserver = new MutationObserver(mutations => {
        requestIdleCallback(() => {
            mutations.forEach(mutation => {
                for (const node of mutation.addedNodes) {
                    if (isTarget(node)) {
                        safeHide(node);
                    }
                    // 深度扫描子节点
                    if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(img => {
                            if (isTarget(img)) safeHide(img);
                        });
                    }
                }
            });
        }, { timeout: 500 });
    });

    // 最小化监控范围
    lazyObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    // 启动延迟清理
    requestIdleCallback(() => {
        document.querySelectorAll('img').forEach(img => {
            if (isTarget(img)) safeHide(img);
        });
    }, { timeout: 1000 });

    console.log('[水印清除] 模块已启动');
})();