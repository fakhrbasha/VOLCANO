"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpenseSchema = exports.getExpenseByIdSchema = exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
const generalRules_1 = require("../../common/utils/generalRules");
exports.createExpenseSchema = {
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        amount: zod_1.z.number().min(0),
        category: zod_1.z.string().min(2),
        expenseDate: zod_1.z.coerce.date().optional(),
        note: zod_1.z.string().optional()
    })
};
exports.getExpenseByIdSchema = {
    params: zod_1.z.object({
        id: generalRules_1.generalRules.id
    })
};
exports.updateExpenseSchema = {
    params: zod_1.z.object({
        id: generalRules_1.generalRules.id
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        amount: zod_1.z.number().min(0).optional(),
        category: zod_1.z.string().min(2).optional(),
        expenseDate: zod_1.z.coerce.date().optional(),
        note: zod_1.z.string().optional()
    })
};
