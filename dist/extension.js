/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventManager = exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType[EventType["EVENT_ON_DID_CHANGE_WORKSPACE_FOLDERS"] = 0] = "EVENT_ON_DID_CHANGE_WORKSPACE_FOLDERS";
    EventType[EventType["EVENT_ON_DID_CHANGE_CONFIGURATION"] = 1] = "EVENT_ON_DID_CHANGE_CONFIGURATION";
})(EventType = exports.EventType || (exports.EventType = {}));
class EventManager {
    /** 发起事件 */
    static fireEvent(eventType, event) {
        if (EventManager.eventList[eventType]) {
            for (const callback of EventManager.eventList[eventType]) {
                callback(event);
            }
        }
    }
    /** 监听事件 */
    static listenToEvent(eventType, callback) {
        if (EventManager.eventList[eventType] === undefined) {
            EventManager.eventList[eventType] = [];
        }
        EventManager.eventList[eventType].push(callback);
        return EventManager.eventList[eventType].length - 1;
    }
    /** 停止监听事件 */
    static stopListenToEvent(eventType, index) {
        if (EventManager.eventList[eventType]) {
            EventManager.eventList[eventType].splice(index, 1);
        }
    }
}
exports.EventManager = EventManager;
EventManager.eventList = {};


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.excel2kv = exports.eachExcelConfig = exports.cmdExcel2KV = void 0;
const vscode = __webpack_require__(1);
const path = __webpack_require__(4);
const fs = __webpack_require__(5);
const csvUtils_1 = __webpack_require__(6);
const getRootPath_1 = __webpack_require__(8);
const statusBar_1 = __webpack_require__(9);
const localize_1 = __webpack_require__(11);
const pathUtils_1 = __webpack_require__(14);
const objToLua_1 = __webpack_require__(15);
function cmdExcel2KV(context) {
    let abilityExcelConfig = vscode.workspace.getConfiguration().get('war3-tools.A2.AbilityExcel');
    if (abilityExcelConfig) {
        eachExcelConfig(abilityExcelConfig, (kvDir, excelDir) => {
            excel2kv(kvDir, excelDir, csvUtils_1.abilityCSV2KV);
        });
    }
    let unitExcelConfig = vscode.workspace.getConfiguration().get('war3-tools.A2.UnitExcel');
    if (unitExcelConfig) {
        eachExcelConfig(unitExcelConfig, (kvDir, excelDir) => {
            excel2kv(kvDir, excelDir, csvUtils_1.unitCSV2KV);
        });
    }
}
exports.cmdExcel2KV = cmdExcel2KV;
/** 遍历excel配置表 */
async function eachExcelConfig(config, callback) {
    for (const kvDir in config) {
        const excelDir = config[kvDir];
        if (path.isAbsolute(excelDir)) {
            // 绝对路径
            if (callback(path.normalize(kvDir), path.normalize(excelDir)) !== undefined) {
                break;
            }
            // excel2kv(kvDir, excelDir, method);
        }
        else {
            // 相对路径
            let realKvDir = kvDir;
            let realExcelDir = excelDir;
            const rootPath = (0, getRootPath_1.getRootPath)();
            if (rootPath) {
                if (path.isAbsolute(realKvDir) === false) {
                    realKvDir = path.join(rootPath, kvDir);
                }
                if (path.isAbsolute(realExcelDir) === false) {
                    realExcelDir = path.join(rootPath, excelDir);
                }
            }
            if (callback(path.normalize(realKvDir), path.normalize(realExcelDir)) !== undefined) {
                break;
            }
            // excel2kv(realKvDir, realExcelDir, method);
        }
    }
}
exports.eachExcelConfig = eachExcelConfig;
async function excel2kv(kvDir, excelDir, method) {
    if (await (0, pathUtils_1.getPathInfo)(kvDir) === false) {
        (0, statusBar_1.showStatusBarMessage)(`[${(0, localize_1.localize)("cmdExcel2KV")}]：` + (0, localize_1.localize)("path_no_found") + kvDir);
        vscode.window.showErrorMessage(`[${(0, localize_1.localize)("cmdExcel2KV")}]：` + (0, localize_1.localize)("path_no_found") + `(${kvDir})` + (0, localize_1.localize)("sure create folder"), (0, localize_1.localize)("confirm"), (0, localize_1.localize)("cancel")).then((value) => {
            if (value == (0, localize_1.localize)("confirm")) {
                (0, pathUtils_1.dirExists)(kvDir);
            }
        });
        return;
    }
    if (await (0, pathUtils_1.getPathInfo)(excelDir) === false) {
        (0, statusBar_1.showStatusBarMessage)(`[${(0, localize_1.localize)("cmdExcel2KV")}]：` + (0, localize_1.localize)("path_no_found") + excelDir);
        return;
    }
    (0, statusBar_1.changeStatusBarState)(statusBar_1.StatusBarState.LOADING);
    let messageIndex = (0, statusBar_1.showStatusBarMessage)(`[${(0, localize_1.localize)("cmdExcel2KV")}]：` + excelDir);
    let fileType = (await vscode.workspace.fs.stat(vscode.Uri.file(excelDir))).type;
    if (fileType === vscode.FileType.Directory) {
        let files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(excelDir));
        for (let i = 0; i < files.length; i++) {
            let [fileName, isFile] = files[i];
            // 排除临时文件
            if (fileName === undefined || fileName.search(/~\$/) !== -1) {
                continue;
            }
            if (isFile === vscode.FileType.File) {
                let filePath = path.join(excelDir, fileName);
                let csvPath = path.join(path.dirname(filePath), 'csv', path.basename(filePath).replace(path.extname(filePath), '.csv'));
                if (await (0, pathUtils_1.getPathInfo)(csvPath) === false) {
                    (0, statusBar_1.showStatusBarMessage)(`[${(0, localize_1.localize)("cmdExcel2KV")}]：` + (0, localize_1.localize)("path_no_found") + csvPath);
                    return;
                }
                await (0, pathUtils_1.dirExists)(path.join(kvDir, path.dirname(fileName.replace(path.extname(fileName), '.lua'))));
                fs.writeFileSync(path.join(kvDir, fileName.replace(path.extname(fileName), '.lua')), (0, objToLua_1.obj2Lua)(method(csvPath)));
                (0, statusBar_1.refreshStatusBarMessage)(messageIndex, `[${(0, localize_1.localize)("cmdExcel2KV")}]：` + fileName);
            }
        }
    }
    else if (fileType === vscode.FileType.File) {
        let csvPath = path.join(path.dirname(excelDir), 'csv', path.basename(excelDir).replace(path.extname(excelDir), '.csv'));
        if (await (0, pathUtils_1.getPathInfo)(csvPath) === false) {
            (0, statusBar_1.showStatusBarMessage)(`[${(0, localize_1.localize)("cmdExcel2KV")}]：` + (0, localize_1.localize)("path_no_found") + csvPath);
            return;
        }
        await (0, pathUtils_1.dirExists)(kvDir);
        fs.writeFileSync(kvDir, (0, objToLua_1.obj2Lua)(method(csvPath)));
        (0, statusBar_1.refreshStatusBarMessage)(messageIndex, `[${(0, localize_1.localize)("cmdExcel2KV")}]：` + path.basename(excelDir));
    }
    (0, statusBar_1.changeStatusBarState)(statusBar_1.StatusBarState.ALL_DONE);
}
exports.excel2kv = excel2kv;


