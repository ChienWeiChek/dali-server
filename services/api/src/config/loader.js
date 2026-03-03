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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var dotenv_1 = require("dotenv");
// Load env vars from root .env if in dev
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../../.env') });
var DEFAULT_CONTROLLER_PATH = path_1.default.resolve(process.cwd(), '../../config/controllers.json');
var DEFAULT_AUTH_PATH = path_1.default.resolve(process.cwd(), '../../config/auth.json');
function getValidPath(envPath, defaultPath) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!envPath) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, promises_1.default.access(envPath)];
                case 2:
                    _b.sent();
                    return [2 /*return*/, envPath];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, defaultPath];
            }
        });
    });
}
function loadConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var controllerPath, authPath, controllersRaw, controllers, authRaw, auth;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getValidPath(process.env.CONTROLLER_CONFIG_PATH, DEFAULT_CONTROLLER_PATH)];
                case 1:
                    controllerPath = _a.sent();
                    return [4 /*yield*/, getValidPath(process.env.AUTH_CONFIG_PATH, DEFAULT_AUTH_PATH)];
                case 2:
                    authPath = _a.sent();
                    return [4 /*yield*/, promises_1.default.readFile(controllerPath, 'utf-8')];
                case 3:
                    controllersRaw = _a.sent();
                    controllers = JSON.parse(controllersRaw);
                    return [4 /*yield*/, promises_1.default.readFile(authPath, 'utf-8')];
                case 4:
                    authRaw = _a.sent();
                    auth = JSON.parse(authRaw);
                    return [2 /*return*/, {
                            controllers: controllers,
                            auth: auth,
                            influx: {
                                url: process.env.INFLUX2_URL || process.env.INFLUX_URL || 'http://localhost:8086',
                                token: process.env.INFLUX_TOKEN || 'my-token',
                                org: process.env.INFLUX_ORG || 'dali',
                                bucket: process.env.INFLUX_BUCKET || 'dali_devices',
                                username: process.env.INFLUX_ADMIN_USER || 'admin',
                                password: process.env.INFLUX_ADMIN_PASSWORD || 'admin123',
                            },
                            mqtt: {
                                brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://mosquitto:1883',
                                username: process.env.MQTT_USERNAME || 'admin',
                                password: process.env.MQTT_PASSWORD || 'admin123',
                                topic: process.env.MQTT_TOPIC || 'DALI-PRO-IoT/+/devices/+/+/data/#',
                            },
                            server: {
                                port: parseInt(process.env.API_PORT || '3000', 10),
                            },
                        }];
            }
        });
    });
}
