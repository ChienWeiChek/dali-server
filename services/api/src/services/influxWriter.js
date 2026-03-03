"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfluxWriter = void 0;
var influxdb_client_1 = require("@influxdata/influxdb-client");
var InfluxWriter = /** @class */ (function () {
    function InfluxWriter(config) {
        var _this = this;
        this.batch = [];
        this.batchSize = 1000;
        this.flushInterval = 5000; // 5s
        this.timer = null;
        var url = new URL(config.url);
        var client = new influxdb_client_1.InfluxDB({
            url: url.origin,
            token: config.token,
        });
        this.writeApi = client.getWriteApi(config.org, config.bucket, 'ns', {
            batchSize: this.batchSize,
            flushInterval: this.flushInterval,
        });
        // Manual batching so we can reuse existing call sites before switching fully
        this.timer = setInterval(function () { return _this.flush(); }, this.flushInterval);
    }
    InfluxWriter.prototype.writePoint = function (point) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.batch.push(point);
                        if (!(this.batch.length >= this.batchSize)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.flush()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    InfluxWriter.prototype.flush = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pointsToWrite, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.batch.length === 0) {
                            return [2 /*return*/];
                        }
                        pointsToWrite = __spreadArray([], this.batch, true);
                        this.batch = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        pointsToWrite.forEach(function (p) {
                            var point = new influxdb_client_1.Point(p.measurement);
                            if (p.tags) {
                                Object.entries(p.tags).forEach(function (_a) {
                                    var key = _a[0], value = _a[1];
                                    if (value !== undefined && value !== null) {
                                        point.tag(key, value);
                                    }
                                });
                            }
                            Object.entries(p.fields).forEach(function (_a) {
                                var key = _a[0], value = _a[1];
                                if (typeof value === 'number') {
                                    point.floatField(key, value);
                                }
                                else if (typeof value === 'boolean') {
                                    point.booleanField(key, value);
                                }
                                else if (typeof value === 'string') {
                                    point.stringField(key, value);
                                }
                            });
                            if (p.timestamp instanceof Date) {
                                point.timestamp(p.timestamp);
                            }
                            else if (typeof p.timestamp === 'number') {
                                point.timestamp(p.timestamp);
                            }
                            _this.writeApi.writePoint(point);
                        });
                        return [4 /*yield*/, this.writeApi.flush()];
                    case 2:
                        _a.sent();
                        console.log("Flushed ".concat(pointsToWrite.length, " points to InfluxDB 2.x"));
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error writing to InfluxDB 2.x:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    InfluxWriter.prototype.checkHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Attempt to flush to verify connection
                        return [4 /*yield*/, this.writeApi.flush()];
                    case 1:
                        // Attempt to flush to verify connection
                        _a.sent();
                        return [2 /*return*/, { status: 'healthy', message: 'InfluxDB connection successful' }];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, {
                                status: 'unhealthy',
                                message: "InfluxDB connection failed: ".concat(error_2.message || 'Unknown error')
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    InfluxWriter.prototype.dispose = function () {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        return this.writeApi.flush();
    };
    return InfluxWriter;
}());
exports.InfluxWriter = InfluxWriter;