/***/ }),
/* 4 */
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),
/* 5 */
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.unitCSV2KV = exports.abilityCSV2KV = exports.multilayerCSV2KV = exports.isEmptyCSVValue = exports.array2csv = exports.csv2array = exports.csvParse = exports.obj2csv = exports.csv2obj = void 0;
const os = __webpack_require__(7);
const fs = __webpack_require__(5);
function csv2obj(csv, bVertical = false) {
    let arrCSV = csv;
    if (typeof (csv) === "string") {
        arrCSV = csvParse(csv);
    }
    let csvConfigs = {};
    if (bVertical) {
        for (let i = 0; i < arrCSV.length; i++) {
            let arrLine = arrCSV[i];
            csvConfigs[arrLine[1]] = arrLine[2];
        }
    }
    else {
        // 横向的至少要有三行，第一行中文，第二行key， 第三行内容
        if (arrCSV.length < 3) {
            return csvConfigs;
        }
        let keys = arrCSV[1]; // 第二行 key
        for (let i = 2; i < arrCSV.length; i++) {
            let arrLine = arrCSV[i];
            let lineID = arrLine[0];
            if (!lineID) {
                continue;
            }
            csvConfigs[lineID] = {};
            for (let j = 0; j < arrLine.length; j++) {
                if (!keys[j] || keys[j] === "") {
                    continue;
                }
                let value = arrLine[j] || "";
                // if (value===undefined || value==="") {
                // 	continue;
                // }
                // 因为多个key都叫AttachWearables，处理成AttachWearables1234
                let columnKey = keys[j];
                if (keys[j] === "AttachWearables") {
                    for (let index = 1; index < 30; index++) {
                        if (!csvConfigs[lineID]["AttachWearables" + index]) {
                            columnKey = "AttachWearables" + index;
                            break;
                        }
                    }
                }
                csvConfigs[lineID][columnKey] = value;
            }
        }
        // 中文行处理
        csvConfigs["__key_sc"] = {};
        for (let j = 0; j < keys.length; j++) {
            let sc = arrCSV[0][j] || "";
            let columnKey = keys[j];
            if (keys[j] === "AttachWearables") {
                for (let index = 1; index < 30; index++) {
                    if (!csvConfigs["__key_sc"]["AttachWearables" + index]) {
                        columnKey = "AttachWearables" + index;
                        sc = "AttachWearables" + index;
                        break;
                    }
                }
            }
            csvConfigs["__key_sc"][columnKey] = sc;
        }
    }
    return csvConfigs;
}
exports.csv2obj = csv2obj;
// Obj转csv
function obj2csv(obj) {
    let keySc = obj.__key_sc;
    if (!keySc) {
        // 默认中英文key一样
        keySc = {};
        for (let lineID in obj) {
            let lineInfo = obj[lineID];
            for (let columnKey in lineInfo) {
                keySc[columnKey] = columnKey;
            }
        }
    }
    // 前两行
    let arrCSV = [];
    arrCSV[0] = [];
    arrCSV[1] = [];
    for (let key in keySc) {
        let sChineseKey = keySc[key];
        arrCSV[0].push(sChineseKey);
        if (key.indexOf("AttachWearables") !== -1) {
            arrCSV[1].push("AttachWearables");
        }
        else {
            arrCSV[1].push(key);
        }
    }
    let y = 2;
    for (let lineID in obj) {
        if (lineID === "__key_sc") {
            continue;
        }
        arrCSV[y] = [];
        let oLineInfo = obj[lineID];
        for (let columnKey in keySc) {
            let value = oLineInfo[columnKey] || '';
            arrCSV[y].push(value);
        }
        y++;
    }
    return array2csv(arrCSV);
}
exports.obj2csv = obj2csv;
// csv转array
function csvParse(csv) {
    csv = csv.replace(/\r\n/g, '\n');
    let arr = [];
    let col = 0;
    let row = 0;
    for (let i = 0; i < csv.length; i++) {
        i = readValue(i);
    }
    return arr;
    function readValue(index) {
        let value = "";
        let state = "normal";
        for (let i = index; i < csv.length; i++) {
            let substr = csv[i];
            let bLast = (i === csv.length - 1);
            if (substr === "\"" && state === "normal") {
                state = "string";
                continue;
            }
            if (substr === "\"" && state === "string") {
                state = "normal";
                continue;
            }
            if (substr === "\n" && state === "string") {
                value += substr;
                continue;
            }
            if (substr === "\n" && state === "normal") {
                if (arr[row] === undefined) {
                    arr[row] = [];
                }
                arr[row][col] = value;
                row++;
                col = 0;
                return i;
            }
            if (substr === "," && state !== "string") {
                if (arr[row] === undefined) {
                    arr[row] = [];
                }
                arr[row][col] = value;
                col++;
                return i;
            }
            if (bLast && state === "normal") {
                if (arr[row] === undefined) {
                    arr[row] = [];
                }
                value += substr;
                arr[row][col] = value;
                row++;
                col = 0;
                return i;
            }
            value += substr;
        }
    }
}
exports.csvParse = csvParse;
// csv转array(无法处理单元格换行问题)
function csv2array(csv) {
    const rows = csv.split(os.EOL);
    let arr = [];
    for (let i = 0; i < rows.length; i++) {
        arr[i] = [];
        const lineText = rows[i];
        let values = lineText.split(',');
        if (values.length === 1) {
            continue;
        }
        for (let j = 0; j < values.length; j++) {
            const value = values[j];
            arr[i].push(value);
        }
    }
    return arr;
}
exports.csv2array = csv2array;
// array转csv
function array2csv(arr) {
    let csv = '';
    let titleCount = arr[1].length;
    for (let i = 0; i < arr.length; i++) {
        const rows = arr[i];
        for (let j = 0; j < rows.length; j++) {
            if (rows[0] === undefined && rows.length === 0) {
                break;
            }
            let col = rows[j] === undefined ? '' : rows[j];
            if (col.indexOf(",") !== -1) {
                col = '"' + col + '"';
            }
            csv += col + (j + 1 === rows.length ? '' : ',');
        }
        if (rows[0] !== undefined || rows.length > 0) {
            for (let q = 0; q < titleCount - rows.length; q++) {
                csv += ',';
            }
            csv += os.EOL;
        }
        if (rows.length === 0) {
            for (let i = 0; i < titleCount - 1; i++) {
                csv += ',';
            }
            csv += os.EOL;
        }
    }
    return csv;
}
exports.array2csv = array2csv;
function isEmptyCSVValue(anything) {
    if (anything === undefined || anything === null || anything === "") {
        return true;
    }
    else {
        return false;
    }
}
exports.isEmptyCSVValue = isEmptyCSVValue;
function multilayerCSV2KV(listenPath) {
    try {
        let csv = fs.readFileSync(listenPath, 'utf-8');
        let csvArr = csvParse(csv);
        // 处理多层key
        let csvKey = csvArr[1];
        for (let index = 0; index < csvKey.length; index++) {
            let key = csvKey[index];
            let keySplit = key.split("-");
            if (keySplit.length > 1) {
                csvKey[index] = keySplit;
            }
        }
        let arrDefault = csvArr[2];
        if (arrDefault.length === 0 || arrDefault[0] === undefined) {
            return {};
        }
        let arrKeyDepth = {}; // 用这个对象记录上一次unique_key变化后的多层结构
        let csvData = {}; // 函数返回值
        for (let y = 2; y < csvArr.length; y++) {
            const row = csvArr[y];
            if (row.length === 0) {
                continue;
            }
            let lineObj;
            if (row[0] === "") {
                lineObj = csvData[arrDefault[0]];
            }
            else {
                // 新的一个，初始化
                lineObj = {};
                arrDefault = [row[0]];
                arrKeyDepth = {};
            }
            for (let x = 1; x < row.length; x++) {
                let col = row[x];
                if (col !== "") {
                    arrDefault[x] = col;
                }
                else {
                    col = arrDefault[x];
                }
                let key = csvKey[x];
                if (key instanceof Array) {
                    let tempObj;
                    if (key[0] !== "root") {
                        if (lineObj[key[0]] === undefined) {
                            lineObj[key[0]] = {};
                        }
                        tempObj = lineObj[key[0]];
                    }
                    else {
                        tempObj = lineObj;
                    }
                    if (arrKeyDepth[key[0]] === undefined) {
                        arrKeyDepth[key[0]] = {};
                    }
                    // 去头去尾来读取arrKeyDepth,使temp_obj[这个指针]指向col应该填入的位置 NOTE:中间的只能为value 尾部可以为key或者value
                    let index = 1;
                    let depth = index - 1;
                    for (; index <= key.length - 2; index++) {
                        depth = index - 1;
                        let sKeyDepth = arrKeyDepth[key[0]][depth];
                        if (sKeyDepth === undefined || sKeyDepth === "") {
                            continue;
                        }
                        if (tempObj[sKeyDepth] === undefined) {
                            continue;
                        }
                        tempObj = tempObj[sKeyDepth];
                    }
                    depth = index - 1;
                    if (key[key.length - 1] === "value") {
                        let sKeyDepth = arrKeyDepth[key[0]][depth];
                        if (sKeyDepth === undefined || sKeyDepth === "") {
                            continue;
                        }
                        tempObj[sKeyDepth] = col;
                    }
                    else {
                        let sKeyDepth = (col === "" || col === undefined) ? arrKeyDepth[key[0]][depth] : col;
                        if (sKeyDepth === undefined || sKeyDepth === "") {
                            continue;
                        }
                        arrKeyDepth[key[0]][depth] = sKeyDepth;
                        if (tempObj[sKeyDepth] === undefined) {
                            tempObj[sKeyDepth] = {};
                        }
                    }
                }
                else if (key === "") {
                    continue;
                }
                else {
                    if (col === undefined || col === "") {
                        continue;
                    }
                    lineObj[key] = col;
                }
            }
            if (row[0] !== undefined && row[0] !== "") {
                csvData[row[0]] = lineObj;
            }
        }
        return csvData;
    }
    catch (error) {
        console.log(error);
    }
}
exports.multilayerCSV2KV = multilayerCSV2KV;
function abilityCSV2KV(listenPath) {
    let csv = fs.readFileSync(listenPath, 'utf-8');
    // 生成kv
    let csvData = {};
    let csvArr = csvParse(csv);
    // let csv_arr:any = CSV2Array(csv);
    const csvKey = csvArr[0];
    for (let i = 1; i < csvArr.length; i++) {
        const row = csvArr[i];
        // 空行、空值则跳过
        if (row.length === 0 || row[0] === undefined || row[0] === "") {
            continue;
        }
        let specialCount = 1;
        let precacheCount = 1;
        let abilitySpecial = {};
        let abilityValues = {}; /** 新版kv键值 */
        let precacheResource = {};
        let precache = {};
        let valuesObj = {};
        for (let j = 1; j < row.length; j++) {
            const col = row[j];
            // 跳过空值
            if (col === '') {
                continue;
            }
            let key = csvKey[j];
            // special值特殊处理
            if (key === 'AbilitySpecial') {
                key = ("0" + specialCount).substr(-2);
                if (csvArr[i + 1] !== undefined && csvArr[i + 1] !== "") {
                    let value = csvArr[i + 1][j];
                    // 拆分key
                    let keyArr = col.split("\n");
                    // 拆分value
                    let valueArr = value.split("\n");
                    abilitySpecial[key] = {
                        var_type: valueArr[0].search(/\./g) !== -1 ? 'FIELD_FLOAT' : 'FIELD_INTEGER',
                        // [col]: csv_arr[i+1][j]
                    };
                    for (let i = 0; i < keyArr.length; i++) {
                        const _key = keyArr[i];
                        abilitySpecial[key][_key] = valueArr[i];
                    }
                    specialCount++;
                }
            }
            else if (key === 'AbilityValues') {
                if (csvArr[i + 1] !== undefined && csvArr[i + 1] !== "") {
                    let value = csvArr[i + 1][j];
                    // 拆分key
                    let keyArr = col.split("\n");
                    // 拆分value
                    let valueArr = value.split("\n");
                    if (keyArr.length <= 1) {
                        abilityValues[keyArr[0]] = valueArr[0];
                    }
                    else {
                        abilityValues[keyArr[0]] = {};
                        for (let i = 0; i < keyArr.length; i++) {
                            const _key = keyArr[i];
                            const _value = valueArr[i];
                            if (i == 0) {
                                abilityValues[keyArr[0]]["value"] = _value;
                            }
                            else {
                                abilityValues[keyArr[0]][_key] = _value;
                            }
                        }
                    }
                }
            }
            else if (key.indexOf("参数") != -1) {
                if (csvArr[i + 1] !== undefined && csvArr[i + 1] !== "") {
                    let value = csvArr[i + 1][j];
                    // 拆分key
                    let keyArr = col.split("\n");
                    // 拆分value
                    let valueArr = value.split("\n");
                    // if (keyArr.length <= 1) {
                    // 	abilityValues[keyArr[0]] = valueArr[0];
                    // } else {
                    // 	abilityValues[keyArr[0]] = {};
                    // 	for (let i = 0; i < keyArr.length; i++) {
                    // 		const _key = keyArr[i];
                    // 		const _value = valueArr[i];
                    // 		if (i == 0) {
                    // 			abilityValues[keyArr[0]]["value"] = _value;
                    // 		} else {
                    // 			abilityValues[keyArr[0]][_key] = _value;
                    // 		}
                    // 	}
                    // }
                    valuesObj[col] = value;
                }
            }
            else if (key === '') {
                continue;
            }
            else if (key === 'precache') {
                if (csvArr[i + 1] !== undefined && csvArr[i + 1] !== "") {
                    let value = csvArr[i + 1][j];
                    if (precache[col] === undefined) {
                        precache[col] = [];
                    }
                    precache[col].push(value);
                }
            }
            else if (key === 'PrecacheResource') {
                // 自定义的预载入
                if (csvArr[i + 1] !== undefined && csvArr[i + 1] !== "") {
                    // 拆分key
                    let keyArr = col.split("\n");
                    for (let i = 0; i < keyArr.length; i++) {
                        const _key = keyArr[i];
                        precacheResource[String(precacheCount)] = _key;
                        precacheCount++;
                    }
                }
            }
            else {
                valuesObj[key] = col;
            }
        }
        if (Object.keys(abilitySpecial).length > 0) {
            valuesObj.AbilitySpecial = abilitySpecial;
        }
        if (Object.keys(abilityValues).length > 0) {
            valuesObj.AbilityValues = abilityValues;
        }
        if (Object.keys(precache).length > 0) {
            valuesObj.precache = precache;
        }
        if (Object.keys(precacheResource).length > 0) {
            valuesObj.PrecacheResource = precacheResource;
        }
        i++;
        csvData[row[0]] = valuesObj;
    }
    return csvData;
}
exports.abilityCSV2KV = abilityCSV2KV;
function unitCSV2KV(listenPath) {
    let csv = fs.readFileSync(listenPath, 'utf-8');
    // 生成kv
    let csvData = {};
    let csvArr = csvParse(csv);
    const csvKey = csvArr[0];
    for (let i = 1; i < csvArr.length; i++) {
        const row = csvArr[i];
        if (row.length === 0 || row[0] === '' || row[0] === undefined) {
            continue;
        }
        let wearableCount = 1;
        let attachWearables = {};
        let valuesObj = {};
        // 读取多层结构
        let readBlock = function (index) {
            let block = {};
            for (let i = index + 1; i < row.length; i++) {
                const col = row[i];
                const key = csvKey[i];
                if (col === '') {
                    if (key.search('[{]') !== -1) {
                        let [_block, j] = readBlock(i);
                        i = j;
                        if (Object.keys(_block).length > 0) {
                            block[key.split('[{]')[0]] = _block;
                        }
                    }
                    else if (key.search('[}]') !== -1) {
                        return [block, i];
                    }
                    continue;
                }
                if (key === '') {
                    continue;
                }
                else {
                    block[key] = col;
                }
            }
        };
        for (let j = 1; j < row.length; j++) {
            const col = row[j];
            let key = csvKey[j];
            // 跳过空值
            if (col === '') {
                // 处理多层结构
                if (key.search('[{]') !== -1) {
                    let [block, i] = readBlock(j);
                    j = i;
                    if (Object.keys(block).length > 0) {
                        valuesObj[key.split('[{]')[0]] = block;
                    }
                }
                continue;
            }
            // special值特殊处理
            if (key === 'AttachWearables') {
                key = wearableCount.toString();
                let value = col;
                attachWearables[key] = {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    ItemDef: value
                };
                wearableCount++;
                // 一些Creature特殊键值
            }
            else if (key === 'CanRespawn' || key === 'DisableClumpingBehavior' || key === 'UsesGestureBasedAttackAnimation' || key === 'ShouldDoFlyHeightVisual' || key === 'IsHybridFlyer') {
                if (valuesObj.Creature === undefined) {
                    valuesObj.Creature = {};
                }
                valuesObj.Creature[key] = col;
                continue;
                // 跳过没有key的值
            }
            else if (key === '') {
                continue;
            }
            else {
                valuesObj[key] = col;
            }
        }
        if (Object.keys(attachWearables).length > 0) {
            if (valuesObj.Creature === undefined) {
                valuesObj.Creature = {};
            }
            valuesObj.Creature.AttachWearables = attachWearables;
        }
        csvData[row[0]] = valuesObj;
    }
    return csvData;
}
exports.unitCSV2KV = unitCSV2KV;


