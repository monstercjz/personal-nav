'use strict';

import { showNotification } from './modules/websiteDashboardService.js';
import { renderDashboardWithData} from './modules/mainDashboardService.js';
import { addDocker,handleDockerHover } from './modules/dockerInteractionService.js';
// import { rendermainWithData } from './modules/dockerDashboardService.js';
//import { WebsiteDataService } from './modules/websiteDataService.js';
import { SearchService } from './modules/searchService.js';
import { fetchAndRenderGroupSelect, renderGroupSelect } from './modules/groupSelectDataService.js';
import { applySavedTheme, initThemeToggle } from './modules/themeService.js';
import { applySavedLayout, initLayoutToggle } from './modules/layoutService.js'; // 导入 layoutService
import { loadColorPreference, toggleRandomColors } from './modules/colorThemeService.js';
import { addGroup, deleteGroup, editGroup } from './modules/groupInteractionService.js';

import { addWebsite, deleteWebsite, getWebsiteInfo, handleWebsiteHover, openImportWebsitesModal ,handleWebsiteClick } from './modules/websiteInteractionService.js';
import { hideContextMenu, createContextMenu, showGroupContextMenu, showWebsiteContextMenu } from './modules/contextMenu.js';
import { validateAndCompleteUrl, showTooltip, hideTooltip } from './modules/utils.js';
import modalInteractionService from './modules/modalInteractionService.js';
import './modules/groupOrderService.js';
import { importData, exportData } from './modules/historyDataService.js';
import { dockerUpdateInfoAll } from './modules/dockerIfonUpdate.js';

