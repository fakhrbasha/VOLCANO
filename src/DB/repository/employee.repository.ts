import { Model, Types, HydratedDocument } from "mongoose";
import employeeModel, { IEmployee } from "../models/employee.model";
import BaseRepository from "./base.repository";
import attendanceModel from "../models/attendance.model";
import EmployeePaymentModel from "../models/payroll.model";


class EmployeeRepository extends BaseRepository<IEmployee> {
    constructor(protected readonly model: Model<IEmployee> = employeeModel) {
        super(model)
    }

    protected override getTenantFilter(filter: any = {}): any {
        const tenantFilter = super.getTenantFilter(filter);
        return { ...tenantFilter, isDeleted: { $ne: true } };
    }

    async delete(id: Types.ObjectId): Promise<HydratedDocument<IEmployee> | null> {
        // Soft delete the employee by setting isDeleted to true
        const employee = await this.model.findOneAndUpdate(
            this.getTenantFilter({ _id: id }),
            { isDeleted: true },
            { new: true }
        );

        if (!employee) {
            return null;
        }

        // Cascade delete all associated Attendance and EmployeePayment records
        await attendanceModel.deleteMany({ employeeId: id });
        await EmployeePaymentModel.deleteMany({ employeeId: id });

        return employee;
    }
}

export default EmployeeRepository