/***/ }),
/* 7 */
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getRootPath = void 0;
const vscode = __webpack_require__(1);
function getRootPath() {
    const folders = vscode.workspace.workspaceFolders;
    if (folders !== undefined) {
        return folders[0].uri.fsPath;
    }
    else {
        return;
    }
}
exports.getRootPath = getRootPath;


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.changeStatusBarState = exports.refreshStatusBarMessage = exports.showStatusBarMessage = exports.getStatusBarItem = exports.statusBarItemInit = exports.StatusBarState = void 0;
const vscode = __webpack_require__(1);
const enum_1 = __webpack_require__(10);
const localize_1 = __webpack_require__(11);
let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
/** 最多信息条数 */
const MAX_MESSAGE_COUNT = 20;
/** 信息列表 */
let messageList = [];
/** 信息索引 */
let messageIndex = 0;
let output;
let showOutput = false;
var StatusBarState;
(function (StatusBarState) {
    StatusBarState["ALL_DONE"] = "$(check-all)";
    StatusBarState["LOADING"] = "$(loading~spin)";
})(StatusBarState = exports.StatusBarState || (exports.StatusBarState = {}));
// 通知栏
async function statusBarItemInit(context) {
    statusBarItem.text = '$(loading~spin) ' + (0, localize_1.localize)("pluginNameLite");
    context.subscriptions.push(statusBarItem);
    output = vscode.window.createOutputChannel((0, localize_1.localize)("pluginNameLite"));
    statusBarItem.show();
    context.subscriptions.push(vscode.commands.registerCommand("war3tools.showOutput", async (data) => {
        if (showOutput) {
            showOutput = !showOutput;
            output.hide();
        }
        else {
            showOutput = !showOutput;
            output.show();
        }
    }));
    statusBarItem.command = "war3tools.showOutput";
}
exports.statusBarItemInit = statusBarItemInit;
function getStatusBarItem() {
    return statusBarItem;
}
exports.getStatusBarItem = getStatusBarItem;
function showStatusBarMessage(text, hideAfterTimeout = enum_1.ENUM_STATUS_BAR_MESSAGE_TIMEOUT) {
    recordMessage(text);
    if (hideAfterTimeout === -1) {
        vscode.window.setStatusBarMessage(text);
    }
    vscode.window.setStatusBarMessage(text, hideAfterTimeout * 1000);
    // console.log(text);
    output.appendLine(text);
    return messageIndex - 1;
}
exports.showStatusBarMessage = showStatusBarMessage;
/** 更新文本 */
function refreshStatusBarMessage(index, text, hideAfterTimeout = enum_1.ENUM_STATUS_BAR_MESSAGE_TIMEOUT) {
    if (messageList[index]) {
        messageList[index] = text;
    }
    // console.log(text);
    output.appendLine(text);
    vscode.window.setStatusBarMessage(text, hideAfterTimeout * 1000);
}
exports.refreshStatusBarMessage = refreshStatusBarMessage;
/** 记录信息 */
function recordMessage(text) {
    messageList[messageIndex] = text;
    messageIndex++;
    let tooltip = `**${(0, localize_1.localize)("message_notification")}**  \n`;
    for (let index = Math.max(messageIndex - MAX_MESSAGE_COUNT, 0); index < messageIndex; index++) {
        const message = messageList[index];
        tooltip += "  \n" + message;
    }
    statusBarItem.tooltip = new vscode.MarkdownString(tooltip);
}
/** 改变状态 */
function changeStatusBarState(state) {
    statusBarItem.text = state + " " + (0, localize_1.localize)("pluginNameLite");
}
exports.changeStatusBarState = changeStatusBarState;


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ENUM_STATUS_BAR_MESSAGE_TIMEOUT = void 0;
/** 消息栏信息过期时间 */
exports.ENUM_STATUS_BAR_MESSAGE_TIMEOUT = 5;


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.hasReverseLocalize = exports.hasLocalize = exports.reverseLocalize = exports.localize = exports.localizeInit = void 0;
const vscode = __webpack_require__(1);
const readFile_1 = __webpack_require__(12);
let langData;
let reverseLangData;
var LangEnum;
(function (LangEnum) {
    LangEnum["schinese"] = "zh-cn";
    LangEnum["english"] = "en";
})(LangEnum || (LangEnum = {}));
;
async function localizeInit(context) {
    langData = {
        [LangEnum.schinese]: JSON.parse(await (0, readFile_1.readFile)(vscode.Uri.joinPath(context.extensionUri, "package.nls.zh-cn.json"))),
        [LangEnum.english]: JSON.parse(await (0, readFile_1.readFile)(vscode.Uri.joinPath(context.extensionUri, "package.nls.json")))
    };
    reverseLangData = {
        [LangEnum.schinese]: { ...langData[LangEnum.schinese] },
        [LangEnum.english]: { ...langData[LangEnum.english] }
    };
    for (const key in reverseLangData[LangEnum.schinese]) {
        let value = reverseLangData[LangEnum.schinese][key];
        reverseLangData[LangEnum.schinese][value] = key;
        delete reverseLangData[LangEnum.schinese][key];
    }
    for (const key in reverseLangData[LangEnum.english]) {
        let value = reverseLangData[LangEnum.english][key];
        reverseLangData[LangEnum.english][value] = key;
        delete reverseLangData[LangEnum.english][key];
    }
}
exports.localizeInit = localizeInit;
/**
 * 获取本地化文本
 */