// 用于存储分组数据
let groupsData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 获取分组选择下拉框元素
    const groupSelect = document.getElementById('groupSelect');
    // 获取仪表盘元素
    const websitedashboard = document.getElementById('websitedashboard');
    
    const main = document.querySelector('main');
    // 获取仪表盘元素
    const dockerdashboard = document.getElementById('dockerdashboard');
    // 获取数据导入按钮元素
    const importConfigButton = document.getElementById('import-config-button');
    // 获取数据导出按钮元素
    const exportConfigButton = document.getElementById('export-config-button');
    // 获取导入网站按钮元素
    const importWebsitesBatchButton = document.getElementById('import-websites-batch-button');
    // 获取切换添加按钮元素
    const actionsToggleButton = document.getElementById('actions-toggle-button');
    // 获取添加按钮容器元素
    const actionButtons = document.querySelector('.action-buttons');

    // 应用保存的主题和颜色偏好
    applySavedTheme();
    applySavedLayout(); // 应用保存的布局
    loadColorPreference();

    // 设置颜色切换按钮的初始状态
    const groupColorToggleButton = document.getElementById('group-color-toggle');
    groupColorToggleButton.classList.toggle('active', loadColorPreference());

    
    // 渲染仪表盘数据
    // await renderDashboardWithData(); // Commenting out sequential calls
    // 渲染 Docker 容器仪表盘
    // await renderDockerDashboardWithData();

    await Promise.all([ // Parallel rendering of dashboards
        renderDashboardWithData(),
        // renderDockerDashboardWithData()
    ]);
    // 实时刷新容器信息
    setInterval(async () => {
        await dockerUpdateInfoAll();
    }, 300000);
    // 初始化搜索功能
    const searchService = new SearchService();

    // 添加颜色切换按钮点击事件监听器
    groupColorToggleButton.addEventListener('click', async () => {
        const enabled = toggleRandomColors();
        groupColorToggleButton.classList.toggle('active', enabled);
        await renderDashboardWithData(); // 重新渲染以应用新的颜色设置
    });

    /**
     * 处理仪表盘点击事件，打开网站链接
     * 使用事件委托，监听仪表盘容器的点击事件
     * @param {Event} e - 点击事件对象
     */
    main.addEventListener('click', async (e) => {
        const target = e.target.closest('.website-item');
        if (target) {
            const link = target.querySelector('a');
            if (link) {
                // 记录点击时间
                await handleWebsiteClick(target);
                // 打开链接
                window.open(link.href, '_blank');
            }
        }
    });

    /**
     * 处理仪表盘点击事件，打开网站链接
     * 使用事件委托，监听仪表盘容器的点击事件
     * @param {Event} e - 点击事件对象
     */
    main.addEventListener('click', (e) => {
        // 查找最近的 .docker-item 元素
        const target = e.target.closest('.docker-item');
        if (!target) return;
    
        // 查找 <a> 元素
        const link = target.querySelector('a');
        if (!link) {
            console.warn('No <a> element found within the clicked .docker-item');
            return;
        }
    
        // 打开链接
        window.open(link.href, '_blank');
    });

    // 添加数据导入按钮点击事件监听器
    importConfigButton.addEventListener('click', importData);

    // 添加数据导出按钮点击事件监听器
    exportConfigButton.addEventListener('click', exportData);

    // 添加导入网站按钮点击事件监听器
    importWebsitesBatchButton.addEventListener('click', () => {
        openImportWebsitesModal();
    });

    // 添加鼠标悬停事件监听器
    main.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.website-item');
        if (target) {
            // 显示网站详细信息tooltip
            handleWebsiteHover(target);
        }
    });
    // 添加鼠标悬停事件监听器
    main.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.docker-item');
        if (target) {
            // 显示网站详细信息tooltip
            handleDockerHover(target);
        }
    });

    // 添加鼠标移开事件监听器，隐藏工具提示
    document.addEventListener('mouseout', hideTooltip);

    // 添加切换添加按钮点击事件监听器
    actionsToggleButton.addEventListener('click', () => {
        const buttons = actionButtons.querySelectorAll('.icon-button');
        if (actionButtons.classList.contains('show')) {
            actionButtons.classList.remove('show');
            // 关闭时反向设置延迟
            buttons.forEach((btn, index) => {
                btn.style.transitionDelay = `${50 * (buttons.length - index - 1)}ms`;
            });
        } else {
            actionButtons.classList.add('show');
            // 添加按钮显示动画效果
            buttons.forEach((btn, index) => {
                btn.style.transitionDelay = `${50 * index}ms`;
            });
        }

        // 300ms后重置所有transition-delay
        setTimeout(() => {
            buttons.forEach(btn => {
                btn.style.transitionDelay = '';
            });
        }, 300);
    });

    // 添加添加分组按钮点击事件监听器
    const addGroupButton = document.getElementById('add-group-button');
    addGroupButton.addEventListener('click', () => {
        addGroup();
    });

    // 添加添加网站按钮点击事件监听器
    const addWebsiteButton = document.getElementById('add-website-button');
    addWebsiteButton.addEventListener('click', () => {
        addWebsite();
    });
    // 添加添加 Docker 容器按钮点击事件监听器
    const addDockerButton = document.getElementById('add-docker-button');
    addDockerButton.addEventListener('click', () => {
        addDocker();
    });
    /**
     * 处理分组加号图标点击事件
     * 使用事件委托监听 main 容器 
     */
    main.addEventListener('click', async (e) => {
        const addIcon = e.target.closest('.quickly-item-add-button');
        if (addIcon) {
            const groupElement = addIcon.closest('.website-group, .docker-group');
            if (groupElement) {
                const groupType = groupElement.getAttribute('groupType');
                const groupId = groupElement.getAttribute('id');
                if (groupType === 'website-group') {
                    // 调用 addWebsite 函数
                    addWebsite(groupId);
                } else if (groupType === 'docker-group') {
                    // 调用 addDocker 函数
                    addDocker(groupId);
                } else {
                    console.warn('Unknown group type:', groupType);
                }
            }
        }
    });

    // 初始化主题切换功能
    initThemeToggle();
    // 初始化布局切换功能 (目前为空)
    initLayoutToggle(); // 初始化布局切换功能
    // 添加切换添加按钮鼠标悬停事件监听器
    actionsToggleButton.addEventListener('mouseover', showTooltip);
    // 获取 action-buttons 下的所有 icon-button 元素
    const actionIconButtons = actionButtons.querySelectorAll('.icon-button');

    // 为每个 action button 添加鼠标悬停事件监听器
    actionIconButtons.forEach(button => {
        button.addEventListener('mouseover', showTooltip);
    });
    // const themeswitcheroptionButtons = actionButtons.querySelectorAll('.theme-switcher__option');
        
    //     themeswitcheroptionButtons.forEach(button => {
    //         button.addEventListener('mouseover', showTooltip);
    //     });
});
