import * as fs from 'fs';
import * as os from 'os';
import { getPathInfo } from "./pathUtils";
import { isNumber } from "./isNumber";

export function obj2Lua(obj: any) {
	let data = writeKeyValueLua(obj);
	data = "return {\n" + data + "\n}";
	return data;
}

export function writeKeyValueLua(obj: any, depth: number = 1, tab: number = 12) {
	var str: string = '';
	if (obj === null || obj === undefined) {
		return str;
	}
	// 添加制表符
	function addDepthTab(depth: number, addString: string): string {
		var tab: string = '';
		for (let d = 0; d < depth; d++) {
			tab += '\t';
		}
		tab += addString;
		return tab;
	}
	// 添加key与value之间制表符
	function addIntervalTab(depth: number, key: string, nTab: number = 12): string {
		var tab: string = '';
		for (let d = 0; d < nTab - Math.floor((depth * 4 + key.length + 2) / 4); d++) {
			tab += '\t';
		}
		return tab;
	}
	let keys = Object.keys(obj).sort(function (a, b) { return Number(a) - Number(b); });
	for (let index = 0; index < keys.length; index++) {
		const key = keys[index];
		const value = obj[key];
		if (value === undefined || value === null || (typeof (value) === "object" && Object.keys(value).length === 0)) {
		} else if (typeof (value) === 'string') {
			str += addDepthTab(depth, '["' + key + '"] = ');
			if (value.indexOf(" ") !== -1) {
				str += '{' + value.split(" ").map((a) => {
					if (isNumber(a)) {
						return a;
					} else {
						return `"${a}"`;
					}
				}).join(",") + '},' + os.EOL;
			} else if (isNumber(value)) {
				str += value + "," + os.EOL;
			} else {
				str += '[[' + value + ']],' + os.EOL;
			}
		} else {
			str += addDepthTab(depth, '["' + key + '"] = {' + os.EOL);
			str += writeKeyValueLua(value, depth + 1);
			str += addDepthTab(depth, '},' + os.EOL);
		}
	}
	return str;
}