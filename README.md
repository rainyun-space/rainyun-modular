# 雨云控制台模块管理器

一个模块化的雨云控制台增强工具，提供便捷的功能模块管理和扩展能力

## 用户指南

### 功能特性
- **模块化架构** 自由安装/卸载功能模块
- **一键操作** 快速启用/禁用已安装模块
- **自动更新** 支持模块自动检测更新
- **配置管理** 可视化模块配置界面
- **智能通知** 操作反馈与更新提醒
- **悬浮入口** 便捷的侧边悬浮按钮

### 安装步骤
1. **安装管理器脚本**
   - 需要 Tampermonkey 扩展
   - [点击安装管理器脚本](https://github.com/rainyun-space/rainyun-modular/raw/main/rainyun-modular.user.js)

2. **安装功能模块**
   - 登录雨云控制台后点击左侧悬浮按钮
   - 在模块商店选择需要安装的模块
   - 支持模块: 
     - 截图隐私保护
     - MCSM新标签页打开 
     - 界面美化
     - [更多模块开发中...]

### 使用说明
- **悬浮按钮**：左侧屏幕边缘的圆形按钮
- **模块管理**：
  - 安装/卸载模块
  - 启用/禁用模块
  - 模块配置修改
- **快捷菜单**：
  - Tampermonkey菜单中包含快速开关
  - 支持快捷键操作（需浏览器支持）

## 开发者指南

### 模块开发规范

#### 目录结构
```
modules/
  [module-id]/
    module-icon.png    // 可选图标
    [module-id].user.js
```

#### 模块清单(module-list.json)
```json
{
  "id": "unique-module-id",
  "name": "模块显示名称",
  "description": "模块描述",
  "version": "语义化版本号",
  "path": "模块目录路径",
  "script": "主脚本文件名",
  "configSchema": [ // 可选配置
    {
      "key": "config_key",
      "type": "text|select",
      "label": "配置项名称",
      "options": ["选项1", "选项2"], // select类型必填
      "default": "默认值"
    }
  ]
}
```

#### 脚本开发要求
1. **基本规范**
```javascript
(function() {
    'use strict';
    // 主逻辑需包含在initModule函数中
    function initModule() {
        const config = window.RainyunModularConfig?.[moduleId] || {};
        if (!config.enabled) return;
        
        // 模块主逻辑...
    }
    
    // jQuery动态加载示例
    if (typeof window.jQuery === 'undefined') {
        const script = document.createElement('script');
        script.src = '//cdn.example.com/jquery.min.js';
        script.onload = initModule;
        document.head.appendChild(script);
    } else {
        initModule();
    }
})();
```

2. **开发准则**
- 使用严格模式(`'use strict'`)
- 避免全局变量污染
- DOM操作需考虑动态加载内容
- 外部依赖需动态加载
- 配置访问使用`window.RainyunModularConfig`
- 确保禁用时能完全清理

### 模块发布流程
1. 开发完成后提交Pull Request
2. 更新module-list.json添加模块信息
3. 通过测试后合并到main分支
4. 自动进入模块商店

## 项目维护
- 作者：ndxzzy
- 反馈渠道：GitHub Issues
- 开源协议：MIT License

欢迎贡献新模块！🎉