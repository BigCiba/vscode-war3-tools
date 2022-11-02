import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import watch from "node-watch";
import { EventManager, EventType } from "../class/event";
import { localize } from "../utils/localize";
import { getRootPath } from "../utils/getRootPath";
import { eachExcelConfig, excel2kv } from "../command/cmdExcel2KV";
import { unitCSV2KV } from "../utils/csvUtils";
import { showStatusBarMessage } from "../module/statusBar";
import { writeKeyValue } from "../utils/kvUtils";
import { obj2Lua } from "../utils/objToLua";

let eventID: number;
let fileWatcher: fs.FSWatcher | undefined;
const configName = "war3-tools.A1.listener";
let config: boolean | undefined;

/** 监听技能excel变更 */
export function listenerUnitExcelInit(context: vscode.ExtensionContext) {
	if (getConfiguration()) {
		startWatch(context);
	}
	if (eventID === undefined) {
		eventID = EventManager.listenToEvent<vscode.ConfigurationChangeEvent>(EventType.EVENT_ON_DID_CHANGE_CONFIGURATION, (event) => {
			if (!event.affectsConfiguration(configName) || getConfiguration() === config) {
				return;
			}
			config = getConfiguration();
			if (getConfiguration()) {
				stopWatch();
				startWatch(context);
			} else {
				stopWatch();
			}
		});
	}
}
/** 开始监听 */
function startWatch(context: vscode.ExtensionContext) {
	if (fileWatcher === undefined) {
		const rootPath = getRootPath();
		if (rootPath) {
			showStatusBarMessage("[监听目录]：单位excel");
			let unitExcelConfig: Table | undefined = vscode.workspace.getConfiguration().get('war3-tools.A2.UnitExcel');
			fileWatcher = watch(rootPath, { recursive: true, filter: /\.csv$/ }, function (evt, name) {
				if (unitExcelConfig) {
					eachExcelConfig(unitExcelConfig, (kvDir, excelDir) => {
						if (path.normalize(excelDir) == path.normalize(path.dirname(name)).replace("\\csv", "")) {
							const kvName = path.join(kvDir, path.basename(name).replace(path.extname(name), '.lua'));
							fs.writeFileSync(kvName, obj2Lua(unitCSV2KV(name)));
							showStatusBarMessage("[excel导出kv]：" + path.basename(name).replace(path.extname(name), '.lua'));
							// excel2kv(kvDir, excelDir, unitCSV2KV);
							return false;
						}
					});
				}
			});
		} else {
			// vscode.window.showErrorMessage(`[${localize("listenerLocalizationInit")}]${localize("game_folder_no_found")}`);
		}
	}
}
/** 停止监听 */
function stopWatch() {
	if (fileWatcher) {
		showStatusBarMessage("[停止监听目录]：单位excel");
		fileWatcher.close();
		fileWatcher = undefined;
	}
}
/** 是否开启监听 */
function getConfiguration() {
	let listenerConfig: ListenerConfig | undefined = vscode.workspace.getConfiguration().get(configName);
	if (listenerConfig) {
		return listenerConfig.unit_excel || false;
	}
}