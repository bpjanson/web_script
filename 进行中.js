// ==UserScript==
// @name         获取 .tur-template 文件地址
// @namespace    http://tampermonkey.net/
// @version      2.1
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
    function processAndDisplay(data, url) {
        console.log('[TUR Finder] 正在处理数据, URL:', url);
        if (!data) {
            console.warn('[TUR Finder] 数据为空');
            return;
        }
        if (!Array.isArray(data)) {
            console.warn('[TUR Finder] 数据不是数组:', data);
            // 尝试从 data.steps 或其他字段获取
            data = data.steps || data.list || data;
            if (!Array.isArray(data)) return;
        }

        const turSteps = data.filter(step =>
            step.type === 13 &&
            step.turDetail &&
            step.turDetail.url &&
            step.turDetail.url.endsWith('.tur-template')
        );

        console.log(`[TUR Finder] 过滤后的步骤数量: ${turSteps.length}`);

        if (turSteps.length === 0) {
            // 如果没找到，但确实有数据，可能结构变了
            if (data.length > 0) {
                console.log('[TUR Finder] 原始数据样例:', data[0]);
            }
            return;
        }

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
            const url = args[0];
            const response = await originalFetch(...args);
            if (typeof url === 'string' && url.includes('/step')) {
                console.log('[TUR Finder] 拦截到 fetch 请求:', url, '状态码:', response.status);
                if (response.status === 401) {
                    console.error('[TUR Finder] 请求返回 401 Unauthorized，请检查登录状态或权限');
                }
                const clonedResponse = response.clone();
                clonedResponse.json().then(json => {
                    if (json) {
                        if (json.success) {
                            processAndDisplay(json.data, url);
                        } else {
                            console.warn('[TUR Finder] 请求返回 success=false:', json);
                            // 即使 success 为 false，也尝试看看 data 是否存在
                            if (json.data) processAndDisplay(json.data, url);
                        }
                    }
                }).catch(err => {
                    console.error('[TUR Finder] 解析 JSON 失败:', err);
                });
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
                    console.log('[TUR Finder] 拦截到 XHR 请求:', this._url, '状态码:', this.status);
                    if (this.status === 401) {
                        console.error('[TUR Finder] 请求返回 401 Unauthorized');
                    }
                    try {
                        const json = JSON.parse(this.responseText);
                        if (json) {
                            if (json.success) {
                                processAndDisplay(json.data, this._url);
                            } else {
                                console.warn('[TUR Finder] 请求返回 success=false:', json);
                                if (json.data) processAndDisplay(json.data, this._url);
                            }
                        }
                    } catch (e) {
                        console.error('[TUR Finder] 解析 XHR JSON 失败:', e);
                    }
                }
            });
            return originalXhrSend.apply(this, args);
        };
    }

    // 启动脚本
    interceptNetworkRequests();

})();
