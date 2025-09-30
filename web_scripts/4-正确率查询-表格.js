// ==UserScript==
// @name         4-正确率查询-表格
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  在题目列表中显示正确率,现已支持在线更新
// @author       大生
// @match        https://tyca.codemao.cn/weekly-test/*
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// @icon         https://tyca.codemao.cn/favicon.ico
// @updateURL    https://raw.githubusercontent.com/bpjanson/Vibe_Coding/main/web_scripts/%E6%AD%A3%E7%A1%AE%E7%8E%87%E6%9F%A5%E8%AF%A2-%E8%A1%A8%E6%A0%BC.js
// @downloadURL  https://raw.githubusercontent.com/bpjanson/Vibe_Coding/main/web_scripts/%E6%AD%A3%E7%A1%AE%E7%8E%87%E6%9F%A5%E8%AF%A2-%E8%A1%A8%E6%A0%BC.js
// ==/UserScript==

(function () {
    'use strict';

    let currentPaperId = null; // 用于跟踪当前的paperId，避免重复执行
    let observer = null; // MutationObserver 实例

    // 定义核心逻辑函数，用于获取数据并更新UI
    function runScriptIfPaperIdExists() {
        const urlParams = new URLSearchParams(window.location.search);
        const newPaperId = urlParams.get('paperId');

        // 1. 检查URL是否包含paperId
        if (!newPaperId) {
            console.log("URL中不包含paperId参数，脚本不执行正确率显示功能。");
            // 如果之前有paperId，现在没有了，需要清理observer
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            currentPaperId = null; // 重置paperId
            return;
        }

        // 2. 检查URL中是否只有paperId一个参数
        // This check is very strict. If other parameters are sometimes present but the script should still run,
        // this condition might need to be relaxed.
        if (Array.from(urlParams.keys()).length !== 1) {
            console.log("URL中除了paperId还有其他参数，脚本不执行。");
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            currentPaperId = null;
            return;
        }

        // 3. 如果paperId没有变化，则不重复执行
        if (newPaperId === currentPaperId) {
            // console.log("paperId未改变，不重复执行脚本。");
            return;
        }

        currentPaperId = newPaperId; // 更新当前的paperId
        console.log(`检测到新的paperId: ${currentPaperId}，开始执行脚本。`);

        // 4. 如果存在旧的观察器，先断开
        if (observer) {
            observer.disconnect();
        }

        const paperInfoUrl = `https://codecamp-teaching-system.codemao.cn/paper/${currentPaperId}`;

        // 5. 创建或重新创建 MutationObserver 实例
        // 确保在表格加载后才进行操作
        observer = new MutationObserver((mutationsList, obs) => {
            const tableHeader = document.querySelector('.ant-table-thead');
            if (tableHeader) {
                // 停止观察，避免重复执行
                obs.disconnect();

                // 修改表头，将“题目语音”改为“正确率”
                const headers = tableHeader.querySelectorAll('.ant-table-cell');
                let foundHeader = false;
                headers.forEach(header => {
                    if (header.textContent.includes('题目语音')) {
                        header.textContent = '正确率';
                        foundHeader = true;
                    }
                });

                // 只有成功修改了表头才去获取数据，避免在非目标页面误触发
                if (foundHeader) {
                    fetchPaperInfo(paperInfoUrl);
                } else {
                    console.log("未找到预期的表格表头（题目语音），不执行数据获取。");
                }
            }
        });

        // 6. 开始观察body元素的变化，确保表格加载
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 获取试卷详细信息和题目正确率的函数
    function fetchPaperInfo(url) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function (response) {
                if (response.status >= 200 && response.status < 300) {
                    try {
                        const paperData = JSON.parse(response.responseText);
                        if (paperData.code === 200 && paperData.success && paperData.data && paperData.data.questions) {
                            const questions = paperData.data.questions;
                            const questionPromises = questions.map(question => {
                                const questionId = question.questionId;
                                const questionName = question.name || `题目 ${questionId}`;
                                if (questionId) {
                                    const questionAccuracyUrl = `https://codecamp-teaching-system.codemao.cn/general-question/list?questionId=${questionId}`;
                                    return new Promise((resolve) => {
                                        GM_xmlhttpRequest({
                                            method: "GET",
                                            url: questionAccuracyUrl,
                                            onload: function (qResponse) {
                                                if (qResponse.status >= 200 && qResponse.status < 300) {
                                                    try {
                                                        const qData = JSON.parse(qResponse.responseText);
                                                        if (qData.code === 200 && qData.success && qData.data && qData.data.items && qData.data.items.length > 0 && qData.data.items[0].stat) {
                                                            const accuracy = qData.data.items[0].stat.accuracy;
                                                            resolve({ questionId, accuracy });
                                                        } else {
                                                            resolve({ questionId, accuracy: 'N/A' });
                                                        }
                                                    } catch (e) {
                                                        console.error(`解析题目 ${questionId} 响应失败:`, e);
                                                        resolve({ questionId, accuracy: 'N/A' });
                                                    }
                                                } else {
                                                    console.error(`获取题目 ${questionId} 信息失败，状态码: ${qResponse.status}`);
                                                    resolve({ questionId, accuracy: 'N/A' });
                                                }
                                            },
                                            onerror: function (error) {
                                                console.error(`请求题目 ${questionId} 时发生错误:`, error);
                                                resolve({ questionId, accuracy: 'N/A' });
                                            }
                                        });
                                    });
                                } else {
                                    return Promise.resolve({ questionId: null, accuracy: 'N/A' });
                                }
                            });

                            Promise.all(questionPromises).then(accuracies => {
                                updateTableWithAccuracies(accuracies);
                            });

                        } else {
                            console.warn("获取试卷信息成功，但数据结构不符合预期或无题目信息。");
                        }
                    } catch (e) {
                        console.error("解析试卷信息JSON响应失败：", e);
                    }
                } else {
                    console.error(`获取试卷信息失败，状态码：${response.status}`);
                }
            },
            onerror: function (error) {
                console.error("请求试卷信息失败：", error);
            }
        });
    }

    // 更新表格UI的函数
    function updateTableWithAccuracies(accuracies) {
        const accuracyMap = new Map(accuracies.map(item => [item.questionId, item.accuracy]));

        const tableBody = document.querySelector('.ant-table-tbody');
        if (!tableBody) {
            console.warn("未找到表格tbody元素。");
            return;
        }

        const rows = tableBody.querySelectorAll('tr.ant-table-row');
        rows.forEach(row => {
            const questionId = row.dataset.rowKey;
            if (questionId) {
                const accuracy = accuracyMap.get(parseInt(questionId));

                const cells = row.querySelectorAll('.ant-table-cell');
                if (cells.length > 4) {
                    const voiceCell = cells[4]; // 第5个单元格（索引从0开始），对应题目语音

                    if (accuracy !== undefined) {
                        if (accuracy === 'N/A') {
                            voiceCell.textContent = '无法获取';
                            voiceCell.style.color = '#888'; // 灰色
                        } else {
                            // 将正确率转换为整数百分比
                            const accuracyInt = Math.round(accuracy * 100);
                            voiceCell.textContent = `${accuracyInt}%`;
                            // 根据正确率值设置样式
                            if (accuracy < 0.6) {
                                voiceCell.style.color = 'red';
                            } else if (accuracy < 0.8) {
                                voiceCell.style.color = 'orange';
                            } else {
                                voiceCell.style.color = 'green';
                            }
                        }
                    } else {
                        voiceCell.textContent = '未找到';
                        voiceCell.style.color = '#888'; // 灰色
                    }
                }

                // 修改"查看试题"按钮的链接
                const actionCell = cells[cells.length - 1]; // 最后一个单元格是操作列
                const button = actionCell.querySelector('button.ant-btn-link');
                if (button && button.textContent.includes('查看试题')) {
                    // 移除原有的点击事件
                    button.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const newUrl = `https://tyca.codemao.cn/weekly-test/topic/detail?questionId=${questionId}`;
                        window.open(newUrl, '_blank');
                    };
                }
            }
        });
    }

    // --- 监听 URL 变化，确保脚本在 URL 变化时重新运行 ---

    // 使用 MutationObserver 监听 URL 变化，这是一个更健壮的方法，可以捕获 address bar 改变、history API 调用等情况。
    // 它通过观察 <title> 或其他动态元素的变化来间接判断页面内容是否已更新，
    // 或直接监听整个<body>的变化。这里我们选择监听URL变化本身。
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            runScriptIfPaperIdExists(); // URL 变化时，重新运行逻辑
        }
    }).observe(document, { subtree: true, childList: true }); // 观察整个文档的变化

    // 针对单页应用 (SPA) 路由变化的监听，以防万一 MutationObserver 无法捕获
    const originalPushState = history.pushState;
    history.pushState = function () {
        originalPushState.apply(history, arguments);
        runScriptIfPaperIdExists();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function () {
        originalReplaceState.apply(history, arguments);
        runScriptIfPaperIdExists();
    };

    window.addEventListener('popstate', runScriptIfPaperIdExists); // 浏览器前进/后退按钮

    // 首次加载页面时执行脚本
    runScriptIfPaperIdExists();

})();