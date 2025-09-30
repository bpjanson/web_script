// ==UserScript==
// @name         IT之家 界面净化
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  移除IT之家网站的“软媒应用”菜单和右侧悬浮功能栏，提供更纯净的阅读体验。
// @author       Gemini
// @match        https://*.ithome.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/bpjanson/Vibe_Coding/main/web_scripts/ithome-remove-menu.user.js
// @downloadURL  https://raw.githubusercontent.com/bpjanson/Vibe_Coding/main/web_scripts/ithome-remove-menu.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 定义一个包含所有要移除的元素ID的列表
    const idsToRemove = ['menu-app', 'side_func'];

    // 遍历列表，查找并移除每个元素
    idsToRemove.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
            console.log(`【IT之家 界面净化】: 已成功移除元素 #${id}。`);
        }
    });

})();
