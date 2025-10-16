// ==UserScript==
// @name         【未完成】自动填充AI tutor配置
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  【猫厂专用】自动配置编程猫教研工作台中海龟编辑器环节的AI tutor功能（经过实际测试优化）
// @author       大生
// @match        https://tyca.codemao.cn/tanyue-course-warehouse/course/info*
// @grant        none
// @icon         https://tyca.codemao.cn/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    // AI功能配置 - 可以根据需要修改这些默认值
    const DEFAULT_AI_CONFIG = {
        enableAITutor: true, // 是否开启AI tutor
        aiFeatures: {
            'AI对话': true,
            '动漫化头像': false,
            '拍图识字': true,
            '文本转语音': true,
            '物体识别': false,
            '语音合成': false,
            '语音识别': true,
            'AI文生图': false
        }
    };

    // 查找所有海龟编辑器环节的AI tutor配置
    function findAITutorConfigs() {
        const configs = [];
        
        // 查找所有步骤按钮
        const stepButtons = document.querySelectorAll('button[roledescription="sortable"]');
        
        stepButtons.forEach((button, index) => {
            const text = button.textContent;
            if (text.includes('海龟编辑器')) {
                // 在按钮内部查找AI tutor相关元素
                const closeRadio = button.querySelector('input[type="radio"][value="0"]');
                const openRadio = button.querySelector('input[type="radio"][value="1"]');
                
                if (closeRadio && openRadio) {
                    const config = {
                        index: index,
                        stepName: text.match(/\d+\.海龟编辑器/)?.[0] || '海龟编辑器',
                        button: button,
                        switches: {
                            close: closeRadio,
                            open: openRadio
                        },
                        features: {}
                    };
                    
                    // 查找AI功能复选框
                    const aiFeatures = ['AI对话', '动漫化头像', '拍图识字', '文本转语音', '物体识别', '语音合成', '语音识别', 'AI文生图'];
                    aiFeatures.forEach(feature => {
                        const checkboxes = button.querySelectorAll('input[type="checkbox"]');
                        for (const checkbox of checkboxes) {
                            const parent = checkbox.parentElement;
                            if (parent && parent.textContent.trim() === feature) {
                                config.features[feature] = checkbox;
                                break;
                            }
                        }
                    });
                    
                    configs.push(config);
                }
            }
        });
        
        return configs;
    }

    // 配置单个海龟编辑器环节的AI tutor
    function configureAITutor(config, settings = DEFAULT_AI_CONFIG) {
        console.log(`配置 ${config.stepName} 的AI tutor...`);
        let hasChanges = false;
        
        // 1. 开启/关闭AI tutor
        if (settings.enableAITutor && !config.switches.open.checked) {
            config.switches.open.click();
            console.log(`✅ 已开启 ${config.stepName} 的AI tutor`);
            hasChanges = true;
            
            // 等待一下让AI功能选项显示出来
            setTimeout(() => {
                // 2. 配置AI功能
                Object.entries(settings.aiFeatures).forEach(([feature, enabled]) => {
                    const checkbox = config.features[feature];
                    if (checkbox && checkbox.checked !== enabled) {
                        checkbox.click();
                        console.log(`${enabled ? '✅' : '❌'} ${config.stepName} - ${feature}: ${enabled ? '已开启' : '已关闭'}`);
                    }
                });
            }, 200);
            
        } else if (!settings.enableAITutor && !config.switches.close.checked) {
            config.switches.close.click();
            console.log(`❌ 已关闭 ${config.stepName} 的AI tutor`);
            hasChanges = true;
        } else if (settings.enableAITutor && config.switches.open.checked) {
            // AI tutor已经开启，直接配置功能
            Object.entries(settings.aiFeatures).forEach(([feature, enabled]) => {
                const checkbox = config.features[feature];
                if (checkbox && checkbox.checked !== enabled) {
                    checkbox.click();
                    console.log(`${enabled ? '✅' : '❌'} ${config.stepName} - ${feature}: ${enabled ? '已开启' : '已关闭'}`);
                    hasChanges = true;
                }
            });
        }
        
        return hasChanges;
    }

    // 智能配置并自动提交
    async function submitConfigurationViaAPI(settings = DEFAULT_AI_CONFIG) {
        const progressDiv = document.getElementById('progress-display');
        
        try {
            if (progressDiv) {
                progressDiv.style.display = 'block';
                progressDiv.innerHTML = `<div style="color: #1890ff;">🚀 正在配置AI tutor...</div>`;
            }
            
            // 1. 查找海龟编辑器环节
            const configs = findAITutorConfigs();
            if (configs.length === 0) {
                throw new Error('未找到海龟编辑器环节，请确认已进入课程环节配置页面');
            }
            
            console.log(`🔍 找到 ${configs.length} 个海龟编辑器环节`);
            
            // 2. 应用配置到UI
            let totalChanges = 0;
            for (let i = 0; i < configs.length; i++) {
                const config = configs[i];
                if (progressDiv) {
                    progressDiv.innerHTML = `<div style="color: #1890ff;">📝 正在配置 ${config.stepName} (${i + 1}/${configs.length})...</div>`;
                }
                
                const hasChanges = configureAITutor(config, settings);
                if (hasChanges) totalChanges++;
                
                // 等待配置完成
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (totalChanges === 0) {
                if (progressDiv) {
                    progressDiv.innerHTML = `<div style="color: #52c41a;">✅ 所有环节已经是目标配置</div>`;
                }
                
                setTimeout(() => {
                    showSuccessMessage(0, '所有环节已经是目标配置，无需修改');
                }, 500);
                
                return true;
            }
            
            if (progressDiv) {
                progressDiv.innerHTML = `<div style="color: #1890ff;">💾 配置完成，正在自动提交...</div>`;
            }
            
            // 3. 等待UI更新完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 4. 查找并点击提交按钮
            const submitButton = document.querySelector('button:contains("提 交")') || 
                               Array.from(document.querySelectorAll('button')).find(btn => 
                                   btn.textContent.includes('提交') || btn.textContent.includes('提 交')
                               );
            
            if (!submitButton) {
                throw new Error('未找到提交按钮，请手动点击提交');
            }
            
            // 5. 点击提交按钮
            submitButton.click();
            console.log('🚀 已点击提交按钮');
            
            if (progressDiv) {
                progressDiv.innerHTML = `<div style="color: #52c41a;">✅ 配置已成功应用并提交！</div>`;
            }
            
            // 显示成功消息
            setTimeout(() => {
                showSuccessMessage(totalChanges);
            }, 1000);
            
            console.log(`🎉 AI tutor配置已成功提交！共修改了 ${totalChanges} 个环节`);
            return true;
            
        } catch (error) {
            console.error('❌ 配置过程中出现问题:', error);
            
            if (progressDiv) {
                progressDiv.innerHTML = `<div style="color: #ff7875;">⚠️ ${error.message}</div>`;
            }
            
            // 显示友好的提示对话框
            showSubmitReminder(error.message);
            return false;
        }
    }

    // 显示成功消息
    function showSuccessMessage(totalChanges, customMessage = null) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f6ffed;
            border: 2px solid #52c41a;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            z-index: 20000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            min-width: 300px;
        `;
        
        const message = customMessage || 
            `AI tutor配置已成功应用并提交<br>共修改了 <strong style="color: #52c41a;">${totalChanges}</strong> 个编程环节`;
        
        successDiv.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 15px;">🎉</div>
            <h3 style="margin: 0 0 15px 0; color: #52c41a; font-size: 18px;">配置完成！</h3>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                ${message}
            </p>
            <button onclick="this.parentElement.remove()" style="
                background: #52c41a; 
                color: white; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 6px; 
                cursor: pointer;
                font-weight: bold;
            ">确定</button>
        `;
        
        document.body.appendChild(successDiv);
        
        // 5秒后自动关闭
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                successDiv.remove();
            }
        }, 5000);
    }

    // 显示提交提醒
    function showSubmitReminder(errorMessage = null) {
        const submitButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('提交') || btn.textContent.includes('提 交')
        );
        
        const reminder = document.createElement('div');
        reminder.id = 'submit-reminder';
        reminder.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 3px solid #1890ff;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            z-index: 20000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            min-width: 350px;
        `;
        
        reminder.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 15px;">${errorMessage ? '⚠️' : '✅'}</div>
            <h3 style="margin: 0 0 15px 0; color: ${errorMessage ? '#ff4d4f' : '#1890ff'}; font-size: 18px;">
                ${errorMessage ? '需要手动提交' : '配置完成！'}
            </h3>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                ${errorMessage ? 
                    `${errorMessage}<br><strong style="color: #1890ff;">请手动点击页面右下角的"提交"按钮完成保存</strong>` :
                    'AI tutor配置已应用到所有编程环节<br><strong style="color: #1890ff;">请点击页面右下角的"提交"按钮保存更改</strong>'
                }
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="highlight-submit" style="
                    background: #1890ff; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 6px; 
                    cursor: pointer;
                    font-weight: bold;
                ">高亮提交按钮</button>
                <button id="close-reminder" style="
                    background: #d9d9d9; 
                    color: #666; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 6px; 
                    cursor: pointer;
                ">我知道了</button>
            </div>
        `;
        
        document.body.appendChild(reminder);
        
        // 绑定事件
        document.getElementById('close-reminder').onclick = () => {
            reminder.remove();
        };
        
        document.getElementById('highlight-submit').onclick = () => {
            if (submitButton) {
                // 高亮提交按钮
                submitButton.style.cssText += `
                    animation: highlight 3s infinite !important;
                    position: relative !important;
                `;
                
                // 添加高亮动画
                const highlightStyle = document.createElement('style');
                highlightStyle.textContent = `
                    @keyframes highlight {
                        0% { 
                            background-color: #1890ff !important; 
                            box-shadow: 0 0 0 0 rgba(24,144,255,0.7) !important;
                        }
                        50% { 
                            background-color: #40a9ff !important; 
                            box-shadow: 0 0 0 10px rgba(24,144,255,0) !important;
                        }
                        100% { 
                            background-color: #1890ff !important; 
                            box-shadow: 0 0 0 0 rgba(24,144,255,0) !important;
                        }
                    }
                `;
                document.head.appendChild(highlightStyle);
                
                // 滚动到提交按钮
                submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // 3秒后移除高亮
                setTimeout(() => {
                    highlightStyle.remove();
                    submitButton.style.animation = '';
                }, 3000);
            }
            
            reminder.remove();
        };
        
        // 10秒后自动关闭
        setTimeout(() => {
            if (document.getElementById('submit-reminder')) {
                reminder.remove();
            }
        }, 10000);
    }

    // 获取当前AI tutor配置状态
    function getCurrentAITutorStatus() {
        const configs = findAITutorConfigs();
        const status = {
            totalSections: configs.length,
            sections: []
        };
        
        configs.forEach(config => {
            const sectionStatus = {
                stepName: config.stepName,
                aiTutorEnabled: config.switches.open ? config.switches.open.checked : false,
                aiFeatures: {}
            };
            
            Object.entries(config.features).forEach(([feature, checkbox]) => {
                sectionStatus.aiFeatures[feature] = checkbox ? checkbox.checked : false;
            });
            
            status.sections.push(sectionStatus);
        });
        
        return status;
    }

    // 创建控制面板
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'ai-tutor-control-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            background: white;
            border: 2px solid #1890ff;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #1890ff;">🤖 AI Tutor 配置</h3>
                <button id="close-panel" style="background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                    <input type="checkbox" id="enable-ai-tutor" checked style="margin-right: 8px;">
                    开启AI Tutor
                </label>
            </div>
            
            <div id="ai-features" style="margin-bottom: 15px;">
                <div style="font-weight: bold; margin-bottom: 8px;">AI功能选择：</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px;">
                    <label><input type="checkbox" value="AI对话" checked> AI对话</label>
                    <label><input type="checkbox" value="动漫化头像"> 动漫化头像</label>
                    <label><input type="checkbox" value="拍图识字" checked> 拍图识字</label>
                    <label><input type="checkbox" value="文本转语音" checked> 文本转语音</label>
                    <label><input type="checkbox" value="物体识别"> 物体识别</label>
                    <label><input type="checkbox" value="语音合成"> 语音合成</label>
                    <label><input type="checkbox" value="语音识别" checked> 语音识别</label>
                    <label><input type="checkbox" value="AI文生图"> AI文生图</label>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <button id="apply-config" style="flex: 1; background: #1890ff; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    🚀 应用配置
                </button>
                <button id="get-status" style="flex: 1; background: #52c41a; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">
                    📊 查看状态
                </button>
            </div>
            
            <div id="progress-display" style="margin-bottom: 10px; padding: 10px; background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 4px; font-size: 12px; display: none; text-align: center;">
            </div>
            
            <div id="status-display" style="padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px; max-height: 200px; overflow-y: auto; display: none;">
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定事件
        document.getElementById('close-panel').onclick = () => panel.remove();
        
        document.getElementById('apply-config').onclick = async () => {
            const enableAI = document.getElementById('enable-ai-tutor').checked;
            const features = {};
            
            document.querySelectorAll('#ai-features input[type="checkbox"]').forEach(cb => {
                features[cb.value] = cb.checked;
            });
            
            const settings = {
                enableAITutor: enableAI,
                aiFeatures: features
            };
            
            // 隐藏状态显示
            document.getElementById('status-display').style.display = 'none';
            
            // 确认配置
            const featureList = Object.entries(features)
                .filter(([_, enabled]) => enabled)
                .map(([feature, _]) => feature)
                .join('、');
            
            const confirmMessage = `确认要应用以下配置到所有编程环节吗？\n\n` +
                `AI Tutor: ${enableAI ? '开启' : '关闭'}\n` +
                (enableAI && featureList ? `启用功能: ${featureList}` : '');
            
            if (confirm(confirmMessage)) {
                await submitConfigurationViaAPI(settings);
            }
        };
        
        document.getElementById('get-status').onclick = () => {
            const status = getCurrentAITutorStatus();
            const display = document.getElementById('status-display');
            
            let html = `<strong>当前状态 (${status.totalSections}个环节):</strong><br><br>`;
            
            status.sections.forEach(section => {
                html += `<div style="margin-bottom: 10px;">`;
                html += `<strong>${section.stepName}</strong><br>`;
                html += `AI Tutor: ${section.aiTutorEnabled ? '✅ 开启' : '❌ 关闭'}<br>`;
                
                if (section.aiTutorEnabled) {
                    Object.entries(section.aiFeatures).forEach(([feature, enabled]) => {
                        html += `${feature}: ${enabled ? '✅' : '❌'}<br>`;
                    });
                }
                html += `</div>`;
            });
            
            display.innerHTML = html;
            display.style.display = 'block';
        };
        
        // AI功能开关联动
        document.getElementById('enable-ai-tutor').onchange = (e) => {
            const featuresDiv = document.getElementById('ai-features');
            featuresDiv.style.opacity = e.target.checked ? '1' : '0.5';
            
            document.querySelectorAll('#ai-features input').forEach(input => {
                input.disabled = !e.target.checked;
            });
        };
    }

    // 等待页面加载完成
    function waitForPageLoad() {
        console.log('🔍 检查页面状态...');
        
        // 检查是否在编程猫课程配置页面
        const isCoursePage = window.location.href.includes('tyca.codemao.cn') && 
                           window.location.href.includes('course/info');
        
        if (!isCoursePage) {
            console.log('❌ 不在课程配置页面');
            return;
        }
        
        // 检查是否已经有控制面板
        if (document.getElementById('ai-tutor-control-panel')) {
            console.log('✅ 控制面板已存在');
            return;
        }
        
        // 检查页面基本元素
        const hasBasicElements = document.querySelector('#root') && 
                               document.querySelector('.ant-design-pro');
        
        if (!hasBasicElements) {
            console.log('⏳ 等待页面基础元素加载...');
            setTimeout(waitForPageLoad, 1000);
            return;
        }
        
        // 直接显示控制面板，不等待特定元素
        createControlPanel();
        console.log('🎉 AI Tutor 配置工具已加载！');
        
        // 添加页面提示
        const pageHint = document.createElement('div');
        pageHint.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #fff7e6;
            border: 1px solid #ffd666;
            border-radius: 6px;
            padding: 10px;
            font-size: 12px;
            color: #d46b08;
            z-index: 9999;
            max-width: 300px;
        `;
        pageHint.innerHTML = `
            💡 <strong>使用提示：</strong><br>
            1. 进入"课程环节配置"标签<br>
            2. 点击具体环节（如"上课"）<br>
            3. 点击"下一步"进入环节内容<br>
            4. 即可使用AI Tutor配置功能
        `;
        
        document.body.appendChild(pageHint);
        
        // 5秒后自动隐藏提示
        setTimeout(() => {
            if (document.body.contains(pageHint)) {
                pageHint.remove();
            }
        }, 8000);
    }

    // 页面加载完成后初始化
    console.log('🚀 AI Tutor 配置脚本启动...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(waitForPageLoad, 1000);
        });
    } else {
        setTimeout(waitForPageLoad, 1000);
    }
    
    // 也监听页面变化（用于SPA应用）
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('🔄 页面URL变化，重新检查...');
            setTimeout(waitForPageLoad, 2000);
        }
    }).observe(document, { subtree: true, childList: true });

    // 暴露全局函数供控制台调用
    window.submitConfigurationViaAPI = submitConfigurationViaAPI;
    window.getCurrentAITutorStatus = getCurrentAITutorStatus;
    window.showAITutorPanel = () => {
        // 移除现有面板
        const existingPanel = document.getElementById('ai-tutor-control-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        // 强制显示控制面板
        createControlPanel();
        console.log('🎉 AI Tutor 控制面板已强制显示！');
    };
    window.debugPageStatus = () => {
        const configs = findAITutorConfigs();
        console.log('调试信息:', {
            url: window.location.href,
            foundConfigs: configs.length,
            configs: configs.map(c => c.stepName),
            hasSteps: !!document.querySelector('button[roledescription="sortable"]'),
            hasSubmit: !!Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('提交') || btn.textContent.includes('提 交')
            ),
            hasTurtleEditor: !!Array.from(document.querySelectorAll('*')).find(el => 
                el.textContent && el.textContent.includes('海龟编辑器')
            )
        });
    };

})();