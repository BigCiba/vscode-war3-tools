/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { listenerAbilityExcelInit } from './listener/listenerAbilityExcel';
import { listenerUnitExcelInit } from './listener/listenerUnitExcel';
import { getStatusBarItem, refreshStatusBarMessage, showStatusBarMessage, statusBarItemInit } from './module/statusBar';
import { localize, localizeInit } from './utils/localize';
import { EventManager, EventType } from "./class/event";

/** 模块列表 */
const moduleList: Table = {
	// "localizeInit": localizeInit,
	// "statusBarItemInit": statusBarItemInit,
	"listenerAbilityExcelInit": listenerAbilityExcelInit,
	"listenerUnitExcelInit": listenerUnitExcelInit,
};

/** 跳过的模块对应的用户设置 */
const skipModuleList: { [key: string]: keyof ModuleListConfig; } = {
	"addonInfoInit": "addon_info",
};

let eventID: number;
const configName = "war3-tools.A1.module_list";
/** 用户设置 */
let moduleListConfig: ModuleListConfig | undefined = vscode.workspace.getConfiguration().get(configName);

/**
 * 进行初始化操作
 * @param context 
 */
export async function init(context: vscode.ExtensionContext) {
	// 监听配置变更
	if (eventID === undefined) {
		eventID = EventManager.listenToEvent<vscode.ConfigurationChangeEvent>(EventType.EVENT_ON_DID_CHANGE_CONFIGURATION, async (event) => {
			if (!event.affectsConfiguration(configName)) {
				return;
			}
			let timeRecord = (new Date()).valueOf();
			let newModuleListConfig: ModuleListConfig | undefined = vscode.workspace.getConfiguration().get(configName);
			const keys = Object.keys(moduleList);
			for (let i = 0; i < keys.length; i++) {
				const moduleName = keys[i];
				if (newModuleListConfig) {
					if (isSkipModule(moduleName) && newModuleListConfig[skipModuleList[moduleName]] !== false) {
						let messageIndex = showStatusBarMessage(`[${i + 1}/${keys.length}]${localize("loading")}：${localize(moduleName)}`, 20);
						await moduleList[moduleName](context);
						refreshStatusBarMessage(messageIndex, `[${i + 1}/${keys.length}]${localize("load_complete")}：${localize(moduleName)}，${localize("time_consuming")}：${(new Date()).valueOf() - timeRecord}${localize("millisecond")}`, 20);
						timeRecord = (new Date()).valueOf();
					}
				}
			}
			moduleListConfig = newModuleListConfig;
		});
	}

	let timeRecord = (new Date()).valueOf();

	const keys = Object.keys(moduleList);
	for (let i = 0; i < keys.length; i++) {
		const moduleName = keys[i];
		if (moduleListConfig) {
			if (isSkipModule(moduleName)) {
				showStatusBarMessage(`[${i + 1}/${keys.length}]${localize("skip_disabled_modules")}：${localize(moduleName)}`);
				continue;
			}
		}
		let messageIndex = showStatusBarMessage(`[${i + 1}/${keys.length}]${localize("loading")}：${localize(moduleName)}`, 20);

		await moduleList[moduleName](context);

		refreshStatusBarMessage(messageIndex, `[${i + 1}/${keys.length}]${localize("load_complete")}：${localize(moduleName)}，${localize("time_consuming")}：${(new Date()).valueOf() - timeRecord}${localize("millisecond")}`, 20);
		timeRecord = (new Date()).valueOf();
	}
	showStatusBarMessage(localize("allLoaded"), 20);
	getStatusBarItem().text = "$(check-all) " + localize("pluginNameLite");
}

/** 禁用模块判断 */
function isSkipModule(moduleName: string) {
	if (skipModuleList[moduleName] !== undefined && moduleListConfig != undefined && moduleListConfig[skipModuleList[moduleName]] === false) {
		return true;
	}
	return false;
}