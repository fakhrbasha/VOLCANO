import mongoose, { HydratedDocument, Types } from "mongoose";


export interface IEmployee {
    fullName: string,
    salary: number,
    phone?: string;
    departmentId?: Types.ObjectId,
    role: string;
    shiftId: Types.ObjectId,
    companyId: Types.ObjectId;
    isDeleted?: boolean;
}

const employeeSchema = new mongoose.Schema<IEmployee>({
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true
    },
    role: {
        type: String,
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    shiftId: {
        type: mongoose.Schema.Types.ObjectId,
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
})

employeeSchema.index({ phone: 1, companyId: 1 }, { unique: true, sparse: true, partialFilterExpression: { isDeleted: false } });

const employeeModel = mongoose.models.Employees || mongoose.model<IEmployee>("Employee", employeeSchema)


export default employeeModel;
export type EmployeeDocument = HydratedDocument<IEmployee>;