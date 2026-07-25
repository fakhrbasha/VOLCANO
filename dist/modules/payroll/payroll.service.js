"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handling_1 = require("../../common/utils/global-error-handling");
const employee_repository_1 = __importDefault(require("../../DB/repository/employee.repository"));
const success_response_1 = require("../../common/utils/success.response");
const payroll_repository_1 = __importDefault(require("../../DB/repository/payroll.repository"));
const mongoose_1 = __importDefault(require("mongoose"));
const attendance_repository_1 = __importDefault(require("../../DB/repository/attendance.repository"));
class PaymentEmployee {
    _employeeModel = new employee_repository_1.default();
    _payrollModel = new payroll_repository_1.default();
    _attendanceModel = new attendance_repository_1.default();
    createEmployeePayment = async (req, res) => {
        const { employeeId, amount, week, note } = req.body;
        const employee = await this._employeeModel.findOne({
            filter: { _id: employeeId }
        });
        if (!employee) {
            throw new global_error_handling_1.AppError("Employee not found", 404);
        }
        if (amount <= 0) {
            throw new global_error_handling_1.AppError("Amount must be greater than zero", 400);
        }
        const payroll = await this._payrollModel.create({
            employeeId,
            amount,
            paymentDate: new Date(),
            week,
            note,
            createdBy: req.user._id
        });
        (0, success_response_1.successResponse)({
            res,
            status: 201,
            message: "Employee payment created successfully",
            data: payroll
        });
    };
    getEmployeePaymentSummary = async (req, res, next) => {
        const { employeeId } = req.params;
        if (Array.isArray(employeeId)) {
            throw new global_error_handling_1.AppError("Invalid employee id", 400);
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(employeeId)) {
            throw new global_error_handling_1.AppError("Invalid employee id", 400);
        }
        const employee = await this._employeeModel.findOne({
            filter: { _id: employeeId }
        });
        if (!employee) {
            throw new global_error_handling_1.AppError("Employee not found", 404);
        }
        const payments = await this._payrollModel.find({
            filter: { employeeId }
        });
        const weeksWorked = payments.length;
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const expectedSalary = weeksWorked * employee.salary;
        const balance = expectedSalary - totalPaid;
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            message: "Employee payment summary retrieved successfully",
            data: {
                employeeId: employee._id,
                employeeName: employee.fullName,
                salaryPerWeek: employee.salary,
                weeksWorked,
                expectedSalary,
                totalPaid,
                balance
            }
        });
    };
    getEmployeeById = async (req, res) => {
        const { employeeId } = req.params;
        const employee = await this._employeeModel.findOne({
            filter: { _id: employeeId }
        });
        if (!employee) {
            throw new global_error_handling_1.AppError("Employee not exist", 404);
        }
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const data = await this._payrollModel.paginate({
            page,
            limit,
            search: {
                employeeId
            }
        });
        (0, success_response_1.successResponse)({ res, message: `Payment for ${employee.fullName} fetched success`, data });
    };
}
exports.default = new PaymentEmployee();
