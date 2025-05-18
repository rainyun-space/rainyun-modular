(function() {
    'use strict';

    // 注入全局样式清除残留痕迹
    GM_addStyle(`
        img[src*="watermark.png"] {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            opacity: 0 !important;
        }
    `);

    // 增强版元素创建拦截
    const createElementHandler = {
        get: function(target, prop) {
            if (prop === 'createElement') {
                return new Proxy(target[prop], {
                    apply: function(target, thisArg, argumentsList) {
                        const element = Reflect.apply(target, thisArg, argumentsList);
                        if (argumentsList[0].toLowerCase() === 'img') {
                            return new Proxy(element, {
                                set: function(obj, prop, value) {
                                    if (prop === 'src' &&
                                        typeof value === 'string' &&
                                        value.includes('watermark.png')) {
                                        //console.log('[拦截] 水印图片创建已被阻止');
                                        // 彻底清除元素属性
                                        setTimeout(() => {
                                            if (obj.parentNode) {
                                                obj.parentNode.removeChild(obj);
                                            }
                                        }, 0);
                                        return true;
                                    }
                                    return Reflect.set(...arguments);
                                }
                            });
                        }
                        return element;
                    }
                });
            }
            return Reflect.get(...arguments);
        }
    };

    document = new Proxy(document, createElementHandler);

    // 增强版DOM观察器
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.matches('img[src*="watermark.png"]')) {
                    node.style.cssText = 'display:none!important;';
                    setTimeout(() => node.remove(), 0);
                    //console.log('[清理] 已移除残留元素:', node);
                }
            });
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });

    // 初始清理
    const nuclearOption = setInterval(() => {
        document.querySelectorAll('img[src*="watermark.png"]').forEach(img => {
            img.remove();
            //console.log('[初始化清理] 已移除:', img);
        });
        clearInterval(nuclearOption);
    }, 1000);

    console.log('[水印清除] 模块已启动');
})();