function localize(text, dialogVariables, language) {
    if (langData === undefined || text === undefined) {
        return text;
    }
    let langType = language ?? vscode.env.language === "zh-cn" ? "zh-cn" : "en";
    let langInfo = langData[langType];
    if (langInfo[text] !== undefined) {
        return langInfo[text];
    }
    if (dialogVariables) {
        for (const key in dialogVariables) {
            const value = dialogVariables[key];
            text.replace(/\${' + key + '}/g, value);
        }
    }
    return text;
}
exports.localize = localize;
/**
 * 逆向获取本地化文本
 */
function reverseLocalize(text, dialogVariables, language) {
    if (reverseLangData === undefined || text === undefined) {
        return text;
    }
    let langType = language ?? vscode.env.language === "zh-cn" ? "zh-cn" : "en";
    let langInfo = reverseLangData[langType];
    if (langInfo[text] !== undefined) {
        return langInfo[text];
    }
    if (dialogVariables) {
        for (const key in dialogVariables) {
            const value = dialogVariables[key];
            text.replace(/\${' + key + '}/g, value);
        }
    }
    return text;
}
exports.reverseLocalize = reverseLocalize;
/** 是否拥有本地化 */
function hasLocalize(text, language) {
    if (langData === undefined) {
        return false;
    }
    let langType = language ?? vscode.env.language === "zh-cn" ? "zh-cn" : "en";
    let langInfo = langData[langType];
    if (langInfo[text] !== undefined) {
        return true;
    }
    return false;
}
exports.hasLocalize = hasLocalize;
/** 逆向查找是否拥有本地化 */
function hasReverseLocalize(text, language) {
    if (reverseLangData === undefined) {
        return false;
    }
    let langType = language ?? vscode.env.language === "zh-cn" ? "zh-cn" : "en";
    let langInfo = reverseLangData[langType];
    if (langInfo[text] !== undefined) {
        return true;
    }
    return false;
}
exports.hasReverseLocalize = hasReverseLocalize;


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.readFile = void 0;
const util_1 = __webpack_require__(13);
const vscode_1 = __webpack_require__(1);
/**
 * 读取插件内的文件
 */
async function readFile(uri) {
    let array = await vscode_1.workspace.fs.readFile(uri);
    return new util_1.TextDecoder().decode(array);
}
exports.readFile = readFile;


/***/ }),
/* 13 */
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.dirExists = exports.makeDir = exports.getPathInfo = void 0;
const fs = __webpack_require__(5);
const path = __webpack_require__(4);
/**
 * 读取路径信息
 * @param {string} path 路径
 */
function getPathInfo(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                resolve(false);
            }
            else {
                resolve(stats);
            }
        });
    });
}
exports.getPathInfo = getPathInfo;
/**
 * 创建路径
 * @param {string} dir 路径
 */
async function makeDir(dir) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, err => {
            if (err) {
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
}
exports.makeDir = makeDir;
/**
 * 路径是否存在，不存在则创建
 * @param {string} dir 路径
 */
async function dirExists(dir) {
    let isExists = await getPathInfo(dir);
    //如果该路径且不是文件，返回true
    if (isExists && isExists !== true && isExists.isDirectory()) {
        return true;
    }
    else if (isExists) { //如果该路径存在但是文件，返回false
        return false;
    }
    //如果该路径不存在
    let tempDir = path.parse(dir).dir; //拿到上级路径
    //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
    let status = await dirExists(tempDir);
    let mkdirStatus;
    if (status) {
        mkdirStatus = await makeDir(dir);
    }
    return mkdirStatus;
}
exports.dirExists = dirExists;


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.writeKeyValueLua = exports.obj2Lua = void 0;
const os = __webpack_require__(7);
const isNumber_1 = __webpack_require__(16);
function obj2Lua(obj) {
    let data = writeKeyValueLua(obj);
    data = "return {\n" + data + "\n}";
    return data;
}
exports.obj2Lua = obj2Lua;
function writeKeyValueLua(obj, depth = 1, tab = 12) {
    var str = '';
    if (obj === null || obj === undefined) {
        return str;
    }
    // 添加制表符
    function addDepthTab(depth, addString) {
        var tab = '';
        for (let d = 0; d < depth; d++) {
            tab += '\t';
        }
        tab += addString;
        return tab;
    }
    // 添加key与value之间制表符
    function addIntervalTab(depth, key, nTab = 12) {
        var tab = '';
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
        }
        else if (typeof (value) === 'string') {
            str += addDepthTab(depth, '["' + key + '"] = ');
            if (value.indexOf(" ") != -1) {
                str += '{' + value.replace(/\s/g, ",") + '},' + os.EOL;
            }
            else if ((0, isNumber_1.isNumber)(value)) {
                str += value + "," + os.EOL;
            }
            else {
                str += '"' + value + '",' + os.EOL;
            }
        }
        else {
            str += addDepthTab(depth, '["' + key + '"] = {' + os.EOL);
            str += writeKeyValueLua(value, depth + 1);
            str += addDepthTab(depth, '},' + os.EOL);
        }
    }
    return str;
}
exports.writeKeyValueLua = writeKeyValueLua;


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isNumber = void 0;
function isNumber(s) {
    let reg = /^(-?\d+)(\.\d+)?$/;
    if (reg.test(s)) {
        return true;
    }
    return false;
}
exports.isNumber = isNumber;


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.init = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = __webpack_require__(1);
const listenerAbilityExcel_1 = __webpack_require__(18);
const listenerUnitExcel_1 = __webpack_require__(23);
const statusBar_1 = __webpack_require__(9);
const localize_1 = __webpack_require__(11);
const event_1 = __webpack_require__(2);
/** 模块列表 */
const moduleList = {
    // "localizeInit": localizeInit,
    // "statusBarItemInit": statusBarItemInit,
    "listenerAbilityExcelInit": listenerAbilityExcel_1.listenerAbilityExcelInit,
    "listenerUnitExcelInit": listenerUnitExcel_1.listenerUnitExcelInit,
};
/** 跳过的模块对应的用户设置 */
const skipModuleList = {
    "addonInfoInit": "addon_info",
};
let eventID;
const configName = "war3-tools.A1.module_list";
/** 用户设置 */
let moduleListConfig = vscode.workspace.getConfiguration().get(configName);
/**
 * 进行初始化操作
 * @param context
 */
