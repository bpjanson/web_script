// ==UserScript==
// @name        切换虚拟/系统键盘
// @namespace   Violentmonkey Scripts
// @match       https://lunar-turtle.codemao.cn/*
// @match       https://test-lunar-turtle.codemao.cn/?entry=luanr&sidebar=true
// @run-at      document-end
// @grant       GM_addStyle
// @version     5.0
// @author      Gemini & User
// @description 在右下角添加一个悬浮菜单，用于在编程键盘和系统键盘之间切换。
// @icon        https://lunar-turtle.codemao.cn/logo256.png
// ==/UserScript==

(function() {
    'use strict';

    // 1. 添加样式
    GM_addStyle(`
        #keyboard-switcher-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        /* 触发按钮：改为半透明小圆点，点击或悬浮均可触发 */
        #keyboard-switcher-trigger {
            width: 40px;
            height: 40px;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            color: white;
            font-size: 20px;
            user-select: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        #keyboard-switcher-trigger:hover {
            background-color: rgba(0, 0, 0, 0.6);
            transform: scale(1.1);
        }

        #keyboard-switcher-menu {
            display: none; /* 默认隐藏菜单 */
            margin-bottom: 10px;
            flex-direction: column;
            gap: 8px;
            background-color: white;
            border-radius: 12px;
            padding: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            border: 1px solid #eee;
            min-width: 100px;
        }

        /* 兼容桌面端的悬浮显示 */
        #keyboard-switcher-container:hover #keyboard-switcher-menu {
            display: flex;
        }

        /* 强制显示类（用于点击触发） */
        #keyboard-switcher-menu.is-visible {
            display: flex;
        }

        .keyboard-switch-button {
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            background-color: #f5f5f5;
            cursor: pointer;
            text-align: center;
            white-space: nowrap;
            font-size: 14px;
            color: #333;
            font-weight: 500;
            transition: background-color 0.2s;
        }

        .keyboard-switch-button:hover {
            background-color: #e0e0e0;
        }

        .keyboard-switch-button.active {
            background-color: #007aff;
            color: white;
        }
    `);

    // 2. 创建 HTML 元素
    const container = document.createElement('div');
    container.id = 'keyboard-switcher-container';

    const trigger = document.createElement('div');
    trigger.id = 'keyboard-switcher-trigger';
    trigger.innerHTML = '⌨️'; // 使用图标代替完全隐形

    const menu = document.createElement('div');
    menu.id = 'keyboard-switcher-menu';

    const currentType = localStorage.getItem('keyboardType') || 'VIRTUAL';

    const btnVirtual = document.createElement('button');
    btnVirtual.className = `keyboard-switch-button ${currentType === 'VIRTUAL' ? 'active' : ''}`;
    btnVirtual.textContent = '编程键盘';

    const btnSystem = document.createElement('button');
    btnSystem.className = `keyboard-switch-button ${currentType === 'SYSTEM' ? 'active' : ''}`;
    btnSystem.textContent = '系统键盘';

    // 3. 组装元素
    menu.appendChild(btnVirtual);
    menu.appendChild(btnSystem);
    container.appendChild(menu);
    container.appendChild(trigger);
    document.body.appendChild(container);

    // 4. 绑定事件
    // 点击触发按钮切换菜单显隐（解决开发者模式/移动端无法悬浮的问题）
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('is-visible');
    });

    // 点击页面其他地方隐藏菜单
    document.addEventListener('click', () => {
        menu.classList.remove('is-visible');
    });

    function setKeyboardType(type) {
        localStorage.setItem('keyboardType', type);
        location.reload();
    }

    btnVirtual.addEventListener('click', (e) => {
        e.stopPropagation();
        setKeyboardType('VIRTUAL');
    });

    btnSystem.addEventListener('click', (e) => {
        e.stopPropagation();
        setKeyboardType('SYSTEM');
    });

})();
