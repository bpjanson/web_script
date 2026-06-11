// ==UserScript==
// @name         获取 .tur-template 文件地址
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  从 /step 接口中自动提取 type=13 的步骤的 .tur-template 文件地址，并显示在页面上。
// @author       Gemini
// @match        https://tyca.codemao.cn/tanyue-course-warehouse/course/info?courseId=*
// @grant        none
// @icon         https://codemao.cn/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    // 1. 创建UI元素（包括主面板和最小化按钮）
    function createUI() {
        // --- 主面板 ---
        const panel = document.createElement('div');
        panel.id = 'tur-template-finder-panel';
        panel.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 450px;
            max-height: 60vh;
            background-color: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: none; /* 默认隐藏 */
            flex-direction: column;
            transition: opacity 0.2s ease, transform 0.2s ease;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 12px 15px;
            font-weight: 600;
            font-size: 16px;
            color: #333;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const title = document.createElement('span');
        title.id = 'tur-finder-title';
        title.textContent = '文件列表';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            border: none;
            background: transparent;
            font-size: 24px;
            cursor: pointer;
            color: #888;
            padding: 0 5px;
        `;

        header.appendChild(title);
        header.appendChild(closeBtn);

        const content = document.createElement('div');
        content.id = 'tur-template-finder-content';
        content.style.cssText = `padding: 15px; overflow-y: auto; font-size: 14px;`;

        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);

        // --- 最小化按钮 ---
        const minimizedBtn = document.createElement('button');
        minimizedBtn.id = 'tur-finder-minimized-btn';
        minimizedBtn.textContent = '文件';
        minimizedBtn.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 99998;
            display: none; /* 默认隐藏 */
            font-size: 14px;
            font-weight: bold;
            transition: transform 0.2s ease;
        `;
        minimizedBtn.onmouseenter = () => { minimizedBtn.style.transform = 'scale(1.1)'; };
        minimizedBtn.onmouseleave = () => { minimizedBtn.style.transform = 'scale(1)'; };
        document.body.appendChild(minimizedBtn);

        // --- 交互逻辑 ---
        closeBtn.onclick = () => {
            panel.style.display = 'none';
            minimizedBtn.style.display = 'block';
        };

        minimizedBtn.onclick = () => {
            minimizedBtn.style.display = 'none';
            panel.style.display = 'flex';
        };

        return { panel, title, content };
    }

    const { panel, title: titleElement, content: contentElement } = createUI();

    // 2. 处理并显示数据
    function processAndDisplay(data) {
        if (!data || !Array.isArray(data)) return;

        const turSteps = data.filter(step =>
            step.type === 13 &&
            step.turDetail &&
            step.turDetail.url &&
            step.turDetail.url.endsWith('.tur-template')
        );

        if (turSteps.length === 0) return;

        contentElement.innerHTML = '';
        titleElement.textContent = `发现 ${turSteps.length} 个 .tur-template 文件`;

        const ol = document.createElement('ol');
        ol.style.cssText = 'padding-left: 20px; margin: 0;';

        turSteps.forEach(step => {
            const li = document.createElement('li');
            li.style.cssText = 'margin-bottom: 15px; line-height: 1.6;';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = step.name || '未命名';
            nameSpan.style.fontWeight = '500';
            const urlLink = document.createElement('a');
            urlLink.href = step.turDetail.url;
            urlLink.textContent = step.turDetail.url;
            urlLink.target = '_blank';
            urlLink.rel = 'noopener noreferrer';
            urlLink.style.cssText = `display: block; font-size: 12px; color: #007bff; text-decoration: none; word-break: break-all; margin-top: 4px;`;
            li.appendChild(nameSpan);
            li.appendChild(urlLink);
            ol.appendChild(li);
        });

        contentElement.appendChild(ol);
        // 只有在当前没有显示时才改变display，避免重复显示
        if (panel.style.display === 'none') {
             panel.style.display = 'flex';
        }
    }

    // 3. 拦截数据请求 (支持 fetch 和 XMLHttpRequest)
    function interceptNetworkRequests() {
        // 拦截 fetch
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const response = await originalFetch(...args);
            const url = args[0];
            if (typeof url === 'string' && url.includes('/step')) {
                const clonedResponse = response.clone();
                clonedResponse.json().then(json => {
                    if (json && json.success) processAndDisplay(json.data);
                }).catch(() => {});
            }
            return response;
        };

        // 拦截 XMLHttpRequest
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            this._url = args[1];
            return originalXhrOpen.apply(this, args);
        };
        const originalXhrSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('load', function() {
                if (this._url && typeof this._url === 'string' && this._url.includes('/step')) {
                    try {
                        const json = JSON.parse(this.responseText);
                        if (json && json.success) processAndDisplay(json.data);
                    } catch (e) {}
                }
            });
            return originalXhrSend.apply(this, args);
        };
    }

    // 启动脚本
    interceptNetworkRequests();

})();
