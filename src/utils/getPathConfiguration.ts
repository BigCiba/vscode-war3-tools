import * as vscode from 'vscode';
import * as path from 'path';

// 获取路径格式的设置
export function getPathConfiguration(name: string) {
	let workspaceDir: string | undefined = undefined;
	const folders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;
	if (folders !== undefined) {
		workspaceDir = folders[0].uri.fsPath;
	}
	let keyword: { [key: string]: string | undefined; } = {
		workspace: workspaceDir
	};
	let setting: string | undefined = vscode.workspace.getConfiguration().get(name);
	if (setting) {
		for (const key in keyword) {
			if (setting.indexOf("${" + key + "}") != -1) {
				setting = path.join(keyword[key] || "", setting.replace("${" + key + "}", ""));
			}
		}
	}

	return setting;
}