async function init(context) {
    // 监听配置变更
    if (eventID === undefined) {
        eventID = event_1.EventManager.listenToEvent(event_1.EventType.EVENT_ON_DID_CHANGE_CONFIGURATION, async (event) => {
            if (!event.affectsConfiguration(configName)) {
                return;
            }
            let timeRecord = (new Date()).valueOf();
            let newModuleListConfig = vscode.workspace.getConfiguration().get(configName);
            const keys = Object.keys(moduleList);
            for (let i = 0; i < keys.length; i++) {
                const moduleName = keys[i];
                if (newModuleListConfig) {
                    if (isSkipModule(moduleName) && newModuleListConfig[skipModuleList[moduleName]] !== false) {
                        let messageIndex = (0, statusBar_1.showStatusBarMessage)(`[${i + 1}/${keys.length}]${(0, localize_1.localize)("loading")}：${(0, localize_1.localize)(moduleName)}`, 20);
                        await moduleList[moduleName](context);
                        (0, statusBar_1.refreshStatusBarMessage)(messageIndex, `[${i + 1}/${keys.length}]${(0, localize_1.localize)("load_complete")}：${(0, localize_1.localize)(moduleName)}，${(0, localize_1.localize)("time_consuming")}：${(new Date()).valueOf() - timeRecord}${(0, localize_1.localize)("millisecond")}`, 20);
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
                (0, statusBar_1.showStatusBarMessage)(`[${i + 1}/${keys.length}]${(0, localize_1.localize)("skip_disabled_modules")}：${(0, localize_1.localize)(moduleName)}`);
                continue;
            }
        }
        let messageIndex = (0, statusBar_1.showStatusBarMessage)(`[${i + 1}/${keys.length}]${(0, localize_1.localize)("loading")}：${(0, localize_1.localize)(moduleName)}`, 20);
        await moduleList[moduleName](context);
        (0, statusBar_1.refreshStatusBarMessage)(messageIndex, `[${i + 1}/${keys.length}]${(0, localize_1.localize)("load_complete")}：${(0, localize_1.localize)(moduleName)}，${(0, localize_1.localize)("time_consuming")}：${(new Date()).valueOf() - timeRecord}${(0, localize_1.localize)("millisecond")}`, 20);
        timeRecord = (new Date()).valueOf();
    }
    (0, statusBar_1.showStatusBarMessage)((0, localize_1.localize)("allLoaded"), 20);
    (0, statusBar_1.getStatusBarItem)().text = "$(check-all) " + (0, localize_1.localize)("pluginNameLite");
}
exports.init = init;
/** 禁用模块判断 */
function isSkipModule(moduleName) {
    if (skipModuleList[moduleName] !== undefined && moduleListConfig != undefined && moduleListConfig[skipModuleList[moduleName]] === false) {
        return true;
    }
    return false;
}


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.listenerAbilityExcelInit = void 0;
const vscode = __webpack_require__(1);
const fs = __webpack_require__(5);
const path = __webpack_require__(4);
const node_watch_1 = __webpack_require__(19);
const event_1 = __webpack_require__(2);
const getRootPath_1 = __webpack_require__(8);
const cmdExcel2KV_1 = __webpack_require__(3);
const csvUtils_1 = __webpack_require__(6);
const statusBar_1 = __webpack_require__(9);
const objToLua_1 = __webpack_require__(15);
let eventID;
let fileWatcher;
const configName = "war3-tools.A1.listener";
let config;
/** 监听技能excel变更 */
function listenerAbilityExcelInit(context) {
    config = getConfiguration();
    if (getConfiguration()) {
        startWatch(context);
    }
    if (eventID === undefined) {
        eventID = event_1.EventManager.listenToEvent(event_1.EventType.EVENT_ON_DID_CHANGE_CONFIGURATION, (event) => {
            if (!event.affectsConfiguration(configName) || getConfiguration() === config) {
                return;
            }
            config = getConfiguration();
            if (getConfiguration()) {
                stopWatch();
                startWatch(context);
            }
            else {
                stopWatch();
            }
        });
    }
}
exports.listenerAbilityExcelInit = listenerAbilityExcelInit;
/** 开始监听 */
function startWatch(context) {
    if (fileWatcher === undefined) {
        const rootPath = (0, getRootPath_1.getRootPath)();
        if (rootPath) {
            (0, statusBar_1.showStatusBarMessage)("[监听目录]：技能excel");
            let abilityExcelConfig = vscode.workspace.getConfiguration().get('war3-tools.A2.AbilityExcel');
            fileWatcher = (0, node_watch_1.default)(rootPath, { recursive: true, filter: /\.csv$/ }, function (evt, name) {
                if (abilityExcelConfig) {
                    (0, cmdExcel2KV_1.eachExcelConfig)(abilityExcelConfig, (kvDir, excelDir) => {
                        if (path.normalize(excelDir) == path.normalize(path.dirname(name)).replace("\\csv", "")) {
                            const kvName = path.join(kvDir, path.basename(name).replace(path.extname(name), '.lua'));
                            fs.writeFileSync(kvName, (0, objToLua_1.obj2Lua)((0, csvUtils_1.abilityCSV2KV)(name)));
                            (0, statusBar_1.showStatusBarMessage)("[excel导出kv]：" + path.basename(name).replace(path.extname(name), '.lua'));
                            // excel2kv(kvDir, path.join(excelDir, path.basename(name).replace(path.extname(name), ".xlsm")), abilityCSV2KV);
                            return false;
                        }
                    });
                }
            });
        }
        else {
            // vscode.window.showErrorMessage(`[${localize("listenerLocalizationInit")}]${localize("game_folder_no_found")}`);
        }
    }
}
/** 停止监听 */
function stopWatch() {
    if (fileWatcher) {
        (0, statusBar_1.showStatusBarMessage)("[停止监听目录]：技能excel");
        fileWatcher.close();
        fileWatcher = undefined;
    }
}
/** 是否开启监听 */
function getConfiguration() {
    let listenerConfig = vscode.workspace.getConfiguration().get(configName);
    if (listenerConfig) {
        return listenerConfig.ability_excel || false;
    }
}


/***/ }),
/* 19 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fs = __webpack_require__(5);
var path = __webpack_require__(4);
var util = __webpack_require__(13);
var events = __webpack_require__(20);

var hasNativeRecursive = __webpack_require__(21);
var is = __webpack_require__(22);

var EVENT_UPDATE = 'update';
var EVENT_REMOVE = 'remove';

var SKIP_FLAG = Symbol('skip');

function hasDup(arr) {
  return arr.some(function(v, i, self) {
    return self.indexOf(v) !== i;
  });
}

function unique(arr) {
  return arr.filter(function(v, i, self) {
    return self.indexOf(v) === i;
  });
}

// One level flat
function flat1(arr) {
  return arr.reduce(function(acc, v) {
    return acc.concat(v);
  }, []);
}

function assertEncoding(encoding) {
  if (encoding && encoding !== 'buffer' && !Buffer.isEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

function guard(fn) {
  if (is.func(fn)) {
    return function(arg, action) {
      if (fn(arg, false)) action();
    }
  }
  if (is.regExp(fn)) {
    return function(arg, action) {
      if (fn.test(arg)) action();
    }
  }
  return function(arg, action) {
    action();
  }
}

function composeMessage(names) {
  return names.map(function(n) {
    return is.exists(n)
      ? [EVENT_UPDATE, n]
      : [EVENT_REMOVE, n];
  });
}

function getMessages(cache) {
  var filtered = unique(cache);

  // Saving file from an editor? If so, assuming the
  // non-existed files in the cache are temporary files
  // generated by an editor and thus be filtered.
  var reg = /~$|^\.#|^##$/g;
  var hasSpecialChar = cache.some(function(c) {
    return reg.test(c);
  });

  if (hasSpecialChar) {
    var dup = hasDup(cache.map(function(c) {
      return c.replace(reg, '');
    }));
    if (dup) {
      filtered = filtered.filter(function(m) {
        return is.exists(m);
      });
    }
  }

  return composeMessage(filtered);
}

function debounce(info, fn) {
  var timer, cache = [];
  var encoding = info.options.encoding;
  var delay = info.options.delay;
  if (!is.number(delay)) {
    delay = 200;
  }
  function handle() {
    getMessages(cache).forEach(function(msg) {
      msg[1] = Buffer.from(msg[1]);
      if (encoding !== 'buffer') {
        msg[1] = msg[1].toString(encoding);
      }
      fn.apply(null, msg);
    });
    timer = null;
    cache = [];
  }
  return function(rawEvt, name) {
    cache.push(name);
    if (!timer) {
      timer = setTimeout(handle, delay);
    }
  }
}

function createDupsFilter() {
  var memo = {};
  return function(fn) {
    return function(evt, name) {
      memo[evt + name] = [evt, name];
      setTimeout(function() {
        Object.keys(memo).forEach(function(n) {
          fn.apply(null, memo[n]);
        });
        memo = {};
      });
    }
  }
}

function getSubDirectories(dir, fn, done = function() {}) {
  if (is.directory(dir)) {
    fs.readdir(dir, function(err, all) {
      if (err) {
        // don't throw permission errors.
        if (/^(EPERM|EACCES)$/.test(err.code)) {
          console.warn('Warning: Cannot access %s.', dir);
        } else {
          throw err;
        }
      }
      else {
        all.forEach(function(f) {
          var sdir = path.join(dir, f);
          if (is.directory(sdir)) fn(sdir);
        });
        done();
      }
    });
  } else {
    done();
  }
}

function semaphore(final) {
  var counter = 0;
  return function start() {
    counter++;
    return function stop() {
      counter--;
      if (counter === 0) final();
    };
  };
}

function nullCounter() {
  return function nullStop() {};
}

function shouldNotSkip(filePath, filter) {
  // watch it only if the filter is not function
  // or not being skipped explicitly.
  return !is.func(filter) || filter(filePath, SKIP_FLAG) !== SKIP_FLAG;
}

var deprecationWarning = util.deprecate(
  function() {},
  '(node-watch) First param in callback function\
  is replaced with event name since 0.5.0, use\
  `(evt, filename) => {}` if you want to get the filename'
);

function Watcher() {
  events.EventEmitter.call(this);
  this.watchers = {};
  this._isReady = false;
  this._isClosed = false;
}

util.inherits(Watcher, events.EventEmitter);

Watcher.prototype.expose = function() {
  var expose = {};
  var self = this;
  var methods = [
    'on', 'emit', 'once',
    'close', 'isClosed',
    'listeners', 'setMaxListeners', 'getMaxListeners',
    'getWatchedPaths'
  ];
  methods.forEach(function(name) {
    expose[name] = function() {
      return self[name].apply(self, arguments);
    }
  });
  return expose;
}

Watcher.prototype.isClosed = function() {
  return this._isClosed;
}

Watcher.prototype.close = function(fullPath) {
  var self = this;
  if (fullPath) {
    var watcher = this.watchers[fullPath];
    if (watcher && watcher.close) {
      watcher.close();
      delete self.watchers[fullPath];
    }
    getSubDirectories(fullPath, function(fpath) {
      self.close(fpath);
    });
  }
  else {
    Object.keys(self.watchers).forEach(function(fpath) {
      var watcher = self.watchers[fpath];
      if (watcher && watcher.close) {
        watcher.close();
      }
    });
    this.watchers = {};
  }
  // Do not close the Watcher unless all child watchers are closed.
  // https://github.com/yuanchuan/node-watch/issues/75
  if (is.emptyObject(self.watchers)) {
    // should emit once
    if (!this._isClosed) {
      this._isClosed = true;
      process.nextTick(emitClose, this);
    }
  }
}

Watcher.prototype.getWatchedPaths = function(fn) {
  if (is.func(fn)) {
    var self = this;
    if (self._isReady) {
      fn(Object.keys(self.watchers));
    } else {
      self.on('ready', function() {
        fn(Object.keys(self.watchers));
      });
    }
  }
}

function emitReady(self) {
  if (!self._isReady) {
    self._isReady = true;
    // do not call emit for 'ready' until after watch() has returned,
    // so that consumer can call on().
    process.nextTick(function () {
      self.emit('ready');
    });
  }
}

function emitClose(self) {
  self.emit('close');
}

Watcher.prototype.add = function(watcher, info) {
  var self = this;
  info = info || { fpath: '' };
  var watcherPath = path.resolve(info.fpath);
  this.watchers[watcherPath] = watcher;

  // Internal callback for handling fs.FSWatcher 'change' events
  var internalOnChange = function(rawEvt, rawName) {
    if (self.isClosed()) {
      return;
    }

    // normalise lack of name and convert to full path
    var name = rawName;
    if (is.nil(name)) {
      name = '';
    }
    name = path.join(info.fpath, name);

    if (info.options.recursive) {
      hasNativeRecursive(function(has) {
        if (!has) {
          var fullPath = path.resolve(name);
          // remove watcher on removal
          if (!is.exists(name)) {
            self.close(fullPath);
          }
          // watch new created directory
          else {
            var shouldWatch = is.directory(name)
              && !self.watchers[fullPath]
              && shouldNotSkip(name, info.options.filter);

            if (shouldWatch) {
              self.watchDirectory(name, info.options);
            }
          }
        }
      });
    }

    handlePublicEvents(rawEvt, name);
  };

  // Debounced based on the 'delay' option
  var handlePublicEvents = debounce(info, function (evt, name) {
    // watch single file
    if (info.compareName) {
      if (info.compareName(name)) {
        self.emit('change', evt, name);
      }
    }
    // watch directory
    else {
      var filterGuard = guard(info.options.filter);
      filterGuard(name, function() {
        if (self.flag) self.flag = '';
        else self.emit('change', evt, name);
      });
    }
  });

  watcher.on('error', function(err) {
    if (self.isClosed()) {
      return;
    }
    if (is.windows() && err.code === 'EPERM') {
      watcher.emit('change', EVENT_REMOVE, info.fpath && '');
      self.flag = 'windows-error';
      self.close(watcherPath);
    } else {
      self.emit('error', err);
    }
  });

  watcher.on('change', internalOnChange);
}

Watcher.prototype.watchFile = function(file, options, fn) {
  var parent = path.join(file, '../');
  var opts = Object.assign({}, options, {
    // no filter for single file
    filter: null,
    encoding: 'utf8'
  });

  // no need to watch recursively
  delete opts.recursive;

  var watcher = fs.watch(parent, opts);
  this.add(watcher, {
    type: 'file',
    fpath: parent,
    options: Object.assign({}, opts, {
      encoding: options.encoding
    }),
    compareName: function(n) {
      return is.samePath(n, file);
    }
  });

  if (is.func(fn)) {
    if (fn.length === 1) deprecationWarning();
    this.on('change', fn);
  }
}

Watcher.prototype.watchDirectory = function(dir, options, fn, counter = nullCounter) {
  var self = this;
  var done = counter();
  hasNativeRecursive(function(has) {
    // always specify recursive
    options.recursive = !!options.recursive;
    // using utf8 internally
    var opts = Object.assign({}, options, {
      encoding: 'utf8'
    });
    if (!has) {
      delete opts.recursive;
    }

    // check if it's closed before calling watch.
    if (self._isClosed) {
      done();
      return self.close();
    }

    var watcher = fs.watch(dir, opts);

    self.add(watcher, {
      type: 'dir',
      fpath: dir,
      options: options
    });

    if (is.func(fn)) {
      if (fn.length === 1) deprecationWarning();
      self.on('change', fn);
    }

    if (options.recursive && !has) {
      getSubDirectories(dir, function(d) {
        if (shouldNotSkip(d, options.filter)) {
          self.watchDirectory(d, options, null, counter);
        }
      }, counter());
    }

    done();
  });
}

function composeWatcher(watchers) {
  var watcher = new Watcher();
  var filterDups = createDupsFilter();
  var counter = watchers.length;

  watchers.forEach(function(w) {
    w.on('change', filterDups(function(evt, name) {
      watcher.emit('change', evt, name);
    }));
    w.on('error', function(err) {
      watcher.emit('error', err);
    });
    w.on('ready', function() {
      if (!(--counter)) {
        emitReady(watcher);
      }
    });
  });

  watcher.close = function() {
    watchers.forEach(function(w) {
      w.close();
    });
    process.nextTick(emitClose, watcher);
  }

  watcher.getWatchedPaths = function(fn) {
    if (is.func(fn)) {
      var promises = watchers.map(function(w) {
        return new Promise(function(resolve) {
          w.getWatchedPaths(resolve);
        });
      });
      Promise.all(promises).then(function(result) {
        var ret = unique(flat1(result));
        fn(ret);
      });
    }
  }

  return watcher.expose();
}

function watch(fpath, options, fn) {
  var watcher = new Watcher();

  if (is.buffer(fpath)) {
    fpath = fpath.toString();
  }

  if (!is.array(fpath) && !is.exists(fpath)) {
    watcher.emit('error',
      new Error(fpath + ' does not exist.')
    );
  }

  if (is.string(options)) {
    options = {
      encoding: options
    }
  }

  if (is.func(options)) {
    fn = options;
    options = {};
  }

  if (arguments.length < 2) {
    options = {};
  }

  if (options.encoding) {
    assertEncoding(options.encoding);
  } else {
    options.encoding = 'utf8';
  }

  if (is.array(fpath)) {
    if (fpath.length === 1) {
      return watch(fpath[0], options, fn);
    }
    var filterDups = createDupsFilter();
    return composeWatcher(unique(fpath).map(function(f) {
      var w = watch(f, options);
      if (is.func(fn)) {
        w.on('change', filterDups(fn));
      }
      return w;
    }));
  }

  if (is.file(fpath)) {
    watcher.watchFile(fpath, options, fn);
    emitReady(watcher);
  }

  else if (is.directory(fpath)) {
    var counter = semaphore(function () {
      emitReady(watcher);
    });
    watcher.watchDirectory(fpath, options, fn, counter);
  }

  return watcher.expose();
}

module.exports = watch;
module.exports["default"] = watch;


/***/ }),
/* 20 */
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),
/* 21 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fs = __webpack_require__(5);
var os = __webpack_require__(7);
var path = __webpack_require__(4);
var is = __webpack_require__(22);

var IS_SUPPORT;
var TEMP_DIR = os.tmpdir && os.tmpdir()
  || process.env.TMPDIR
  || process.env.TEMP
  || process.cwd();

function TempStack() {
  this.stack = [];
}

TempStack.prototype = {
  create: function(type, base) {
    var name = path.join(base,
      'node-watch-' + Math.random().toString(16).substr(2)
    );
    this.stack.push({ name: name, type: type });
    return name;
  },
  write: function(/* file */) {
    for (var i = 0; i < arguments.length; ++i) {
      fs.writeFileSync(arguments[i], ' ');
    }
  },
  mkdir: function(/* dirs */) {
    for (var i = 0; i < arguments.length; ++i) {
      fs.mkdirSync(arguments[i]);
    }
  },
  cleanup: function(fn) {
    try {
      var temp;
      while ((temp = this.stack.pop())) {
        var type = temp.type;
        var name = temp.name;
        if (type === 'file' && is.file(name)) {
          fs.unlinkSync(name);
        }
        else if (type === 'dir' && is.directory(name)) {
          fs.rmdirSync(name);
        }
      }
    }
    finally {
      if (is.func(fn)) fn();
    }
  }
};

