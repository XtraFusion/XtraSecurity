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
var prisma_1 = require("./lib/generated/prisma");
var prisma = new prisma_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var groups, wid, workspaceLogs, grouped, failed, findManyLogs, rawLogs;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, prisma.auditLog.groupBy({
                        by: ['workspaceId'],
                        _count: { id: true }
                    })];
                case 1:
                    groups = _b.sent();
                    console.log("Groups by workspaceId:", groups);
                    wid = (_a = groups.find(function (g) { return g._count.id > 1; })) === null || _a === void 0 ? void 0 : _a.workspaceId;
                    if (!wid) return [3 /*break*/, 7];
                    console.log("Using workspaceId:", wid);
                    return [4 /*yield*/, prisma.auditLog.count({ where: { workspaceId: wid } })];
                case 2:
                    workspaceLogs = _b.sent();
                    console.log("Logs for this workspace:", workspaceLogs);
                    return [4 /*yield*/, prisma.auditLog.groupBy({
                            by: ['userId'],
                            where: { workspaceId: wid },
                            _count: { userId: true }
                        })];
                case 3:
                    grouped = _b.sent();
                    console.log("Active users grouped:", JSON.stringify(grouped, null, 2));
                    return [4 /*yield*/, prisma.auditLog.count({
                            where: {
                                workspaceId: wid,
                                OR: [
                                    { action: { contains: "fail" } },
                                    { action: { contains: "Fail" } }
                                ]
                            }
                        })];
                case 4:
                    failed = _b.sent();
                    console.log("Failed logs:", failed);
                    return [4 /*yield*/, prisma.auditLog.findMany({
                            where: { workspaceId: wid },
                            skip: 0,
                            take: 5,
                            include: { user: true }
                        })];
                case 5:
                    findManyLogs = _b.sent();
                    // What are the IDs of the records returned?
                    console.log("FindMany limit 5 returned", findManyLogs.length, "items.");
                    return [4 /*yield*/, prisma.auditLog.findMany({
                            where: { workspaceId: wid }
                        })];
                case 6:
                    rawLogs = _b.sent();
                    console.log("Raw logs without user include:", rawLogs.length);
                    if (rawLogs.length !== findManyLogs.length) {
                        console.log("MISSING USERS DETECTED.");
                    }
                    _b.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error).finally(function () { return prisma.$disconnect(); });
