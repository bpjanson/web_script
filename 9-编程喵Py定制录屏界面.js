// ==UserScript==
// @name         编程喵Py定制录屏界面
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  定制海龟编辑器录屏界面：自定义虚拟键盘、移除多余UI元素
// @author       大生
// @icon         https://codemao.cn/favicon.ico
// @match        https://test-lunar-turtle.codemao.cn/?entry=luanr&sidebar=true
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    function waitFor(condition, callback, interval) {
        const timer = setInterval(function() {
            if (condition()) {
                clearInterval(timer);
                callback();
            }
        }, interval || 300);
    }

    function applyConfigurations() {
        var word = {
            "symbol": ["show()", "(", ")"],
            "syntax": [],
            "func": [],
            "text": [
                "\u201c\u5e73\u9759\u201d", "\u201c\u5f00\u5fc3\u201d", "\u201c\u70ed\u60c5\u821e\u8e48\u201d", "\u201c\u6076\u641e\u201d", "\u201c\u8042\u9177\u201d",
                "\u201c\u60a0\u95f2\u201d", "\u201c\u559c\u6b22\u201d", "\u201c\u5403\u60ca\u201d", "\u201c\u5531\u6b4c\u201d", "\u201c\u6447\u6eda\u201d",
                "\u201c\u51b2\u523a\u201d", "\u201c\u821e\u72ee\u201d", "\u201c\u8857\u821e\u201d", "\u201c\u6f02\u79fb\u201d", "\u201c\u6253\u7bee\u7403\u201d",
                "\u201c\u653e\u5b66\u554a\u201d", "\u201c\u5403\u70e4\u4e32\u201d", "\u201c\u592a\u8fa3\u4e86\u201d", "\u201c\u5bb3\u6015\u201d", "\u201c\u751f\u6c14\u201d", "\u201c\u4f24\u5fc3\u201d"
            ],
            "presetsVisible": true,
            "isNewKeyboard": true,
            "funcParamConfigList": {}
        };

        try {
            _dsbridge_api.setConfigurations({
                sidebarButtons: [
                    { id: 'button_exit',      title: 'button_exit',      icon: 'https://online-education.codemao.cn/444/1728447903545ic_more.png' },
                    { id: 'button_complete',  title: 'button_complete',  icon: 'https://online-education.codemao.cn/444/1728447902270ic_complete.png' },
                    { id: 'button_view_back', title: 'button_view_back', icon: 'https://online-education.codemao.cn/444/1728447903807ic_play.png' }
                ]
            });
            _dsbridge_api.setConfigurations({ sidebarButtonTaskVisible: true, sidebarButtonHelpVisible: true });
            _dsbridge_api.setConfigurations({ virtualKeyboardPresetWord: JSON.stringify(word) });
            console.log('[定制录屏] 配置应用成功');
        } catch(e) {
            console.error('[定制录屏] 配置应用失败:', e);
        }
    }

    function removeElements() {
        var selectors = [
            '.LunarToolbar_wrapper__TAeLv.LunarToolbar_light__3-Ipo.absolute-right-for-wx-capsule',
            '.ControlDrawer_trigger__5olkP.ControlDrawer_small__1xtcA.absolute-top-for-wx-capsule.drawer-small-trigger'
        ];

        function removeAll() {
            selectors.forEach(function(sel) {
                var el = document.querySelector(sel);
                if (el) { el.remove(); console.log('[定制录屏] 已移除:', sel); }
            });
            var vc = document.getElementById('__vconsole');
            if (vc) { vc.remove(); console.log('[定制录屏] 已移除: __vconsole'); }
        }

        removeAll();

        var observer = new MutationObserver(removeAll);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function cleanSymbolButtons() {
        var legalSymbols = ["show()", "(", ")"];
        var blacklist = ['.', '"', ',', ':', '='];

        document.querySelectorAll('button').forEach(function(btn) {
            var text = btn.innerText.trim();
            if (blacklist.indexOf(text) !== -1) {
                btn.remove();
                console.log('[定制录屏] 已移除符号按钮:', text);
            }
        });
    }

    // 等待 _dsbridge_api 可用后执行
    waitFor(
        function() { return typeof _dsbridge_api !== 'undefined'; },
        function() {
            applyConfigurations();
            removeElements();
            setTimeout(cleanSymbolButtons, 2000);
        }
    );

})();
