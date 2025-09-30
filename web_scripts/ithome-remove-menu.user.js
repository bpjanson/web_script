// ==UserScript==
// @name         IT之家-移除软媒应用菜单
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  移除IT之家网站顶部导航栏中的“软媒应用”菜单。
// @author       Gemini
// @match        https://*.ithome.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 通过ID查找要移除的元素，这是最快最高效的方式
    const elementToRemove = document.getElementById('menu-app');

    // 如果元素存在，就将其从父节点中移除
    if (elementToRemove) {
        elementToRemove.remove();
        console.log('【油猴脚本】: 已成功移除“软媒应用”菜单。');
    }
})();
