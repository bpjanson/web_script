// ==UserScript==
// @name         编程喵Py定制录屏界面
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  定制海龟编辑器录屏界面：上传JSON快捷输入、移除多余UI元素
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

    // 将 word 配置应用到编辑器，应用后清理多余 symbol 按钮
    function applyWordConfig(word) {
        try {
            _dsbridge_api.setConfigurations({ virtualKeyboardPresetWord: JSON.stringify(word) });
            console.log('[定制录屏] 快捷输入配置已应用');
            // 等待 React 重新渲染后再清理
            setTimeout(function() { cleanExtraSymbols(word.symbol || []); }, 800);
        } catch(e) {
            console.error('[定制录屏] 快捷输入配置失败:', e);
        }
    }

    // 删除用户未指定的 symbol 按钮
    // symbol 按钮在 CodeKeyboard_presetWordList__1aShs（不含 text class 的那个容器）
    // text 按钮在 CodeKeyboard_presetWordList__1aShs.CodeKeyboard_text__16bCk，不动
    function cleanExtraSymbols(allowedSymbols) {
        var symbolContainer = document.querySelector('.CodeKeyboard_presetWordList__1aShs:not(.CodeKeyboard_text__16bCk)');
        if (!symbolContainer) {
            console.log('[定制录屏] 未找到 symbol 容器，跳过清理');
            return;
        }
        symbolContainer.querySelectorAll('button').forEach(function(btn) {
            var text = btn.innerText.trim();
            if (allowedSymbols.indexOf(text) === -1) {
                btn.remove();
                console.log('[定制录屏] 已移除多余 symbol 按钮:', text);
            }
        });
    }

    function applyConfigurations() {
        try {
            _dsbridge_api.setConfigurations({
                sidebarButtons: [
                    { id: 'button_exit',      title: 'button_exit',      icon: 'https://online-education.codemao.cn/444/1728447903545ic_more.png' },
                    { id: 'button_complete',  title: 'button_complete',  icon: 'https://online-education.codemao.cn/444/1728447902270ic_complete.png' },
                    { id: 'button_view_back', title: 'button_view_back', icon: 'https://online-education.codemao.cn/444/1728447903807ic_play.png' }
                ]
            });
            _dsbridge_api.setConfigurations({ sidebarButtonTaskVisible: true, sidebarButtonHelpVisible: true });
            console.log('[定制录屏] 基础配置应用成功');
        } catch(e) {
            console.error('[定制录屏] 基础配置失败:', e);
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
                if (el) { el.remove(); }
            });
            var vc = document.getElementById('__vconsole');
            if (vc) { vc.remove(); }
        }

        removeAll();
        var observer = new MutationObserver(removeAll);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function cleanSymbolButtons() {
        var blacklist = ['.', '"', ',', ':', '='];
        document.querySelectorAll('button').forEach(function(btn) {
            if (blacklist.indexOf(btn.innerText.trim()) !== -1) {
                btn.remove();
            }
        });
    }

    // 创建上传按钮（右侧垂直居中，默认隐藏，悬浮显示）
    function createUploadButton() {
        var btn = document.createElement('div');
        btn.id = '__tm_upload_btn';
        btn.title = '上传快捷输入配置';
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>';
        btn.style.cssText = [
            'position: fixed',
            'right: 0',
            'top: 12px',
            'width: 32px',
            'height: 48px',
            'background: rgba(26,115,232,0.85)',
            'color: #fff',
            'border-radius: 8px 0 0 8px',
            'display: flex',
            'align-items: center',
            'justify-content: center',
            'cursor: pointer',
            'z-index: 99999',
            'opacity: 0.01',
            'transition: opacity 0.15s',
            'box-shadow: -2px 0 8px rgba(0,0,0,0.15)'
        ].join(';');

        btn.addEventListener('mouseenter', function() { btn.style.opacity = '1'; });
        btn.addEventListener('mouseleave', function() { btn.style.opacity = '0'; });

        // 创建隐藏的 file input
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';

        input.addEventListener('change', function() {
            var file = input.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var word = JSON.parse(e.target.result);
                    applyWordConfig(word);
                    // 短暂高亮反馈
                    btn.style.background = 'rgba(52,168,83,0.9)';
                    setTimeout(function() { btn.style.background = 'rgba(26,115,232,0.85)'; }, 1500);
                } catch(err) {
                    console.error('[定制录屏] JSON 解析失败:', err);
                    btn.style.background = 'rgba(234,67,53,0.9)';
                    setTimeout(function() { btn.style.background = 'rgba(26,115,232,0.85)'; }, 1500);
                }
                input.value = '';
            };
            reader.readAsText(file, 'UTF-8');
        });

        btn.addEventListener('click', function() { input.click(); });

        document.body.appendChild(btn);
        document.body.appendChild(input);
    }

    waitFor(
        function() { return typeof _dsbridge_api !== 'undefined'; },
        function() {
            applyConfigurations();
            removeElements();
            createUploadButton();
            setTimeout(cleanSymbolButtons, 2000);
        }
    );

})();
