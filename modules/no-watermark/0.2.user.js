(function() {
    'use strict';

    // 原生样式注入方案
    const antiWatermarkCSS = document.createElement('style');
    antiWatermarkCSS.textContent = `
        img[src*="watermark.png"],
        img[src*="watermark.png"] + div {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            opacity: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
        }
    `;
    document.documentElement.appendChild(antiWatermarkCSS);

    // 元素创建拦截器
    const createElementProxy = new Proxy(document.createElement, {
        apply: function(target, thisArg, argumentsList) {
            const element = Reflect.apply(target, thisArg, argumentsList);
            if (argumentsList[0].toLowerCase() === 'img') {
                return new Proxy(element, {
                    set: function(obj, prop, value) {
                        if (prop === 'src' && value.includes('watermark.png')) {
                            obj.dataset.blocked = 'true';
                            return true; // 阻止设置src
                        }
                        return Reflect.set(...arguments);
                    }
                });
            }
            return element;
        }
    });

    document.createElement = createElementProxy;

    // 量子级DOM清理
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // 清理图片元素
                    if (node.matches('img[src*="watermark.png"]')) {
                        node.remove();
                        return;
                    }
                    // 清理可能存在的包裹容器
                    if (node.querySelector('img[src*="watermark.png"]')) {
                        node.querySelector('img[src*="watermark.png"]').remove();
                    }
                }
            });
        });
    });

    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    // 启动时深度清理
    const purge = () => {
        document.querySelectorAll('img[src*="watermark.png"]').forEach(img => {
            img.parentNode?.removeChild(img);
        });
        document.querySelectorAll('div').forEach(div => {
            if (div.innerHTML.includes('watermark.png')) div.remove();
        });
    };
    purge();
    window.addEventListener('load', purge);

    console.log('[水印清除] 模块已启动');
})();