var pending = false;

module.exports = function hasNativeRecursive(fn) {
  if (!is.func(fn)) {
    return false;
  }
  if (IS_SUPPORT !== undefined) {
    return fn(IS_SUPPORT);
  }

  if (!pending) {
    pending = true;
  }
  // check again later
  else {
    return setTimeout(function() {
      hasNativeRecursive(fn);
    }, 300);
  }

  var stack = new TempStack();
  var parent = stack.create('dir', TEMP_DIR);
  var child = stack.create('dir', parent);
  var file = stack.create('file', child);

  stack.mkdir(parent, child);

  var options = { recursive: true };
  var watcher;

  try {
    watcher = fs.watch(parent, options);
  } catch (e) {
    if (e.code == 'ERR_FEATURE_UNAVAILABLE_ON_PLATFORM') {
      return fn(IS_SUPPORT = false);
    } else {
      throw e;
    }
  }

  if (!watcher) {
    return false;
  }

  var timer = setTimeout(function() {
    watcher.close();
    stack.cleanup(function() {
      fn(IS_SUPPORT = false);
    });
  }, 200);

  watcher.on('change', function(evt, name) {
    if (path.basename(file) === path.basename(name)) {
      watcher.close();
      clearTimeout(timer);
      stack.cleanup(function() {
        fn(IS_SUPPORT = true);
      });
    }
  });
  stack.write(file);
}


