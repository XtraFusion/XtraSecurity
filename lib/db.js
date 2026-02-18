"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_1 = require("../lib/generated/prisma");
var prisma = global.prisma || new prisma_1.PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
exports.default = prisma;
