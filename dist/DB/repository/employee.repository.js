"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const employee_model_1 = __importDefault(require("../models/employee.model"));
const base_repository_1 = __importDefault(require("./base.repository"));
const attendance_model_1 = __importDefault(require("../models/attendance.model"));
const payroll_model_1 = __importDefault(require("../models/payroll.model"));
class EmployeeRepository extends base_repository_1.default {
    model;
    constructor(model = employee_model_1.default) {
        super(model);
        this.model = model;
    }
    getTenantFilter(filter = {}) {
        const tenantFilter = super.getTenantFilter(filter);
        return { ...tenantFilter, isDeleted: { $ne: true } };
    }
    async delete(id) {
        const employee = await this.model.findOneAndUpdate(this.getTenantFilter({ _id: id }), { isDeleted: true }, { new: true });
        if (!employee) {
            return null;
        }
        await attendance_model_1.default.deleteMany({ employeeId: id });
        await payroll_model_1.default.deleteMany({ employeeId: id });
        return employee;
    }
}
exports.default = EmployeeRepository;