/***/ }),
/* 22 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fs = __webpack_require__(5);
var path = __webpack_require__(4);
var os = __webpack_require__(7);

function matchObject(item, str) {
  return Object.prototype.toString.call(item)
    === '[object ' + str + ']';
}

function checkStat(name, fn) {
  try {
    return fn(name);
  } catch (err) {
    if (/^(ENOENT|EPERM|EACCES)$/.test(err.code)) {
      if (err.code !== 'ENOENT') {
        console.warn('Warning: Cannot access %s', name);
      }
      return false;
    }
    throw err;
  }
}

var is = {
  nil: function(item) {
    return item == null;
  },
  array: function(item) {
    return Array.isArray(item);
  },
  emptyObject: function(item) {
    for (var key in item) {
      return false;
    }
    return true;
  },
  buffer: function(item) {
    return Buffer.isBuffer(item);
  },
  regExp: function(item) {
    return matchObject(item, 'RegExp');
  },
  string: function(item) {
    return matchObject(item, 'String');
  },
  func: function(item) {
    return typeof item === 'function';
  },
  number: function(item) {
    return matchObject(item, 'Number');
  },
  exists: function(name) {
    return fs.existsSync(name);
  },
  file: function(name) {
    return checkStat(name, function(n) {
      return fs.statSync(n).isFile()
    });
  },
  samePath: function(a, b) {
    return path.resolve(a) === path.resolve(b);
  },
  directory: function(name) {
    return checkStat(name, function(n) {
      return fs.statSync(n).isDirectory()
    });
  },
  symbolicLink: function(name) {
    return checkStat(name, function(n) {
      return fs.lstatSync(n).isSymbolicLink();
    });
  },
  windows: function() {
    return os.platform() === 'win32';
  }
};

module.exports = is;


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.listenerUnitExcelInit = void 0;
const vscode = __webpack_require__(1);
const fs = __webpack_require__(5);
const path = __webpack_require__(4);
const node_watch_1 = __webpack_require__(19);
const event_1 = __webpack_require__(2);
const getRootPath_1 = __webpack_require__(8);
const cmdExcel2KV_1 = __webpack_require__(3);
const csvUtils_1 = __webpack_require__(6);
const statusBar_1 = __webpack_require__(9);
const kvUtils_1 = __webpack_require__(24);
let eventID;
let fileWatcher;
const configName = "war3-tools.A1.listener";
let config;
/** 监听技能excel变更 */
function listenerUnitExcelInit(context) {
    if (getConfiguration()) {
        startWatch(context);
    }
    if (eventID === undefined) {
        eventID = event_1.EventManager.listenToEvent(event_1.EventType.EVENT_ON_DID_CHANGE_CONFIGURATION, (event) => {
            if (!event.affectsConfiguration(configName) || getConfiguration() === config) {
                return;
            }
            config = getConfiguration();
            if (getConfiguration()) {
                stopWatch();
                startWatch(context);
            }
            else {
                stopWatch();
            }
        });
    }
}
exports.listenerUnitExcelInit = listenerUnitExcelInit;
/** 开始监听 */
function startWatch(context) {
    if (fileWatcher === undefined) {
        const rootPath = (0, getRootPath_1.getRootPath)();
        if (rootPath) {
            (0, statusBar_1.showStatusBarMessage)("[监听目录]：单位excel");
            let unitExcelConfig = vscode.workspace.getConfiguration().get('war3-tools.A2.UnitExcel');
            fileWatcher = (0, node_watch_1.default)(rootPath, { recursive: true, filter: /\.csv$/ }, function (evt, name) {
                if (unitExcelConfig) {
                    (0, cmdExcel2KV_1.eachExcelConfig)(unitExcelConfig, (kvDir, excelDir) => {
                        if (path.normalize(excelDir) == path.normalize(path.dirname(name)).replace("\\csv", "")) {
                            const kvName = path.join(kvDir, path.basename(name).replace(path.extname(name), '.lua'));
                            fs.writeFileSync(kvName, (0, kvUtils_1.writeKeyValue)({ KeyValue: (0, csvUtils_1.unitCSV2KV)(name) }));
                            (0, statusBar_1.showStatusBarMessage)("[excel导出kv]：" + path.basename(name).replace(path.extname(name), '.lua'));
                            // excel2kv(kvDir, excelDir, unitCSV2KV);
                            return false;
                        }
                    });
                }
            });
        }
        else {
            // vscode.window.showErrorMessage(`[${localize("listenerLocalizationInit")}]${localize("game_folder_no_found")}`);
        }
    }
}
/** 停止监听 */
function stopWatch() {
    if (fileWatcher) {
        (0, statusBar_1.showStatusBarMessage)("[停止监听目录]：单位excel");
        fileWatcher.close();
        fileWatcher = undefined;
    }
}
/** 是否开启监听 */
function getConfiguration() {
    let listenerConfig = vscode.workspace.getConfiguration().get(configName);
    if (listenerConfig) {
        return listenerConfig.unit_excel || false;
    }
}


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getBaseInfo = exports.writeKeyValue = exports.replaceKeyValue = exports.overrideKeyValue = exports.getKeyValueObjectByIndex = exports.removeComment = exports.readKeyValueWithBaseIncludePath = exports.readKeyValueWithBase = exports.readKeyValue3 = exports.readKeyValue2 = void 0;
const fs = __webpack_require__(5);
const os = __webpack_require__(7);
const pathUtils_1 = __webpack_require__(14);
const isNumber_1 = __webpack_require__(16);
// 读取kv2格式为object(兼容kv3)
function readKeyValue2(kvdata, bRemoveComment = true, bOverride = true) {
    if (bRemoveComment === true) {
        kvdata = removeComment(kvdata);
    }
    // kvdata = kvdata.replace(/\t/g,'').replace(' ','').replace(/\r\n/g,'');
    kvdata = kvdata.replace(/\t/g, '').replace(/\r\n/g, '');
    let kvObj = {};
    let overrideIndex = 1;
    for (let i = 0; i < kvdata.length; i++) {
        let substr = kvdata[i];
        if (substr === '"') {
            let key;
            let value;
            [key, value, i] = readKeyValue(i);
            // 如果有重复值
            if (kvObj[key] === undefined || bOverride === true) {
                kvObj[key] = value;
            }
            else {
                kvObj[key + overrideIndex] = value;
                overrideIndex++;
            }
            continue;
        }
        if (substr === '#' && kvdata.substr(i, 5) === '#base') {
            i = getBase(i);
            continue;
        }
    }
    return kvObj;
    // 读取一对键对
    function readKeyValue(startIndex) {
        let key = '';
        let value;
        let state = 'NONE';
        for (let i = startIndex; i < kvdata.length; i++) {
            let substr = kvdata[i];
            // 读取key
            if (substr === '"' && state === 'NONE') {
                [key, i] = getContent(i);
                state = 'VALUE';
                continue;
            }
            // 读取value
            if (substr === '"' && state === 'VALUE') {
                [value, i] = getContent(i);
                return [key, value, i];
            }
            // 读取table
            if (substr === '{' && state === 'VALUE') {
                [value, i] = getTable(i);
                return [key, value, i];
            }
        }
    }
    function getTable(startIndex) {
        let kv = {};
        let state = 'NONE';
        let overrideIndex = 1;
        for (let i = startIndex; i < kvdata.length; i++) {
            let substr = kvdata[i];
            if (substr === '{' && state === 'NONE') {
                state = 'READ';
                continue;
            }
            // 插入kv3
            if (substr === '<' && kvdata.substr(i, 8) === '<!-- kv3' && state === 'READ') {
                let [block, newIndex] = getKv3Block(i);
                kv = readKeyValue3(block);
                i = newIndex;
                continue;
            }
            if (substr === '"' && state === 'READ') {
                let key;
                let value;
                [key, value, i] = readKeyValue(i); // 如果有重复值
                if (kv[key] === undefined || bOverride === true) {
                    kv[key] = value;
                }
                else {
                    kv[key + overrideIndex] = value;
                    overrideIndex++;
                }
                continue;
            }
            if (substr === '}' && state === 'READ') {
                return [kv, i];
            }
        }
    }
    // 获取引号里的内容
    function getContent(startIndex) {
        let content = '';
        let state = 'NONE';
        for (let i = startIndex; i < kvdata.length; i++) {
            let substr = kvdata[i];
            // 跳过转义符
            if (substr === '\\' && kvdata[i + 1] === '"') {
                content += substr;
                i++;
                continue;
            }
            if (substr === '"' && state === 'NONE') {
                state = 'READ';
                continue;
            }
            if (state === 'READ') {
                if (substr === '"') {
                    return [content, i];
                }
                else {
                    content += substr;
                }
            }
        }
    }
    // 获得kv3块
    function getKv3Block(startIndex) {
        let block = '';
        let left = 0;
        let right = 0;
        let state = 'NONE';
        for (let i = startIndex; i < kvdata.length; i++) {
            let substr = kvdata[i];
            if (state === 'NONE' && substr === '<') {
                state = 'HEAD';
                continue;
            }
            if (state === 'HEAD') {
                if (substr === '>') {
                    state = 'NONE';
                }
                continue;
            }
            block += substr;
            if (substr === '{') {
                left++;
            }
            if (substr === '}') {
                right++;
                if (left === right) {
                    return [block, i];
                }
            }
        }
    }
    // #base
    function getBase(startIndex) {
        let path = '';
        let state = 'NONE';
        for (let i = startIndex; i < kvdata.length; i++) {
            let substr = kvdata[i];
            if (substr === '#') {
                state = 'START';
                continue;
            }
            if (substr === '"' && state === 'START') {
                state = 'READ';
                continue;
            }
            if (state === 'READ') {
                if (substr === '"') {
                    return i;
                }
                else {
                    path += substr;
                    continue;
                }
            }
        }
    }
}
exports.readKeyValue2 = readKeyValue2;
// 读取kv3格式为object
function readKeyValue3(kvdata) {
    kvdata = kvdata.replace(/<!-- kv3.*-->/, '').replace(/\t/g, '').replace(/\s+/g, '').replace(/\r\n/g, '');
    // kvdata = kvdata.replace(/\t/g,'').replace(/\r\n/g,'');
    let kvObj = [];
    for (let i = 0; i < kvdata.length; i++) {
        let substr = kvdata[i];
        if (substr === '{') {
            let [obj, newLine] = readTable(i);
            kvObj.push(obj);
            i = newLine;
            continue;
        }
    }
    return kvObj;
    // 读取一对中括号里面的内容
    function readTable(startIndex) {
        let kv = {};
        let key = '';
        let value = '';
        let state = 'NONE';
        for (let i = startIndex; i < kvdata.length; i++) {
            let substr = kvdata[i];
            if (substr === '{' && state === 'NONE') {
                state = 'KEY';
                continue;
            }
            if (substr === '}') {
                return [kv, i];
            }
            if (state === 'KEY') {
                if (substr === '=') {
                    state = 'VALUE';
                    continue;
                }
                else {
                    key += substr;
                    continue;
                }
            }
            if (state === 'VALUE') {
                if (kvdata.substr(i, 5) === "false") {
                    kv[key] = "false";
                    key = '';
                    value = '';
                    state = 'KEY';
                    i = i + 4;
                    continue;
                }
                if (kvdata.substr(i, 4) === "true") {
                    kv[key] = "true";
                    key = '';
                    value = '';
                    state = 'KEY';
                    i = i + 3;
                    continue;
                }
                if (substr === '"') {
                    state = 'STRING';
                    continue;
                }
                else if (substr === '{') {
                    // 读表
                    let [obj, newLine] = readTable(i);
                    kv[key] = obj;
                    key = '';
                    value = '';
                    i = newLine;
                    state = 'KEY';
                    continue;
                }
                else if (substr === '[') {
                    // 读数组
                    let [obj, newLine] = readArray(i);
                    kv[key] = obj;
                    key = '';
                    value = '';
                    i = newLine;
                    state = 'KEY';
                    continue;
                }
                else if ((0, isNumber_1.isNumber)(substr) === true || substr === '.' || substr === '-') {
                    state = 'NUMBER';
                }
            }
            if (state === 'STRING') {
                if (substr === '"') {
                    kv[key] = value;
                    key = '';
                    value = '';
                    state = 'KEY';
                    continue;
                }
                else {
                    value += substr;
                    continue;
                }
            }
            if (state === 'NUMBER') {
                if ((0, isNumber_1.isNumber)(substr) === true || substr === '.' || substr === '-') {
                    value += substr;
                    continue;
                }
                else {
                    kv[key] = value;
                    key = '';
                    value = '';
                    i--;
                    state = 'KEY';
                    continue;
                }
            }
        }
    }
    // 读数组
    function readArray(startIndex) {
        let arr = [];
        let state = 'NONE';
        let value = '';
        for (let i = startIndex; i < kvdata.length; i++) {
            let substr = kvdata[i];
            if ((substr === '[' || substr === ',') && state === 'NONE') {
                state = 'VALUE';
                continue;
            }
            if (substr === ']') {
                return [arr, i];
            }
            if (state === 'VALUE') {
                if (substr === '"') {
                    state = 'STRING';
                    continue;
                }
                else if (substr === '{') {
                    let [obj, newLine] = readTable(i);
                    arr.push(obj);
                    i = newLine;
                    state = 'NONE';
                    continue;
                }
                else {
                    state = 'NUMBER';
                }
            }
            if (state === 'STRING') {
                if (substr === '"') {
                    arr.push(value);
                    value = '';
                    i++;
                    state = 'VALUE';
                    continue;
                }
                else {
                    value += substr;
                    continue;
                }
            }
            if (state === 'NUMBER') {
                if (substr === ',') {
                    arr.push(value);
                    value = '';
                    state = 'VALUE';
                    continue;
                }
                else {
                    value += substr;
                    continue;
                }
            }
        }
    }
}
exports.readKeyValue3 = readKeyValue3;
// 读取kv2格式为object（#base）
async function readKeyValueWithBase(fullPath) {
    // 获取名字
    let fileName = fullPath.split('/').pop() || '';
    let path = fullPath.split(fileName)[0];
    let kvdata = readKeyValue2(fs.readFileSync(fullPath, 'utf-8'));
    let kvtable = kvdata[Object.keys(kvdata)[0]];
    let kvString = fs.readFileSync(fullPath, 'utf-8');
    kvString = removeComment(kvString);
    const rows = kvString.split(os.EOL);
    for (let i = 0; i < rows.length; i++) {
        const lineText = rows[i];
        if (lineText.search(/#base ".*"/) !== -1) {
            let basePath = lineText.split('"')[1];
            // 找不到文件则跳过
            if (await (0, pathUtils_1.getPathInfo)(path + basePath) === false) {
                // vscode.window.showErrorMessage("文件缺失：" + path + basePath);
                continue;
            }
            let kv = readKeyValue2(fs.readFileSync(path + basePath, 'utf-8'));
            let table = kv[Object.keys(kv)[0]];
            for (const key in table) {
                const value = table[key];
                kvtable[key] = value;
            }
        }
        else {
            continue;
        }
    }
    return kvdata;
}
exports.readKeyValueWithBase = readKeyValueWithBase;
// 读取kv2格式为object（#base）包含路径信息
async function readKeyValueWithBaseIncludePath(fullPath) {
    let result = {};
    // 获取名字
    let fileName = fullPath.split('/').pop() || '';
    let path = fullPath.split(fileName)[0];
    let kvdata = readKeyValue2(fs.readFileSync(fullPath, 'utf-8'));
    // 用路径索引
    result[fullPath] = kvdata;
    // let kvtable = kvdata[Object.keys(kvdata)[0]];
    let kvString = fs.readFileSync(fullPath, 'utf-8');
    kvString = removeComment(kvString);
    const rows = kvString.split(os.EOL);
    for (let i = 0; i < rows.length; i++) {
        const lineText = rows[i];
        if (lineText.search(/#base ".*"/) !== -1) {
            let basePath = lineText.split('"')[1];
            // 找不到文件则跳过
            if (await (0, pathUtils_1.getPathInfo)(path + basePath) === false) {
                // vscode.window.showErrorMessage("文件缺失：" + path + basePath);
                continue;
            }
            let kv = readKeyValue2(fs.readFileSync(path + basePath, 'utf-8'));
            // 用路径索引
            result[path + basePath] = kv;
            let table = kv[Object.keys(kv)[0]];
            for (const key in table) {
                const value = table[key];
                // kvtable[key] = value;
            }
        }
        else {
            continue;
        }
    }
    return result;
}
exports.readKeyValueWithBaseIncludePath = readKeyValueWithBaseIncludePath;
function removeComment(data) {
    let newData = '';
    const rows = data.split(os.EOL);
    for (let i = 0; i < rows.length; i++) {
        const lineText = rows[i];
        let state = 0; // 用于处理引号内的//注释
        for (let char = 0; char < lineText.length; char++) {
            const substr = lineText[char];
            if (substr === '"') {
                state = (state === 0) ? 1 : 0;
            }
            //引号里的// 不处理
            if (state !== 1 && substr === '/' && lineText[char + 1] === '/') {
                break;
            }
            else {
                newData += substr;
            }
        }
        newData += os.EOL;
    }
    return newData;
}
exports.removeComment = removeComment;
// 获取从ReadKeyValue2、ReadKeyValue3、ReadKeyValueWithBase得到的对象里的第index个对象，用于去掉外层，使其与DOTA2读取的KV结构一致
function getKeyValueObjectByIndex(obj, index = 0) {
    if (typeof (obj) !== "object") {
        return;
    }
    return obj[Object.keys(obj)[index]];
}
exports.getKeyValueObjectByIndex = getKeyValueObjectByIndex;
// 对象覆盖
function overrideKeyValue(mainObj, obj) {
    if (typeof (mainObj) !== "object") {
        return obj;
    }
    if (typeof (obj) !== "object") {
        return mainObj;
    }
    for (const k in obj) {
        const v = obj[k];
        if (typeof (v) === "object") {
            mainObj[k] = overrideKeyValue(mainObj[k], v);
        }
        else {
            mainObj[k] = v;
        }
    }
    return mainObj;
}
exports.overrideKeyValue = overrideKeyValue;
// 对象替换
function replaceKeyValue(mainObj, obj) {
    if (typeof (mainObj) !== "object") {
        return obj;
    }
    if (typeof (obj) !== "object") {
        return mainObj;
    }
    for (const k in obj) {
        const v = obj[k];
        if (mainObj[k] !== undefined && mainObj[k] !== null) {
            if (typeof (v) === "object") {
                mainObj[k] = overrideKeyValue(mainObj[k], v);
            }
            else {
                mainObj[k] = v;
            }
        }
    }
    return mainObj;
}
exports.replaceKeyValue = replaceKeyValue;
// 写入kv
function writeKeyValue(obj, depth = 0, tab = 12) {
    var str = '';
    if (obj === null || obj === undefined) {
        return str;
    }
    // 添加制表符
    function addDepthTab(depth, addString) {
        var tab = '';
        for (let d = 0; d < depth; d++) {
            tab += '\t';
        }
        tab += addString;
        return tab;
    }
    // 添加key与value之间制表符
    function addIntervalTab(depth, key, nTab = 12) {
        var tab = '';
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
        }
        else if (typeof (value) === 'string') {
            str += addDepthTab(depth, '"' + key + '"');
            str += addIntervalTab(depth, key, tab);
            str += '"' + value + '"' + os.EOL;
        }
        else if (key === "precache" && typeof (value) === 'object') {
            // 特殊处理precache表
            str += addDepthTab(depth, '"' + key + '"' + os.EOL);
            str += addDepthTab(depth, '{' + os.EOL);
            for (const precacheType in value) {
                const typeList = value[precacheType];
                for (const precache of typeList) {
                    str += addDepthTab(depth + 1, '"' + precacheType + '"');
                    str += addIntervalTab(depth + 1, precacheType, tab);
                    str += '"' + precache + '"' + os.EOL;
                }
            }
            str += addDepthTab(depth, '}' + os.EOL);
        }
        else {
            str += addDepthTab(depth, '"' + key + '"' + os.EOL);
            str += addDepthTab(depth, '{' + os.EOL);
            str += writeKeyValue(value, depth + 1);
            str += addDepthTab(depth, '}' + os.EOL);
        }
    }
    return str;
}
exports.writeKeyValue = writeKeyValue;
/** 获取kv的#base路径列表 */
async function getBaseInfo(fullPath) {
    let kvString = fs.readFileSync(fullPath, 'utf-8');
    let result = [];
    kvString = removeComment(kvString);
    const rows = kvString.split(os.EOL);
    for (let i = 0; i < rows.length; i++) {
        const lineText = rows[i];
        if (lineText.search(/#base ".*"\s/) !== -1) {
            lineText.replace(/#base "(.*)"/, (a, b) => {
                result.push(b);
                return a;
            });
        }
        else {
            continue;
        }
    }
    return result;
}
exports.getBaseInfo = getBaseInfo;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const vscode = __webpack_require__(1);
const event_1 = __webpack_require__(2);
const cmdExcel2KV_1 = __webpack_require__(3);
const init_1 = __webpack_require__(17);
const statusBar_1 = __webpack_require__(9);
const localize_1 = __webpack_require__(11);
async function activate(context) {
    // 基础模块单独载入
    await (0, localize_1.localizeInit)(context);
    await (0, statusBar_1.statusBarItemInit)(context);
    // 进行其他初始化
    await (0, init_1.init)(context);
    vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
        await (0, init_1.init)(context);
    }, null, context.subscriptions);
    /** 分发配置变更 */
    vscode.workspace.onDidChangeConfiguration((event) => {
        event_1.EventManager.fireEvent(event_1.EventType.EVENT_ON_DID_CHANGE_CONFIGURATION, event);
    }, null, context.subscriptions);
    context.subscriptions.push(vscode.commands.registerCommand('war3-tools.excel_to_lua', () => (0, cmdExcel2KV_1.cmdExcel2KV)(context)));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map