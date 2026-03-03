"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var readline_1 = require("readline");
var path_1 = require("path");
var influxWriter_js_1 = require("../src/services/influxWriter.js");
var loader_js_1 = require("../src/config/loader.js");
function restore() {
    return __awaiter(this, void 0, void 0, function () {
        var config, influxWriter, health, csvPath, fileStream, rl, headerMap_1, count, skipped, _a, rl_1, rl_1_1, line, row, current, inQuote, i, char, requiredHeaders, missing, timeStr, category, controller, guid, property, title, unit, valueNumStr, value, timestamp, dataToWrite, e_1, e_2_1, err_1;
        var _b, e_2, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 19, , 20]);
                    console.log("Loading configuration...");
                    return [4 /*yield*/, (0, loader_js_1.loadConfig)()];
                case 1:
                    config = _e.sent();
                    console.log("Initializing InfluxWriter (URL: ".concat(config.influx.url, ", Bucket: ").concat(config.influx.bucket, ")..."));
                    influxWriter = new influxWriter_js_1.InfluxWriter(config.influx);
                    return [4 /*yield*/, influxWriter.checkHealth()];
                case 2:
                    health = _e.sent();
                    console.log("🚀 ~ restore ~ health:", health);
                    if (health.status !== "healthy") {
                        console.error("InfluxDB unhealthy: ".concat(health.message));
                        process.exit(1);
                    }
                    console.log("InfluxDB connection established.");
                    csvPath = path_1.default.resolve(process.cwd(), "../../2026-02-27-15-38 Chronograf Data.csv");
                    console.log("Reading CSV from: ".concat(csvPath));
                    if (!fs_1.default.existsSync(csvPath)) {
                        console.error("CSV file not found at ".concat(csvPath));
                        process.exit(1);
                    }
                    fileStream = fs_1.default.createReadStream(csvPath);
                    rl = readline_1.default.createInterface({
                        input: fileStream,
                        crlfDelay: Infinity,
                    });
                    headerMap_1 = null;
                    count = 0;
                    skipped = 0;
                    console.log("Starting import...");
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 11, 12, 17]);
                    _a = true, rl_1 = __asyncValues(rl);
                    _e.label = 4;
                case 4: return [4 /*yield*/, rl_1.next()];
                case 5:
                    if (!(rl_1_1 = _e.sent(), _b = rl_1_1.done, !_b)) return [3 /*break*/, 10];
                    _d = rl_1_1.value;
                    _a = false;
                    line = _d;
                    if (!line.trim())
                        return [3 /*break*/, 9];
                    row = [];
                    current = "";
                    inQuote = false;
                    for (i = 0; i < line.length; i++) {
                        char = line[i];
                        if (char === '"') {
                            inQuote = !inQuote;
                        }
                        else if (char === "," && !inQuote) {
                            row.push(cleanField(current));
                            current = "";
                        }
                        else {
                            current += char;
                        }
                    }
                    row.push(cleanField(current)); // Push the last field
                    if (!headerMap_1) {
                        // Parse header
                        headerMap_1 = {};
                        row.forEach(function (col, index) {
                            if (headerMap_1)
                                headerMap_1[col] = index;
                        });
                        console.log("Headers found:", Object.keys(headerMap_1));
                        requiredHeaders = [
                            "time",
                            "dali_property.category",
                            "dali_property.value_num",
                        ];
                        missing = requiredHeaders.filter(function (h) { return !headerMap_1.hasOwnProperty(h); });
                        if (missing.length > 0) {
                            console.error("Missing required headers:", missing);
                            process.exit(1);
                        }
                        return [3 /*break*/, 9];
                    }
                    _e.label = 6;
                case 6:
                    _e.trys.push([6, 8, , 9]);
                    timeStr = row[headerMap_1["time"]];
                    if (!timeStr) {
                        skipped++;
                        return [3 /*break*/, 9];
                    }
                    category = row[headerMap_1["dali_property.category"]] || "";
                    controller = row[headerMap_1["dali_property.controller"]] || "";
                    guid = row[headerMap_1["dali_property.device_guid"]] || "";
                    property = row[headerMap_1["dali_property.property"]] || "";
                    title = row[headerMap_1["dali_property.title"]] || "";
                    unit = row[headerMap_1["dali_property.unit"]] || "";
                    valueNumStr = row[headerMap_1["dali_property.value_num"]];
                    value = parseFloat(valueNumStr);
                    if (isNaN(value)) {
                        skipped++;
                        return [3 /*break*/, 9];
                    }
                    timestamp = new Date(timeStr);
                    if (isNaN(timestamp.getTime())) {
                        console.warn("Invalid timestamp: ".concat(timeStr));
                        skipped++;
                        return [3 /*break*/, 9];
                    }
                    dataToWrite = __assign(__assign(__assign(__assign(__assign(__assign({}, (controller && { controller: controller })), (category && { category: category })), (guid && { device_guid: guid })), (property && { property: property })), (unit && { unit: unit })), (title && { title: title }));
                    console.log("🚀 ~ restore ~ dataToWrite:", dataToWrite);
                    return [4 /*yield*/, influxWriter.writePoint({
                            measurement: "dali_property",
                            tags: dataToWrite,
                            fields: {
                                value_num: value,
                            },
                            timestamp: timestamp,
                        })];
                case 7:
                    _e.sent();
                    count++;
                    if (count % 1000 === 0) {
                        console.log("Processed ".concat(count, " records..."));
                    }
                    return [3 /*break*/, 9];
                case 8:
                    e_1 = _e.sent();
                    console.warn("Error processing line:", e_1);
                    skipped++;
                    return [3 /*break*/, 9];
                case 9:
                    _a = true;
                    return [3 /*break*/, 4];
                case 10: return [3 /*break*/, 17];
                case 11:
                    e_2_1 = _e.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 17];
                case 12:
                    _e.trys.push([12, , 15, 16]);
                    if (!(!_a && !_b && (_c = rl_1.return))) return [3 /*break*/, 14];
                    return [4 /*yield*/, _c.call(rl_1)];
                case 13:
                    _e.sent();
                    _e.label = 14;
                case 14: return [3 /*break*/, 16];
                case 15:
                    if (e_2) throw e_2.error;
                    return [7 /*endfinally*/];
                case 16: return [7 /*endfinally*/];
                case 17:
                    console.log("Import finished. Processed: ".concat(count, ", Skipped: ").concat(skipped));
                    console.log("Flushing remaining data...");
                    return [4 /*yield*/, influxWriter.dispose()];
                case 18:
                    _e.sent();
                    console.log("Done.");
                    return [3 /*break*/, 20];
                case 19:
                    err_1 = _e.sent();
                    console.error("Fatal error:", err_1);
                    process.exit(1);
                    return [3 /*break*/, 20];
                case 20: return [2 /*return*/];
            }
        });
    });
}
function cleanField(field) {
    if (field.startsWith('"') && field.endsWith('"')) {
        return field.substring(1, field.length - 1);
    }
    return field;
}
restore();
