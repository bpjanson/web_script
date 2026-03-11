// ==UserScript==
// @name         海龟编辑器自定义输入界面
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  自动配置侧边栏按钮、任务栏可见性及虚拟键盘快捷输入
// @author       大生
// @match        https://test-lunar-turtle.codemao.cn/?entry=luanr&sidebar=true
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 等待 _dsbridge_api 对象可用
    const initInterval = setInterval(() => {
        if (typeof _dsbridge_api !== 'undefined') {
            clearInterval(initInterval);
            applyConfigurations();
            removeElements(); // 调用移除元素的逻辑
        }
    }, 500);

    function removeElements() {
        console.log('开始移除指定页面元素...');

        // 1. 移除 Toolbar 包装器
        const toolbar = document.querySelector('.LunarToolbar_wrapper__TAeLv.LunarToolbar_light__3-Ipo.absolute-right-for-wx-capsule');
        if (toolbar) {
            toolbar.remove();
            console.log('✅ 已移除 Toolbar 包装器');
        }

        // 2. 移除 ControlDrawer 触发器
        const drawerTrigger = document.querySelector('.ControlDrawer_trigger__5olkP.ControlDrawer_small__1xtcA.absolute-top-for-wx-capsule.drawer-small-trigger');
        if (drawerTrigger) {
            drawerTrigger.remove();
            console.log('✅ 已移除 ControlDrawer 触发器');
        }

        // 3. 移除 vConsole
        const vConsole = document.getElementById('__vconsole');
        if (vConsole) {
            vConsole.remove();
            console.log('✅ 已移除 vConsole');
        }
        
        // 考虑到这些元素可能是动态加载的，使用 MutationObserver 持续监测
        const observer = new MutationObserver(() => {
            const t = document.querySelector('.LunarToolbar_wrapper__TAeLv.LunarToolbar_light__3-Ipo.absolute-right-for-wx-capsule');
            if (t) t.remove();
            
            const d = document.querySelector('.ControlDrawer_trigger__5olkP.ControlDrawer_small__1xtcA.absolute-top-for-wx-capsule.drawer-small-trigger');
            if (d) d.remove();
            
            const v = document.getElementById('__vconsole');
            if (v) v.remove();
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function applyConfigurations() {
        console.log('开始应用海龟编辑器自定义配置...');

        try {
            // 1. 配置侧边栏按钮
            _dsbridge_api.setConfigurations({
                sidebarButtons: [
                    {
                        id: 'button_exit',
                        title: 'button_exit',
                        icon: 'https://online-education.codemao.cn/444/1748259097856ic_python_more.png'
                    },
                    {
                        id: 'button_complete',
                        title: 'button_complete',
                        icon: 'https://online-education.codemao.cn/444/1748259098983ic_python_submit.png'
                    },
                    {
                        id: 'button_view_back',
                        title: 'button_view_back',
                        icon: 'https://online-education.codemao.cn/444/1748259098684ic_python_play.png'
                    }
                ]
            });

            // 2. 显示任务栏按钮
            _dsbridge_api.setConfigurations({
                sidebarButtonTaskVisible: true,
                sidebarButtonHelpVisible: true
            });

            // 3. 配置快捷输入（虚拟键盘）
            const word = {
                "symbol": ["show()", "(", ")", "\""],
                "syntax": [],
                "func": [],
                "text": [
                    "\"平静\"", "\"开心\"", "\"热情跳舞\"", "\"恶搞\"", "\"耍酷\"",
                    "\"悠闲\"", "\"喜欢\"", "\"吃惊\"", "\"唱歌\"", "\"摇滚\"",
                    "\"冲刺\"", "\"舞狮\"", "\"街舞\"", "\"漂移\"", "\"打篮球\"",
                    "\"放学啦\"", "\"吃烤串\"", "\"太辣了\"", "\"害怕\"", "\"生气\"", "\"伤心\""
                ],
                "presetsVisible": true,
                "isNewKeyboard": true,
                "funcParamConfigList": {}
            };
            
            _dsbridge_api.setConfigurations({
                virtualKeyboardPresetWord: JSON.stringify(word)
            });

            console.log('✅ 海龟编辑器自定义配置应用成功');
        } catch (e) {
            console.error('❌ 应用配置时出错:', e);
        }
    }

    function createNewFile(fileName = 'new_file.py') {
        // --- 步骤 1: 找到并点击 "新建文件" 按钮 ---
        const allActionButtons = document.querySelectorAll('div.ant-space-item');
        if (allActionButtons.length < 2) {
            console.error('未能找到操作按钮容器。');
            return;
        }
        const newFileButtonContainer = allActionButtons[1];
        const newFileButton = newFileButtonContainer.querySelector('span');

        if (newFileButton) {
            newFileButton.click();
            console.log('已点击 "新建文件" 按钮。');

            // --- 步骤 2: 等待对话框出现并执行后续操作 ---
            setTimeout(() => {
                // --- 步骤 3 & 4: 找到输入框，清空并填入新文件名 ---
                const fileNameInput = document.querySelector('.AsyncPrompt_text__36bTj');
                if (!fileNameInput) {
                    console.error('未能找到文件名输入框。');
                    return;
                }
                fileNameInput.value = fileName; // 清空并设置新值
                console.log(`已将文件名设置为: ${fileName}`);


                // --- 步骤 5 & 6: 找到并点击 "确认" 按钮 ---
                const confirmButton = document.querySelector('.AsyncPrompt_confirm__3Qe2j');
                if (confirmButton) {
                    confirmButton.click();
                    console.log('已点击 "确认" 按钮，文件创建成功！');
                } else {
                    console.error('未能找到 "确认" 按钮。');
                }
            }, 500); // 500毫秒的延迟

        } else {
            console.error('未能找到 "新建文件" 按钮的内部span。');
        }
    }

    // 将函数暴露到全局，方便在控制台调试
    window.createNewFile = createNewFile;
})();
