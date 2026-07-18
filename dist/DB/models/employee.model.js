"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const employeeSchema = new mongoose_1.default.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    salary: {
        type: Number,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    departmentId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Department",
        required: true
    },
    role: {
        type: String,
        required: true
    },
    companyId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    shiftId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Shift",
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
employeeSchema.index({ phone: 1, companyId: 1 }, { unique: true, sparse: true, partialFilterExpression: { isDeleted: false } });
const employeeModel = mongoose_1.default.models.Employees || mongoose_1.default.model("Employee", employeeSchema);
exports.default = employeeModel;
