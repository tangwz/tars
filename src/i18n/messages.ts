import type { Locale } from "./types";

const rawEnMessages = {
  "startup.recentProjects": "Recent Projects",
  "startup.openProject": "Open Project",
  "startup.openingProject": "Opening...",
  "startup.loadingRecentProjects": "Loading recent projects...",
  "startup.noRecentProjects": "No recent projects yet.",
  "startup.recentLimit": "{count}/5",
  "error.projectPathUnavailable": "Project path is no longer available.",
  "workspace.threadsTitle": "Threads",
  "workspace.addProject": "Add project",
  "workspace.mainPlaceholder": "Workspace placeholder. Project tools will be added here.",
  "workspace.settings": "Settings",
  "workspace.language": "Language",
  "workspace.languageEnglish": "English",
  "workspace.languageSimplifiedChinese": "Simplified Chinese",
  "workspace.mainPanelAria": "Workspace main panel",
  "workspace.settingsMenuAria": "Language settings menu",
  "workspace.mockThread.fixDirectoryValidation": "Fix project directory validation",
  "workspace.mockThread.initTauriStack": "Initialize Tauri React stack",
  "workspace.mockThread.planMvpTasks": "Plan MVP tasks and agent flow",
  "workspace.mockThread.refactorMapView": "Implement map rendering refactor",
  "workspace.mockThread.settingsSimplification": "Simplify goal settings layout",
  "workspace.mockThread.releasePlan": "Plan release and binary safety process",
} as const;

export type TranslationKey = keyof typeof rawEnMessages;
export type TranslationMessages = Record<TranslationKey, string>;

export const enMessages: TranslationMessages = rawEnMessages;

const zhCnMessages: TranslationMessages = {
  "startup.recentProjects": "最近项目",
  "startup.openProject": "打开项目",
  "startup.openingProject": "正在打开...",
  "startup.loadingRecentProjects": "正在加载最近项目...",
  "startup.noRecentProjects": "暂时还没有最近项目。",
  "startup.recentLimit": "{count}/5",
  "error.projectPathUnavailable": "项目路径已不可用。",
  "workspace.threadsTitle": "会话",
  "workspace.addProject": "添加项目",
  "workspace.mainPlaceholder": "右侧工作区暂未设计，后续将在这里展示会话内容。",
  "workspace.settings": "设置",
  "workspace.language": "语言",
  "workspace.languageEnglish": "English",
  "workspace.languageSimplifiedChinese": "简体中文",
  "workspace.mainPanelAria": "工作区主面板",
  "workspace.settingsMenuAria": "语言设置菜单",
  "workspace.mockThread.fixDirectoryValidation": "修复项目目录校验问题",
  "workspace.mockThread.initTauriStack": "初始化 Tauri React 技术栈",
  "workspace.mockThread.planMvpTasks": "规划 MVP 任务与 Agent 流程",
  "workspace.mockThread.refactorMapView": "实现地图渲染重构方案",
  "workspace.mockThread.settingsSimplification": "简化目标设置区域布局",
  "workspace.mockThread.releasePlan": "规划发布与二进制流程安全",
};

export const messages: Record<Locale, TranslationMessages> = {
  en: enMessages,
  "zh-CN": zhCnMessages,
};
