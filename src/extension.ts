import * as vscode from 'vscode';
import { EventManager, EventType } from './class/event';
import { cmdExcel2KV } from './command/cmdExcel2KV';
import { init } from './init';
import { statusBarItemInit } from './module/statusBar';
import { localizeInit } from './utils/localize';

export async function activate(context: vscode.ExtensionContext) {
	// 基础模块单独载入
	await localizeInit(context);
	await statusBarItemInit(context);
	// 进行其他初始化
	await init(context);

	vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
		await init(context);
	}, null, context.subscriptions);

	/** 分发配置变更 */
	vscode.workspace.onDidChangeConfiguration((event) => {
		EventManager.fireEvent<vscode.ConfigurationChangeEvent>(EventType.EVENT_ON_DID_CHANGE_CONFIGURATION, event);
	}, null, context.subscriptions);

	context.subscriptions.push(vscode.commands.registerCommand('war3-tools.excel_to_lua', () => cmdExcel2KV(context)));
}

export function deactivate() { }