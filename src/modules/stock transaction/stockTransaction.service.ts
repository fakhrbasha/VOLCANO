import { NextFunction, Request, Response } from "express"
import { AppError } from "../../common/utils/global-error-handling"
import AttendanceRepository from "../../DB/repository/attendance.repository"
import { IAttendance } from "../../DB/models/attendance.model"
import { attendanceStatus } from "../../common/enums/attendance.enum"
import EmployeeRepository from "../../DB/repository/employee.repository"
import mongoose from "mongoose"
import ColorRepository from "../../DB/repository/color.repository"
import { IColor } from "../../DB/models/color.model"
import { successResponse } from "../../common/utils/success.response"
import StockRepository from "../../DB/repository/stock.repository"
import { IYarnStock } from "../../DB/models/stock.model"
import MaterialRepository from "../../DB/repository/material.repository"
import { eventEmitter, NotificationEventEnum } from "../../common/utils/email/email.event"
import { sendEmail } from "../../common/utils/email/nodeMailer"
// import { WAREHOUSE_EMAIL } from "../../config/config.service"
import { EmailEnum } from "../../common/enums/user.enum"
import StockTransactionRepository from "../../DB/repository/stockTransaction.repository"
import { TransactionStock_Enum } from "../../DB/models/stockTransaction.model"
import { templateLowStock } from "../../common/utils/email/lowStock..templete"



class StockTransactionService {




    private readonly _stockModel = new StockRepository()
    private readonly _stockTransactionModel = new StockTransactionRepository()
    private readonly _materialModel = new MaterialRepository()
    private readonly _colorModel = new ColorRepository()


    increaseYarnStock = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        const { stockId } = req.params;
        const { quantity, reason } = req.body;

        if (Array.isArray(stockId)) {
            throw new AppError("Invalid stock id", 400);
        }

        if (!mongoose.Types.ObjectId.isValid(stockId)) {
            throw new AppError("Invalid stock id", 400);
        }

        const stock = await this._stockModel.findOne({
            filter: { _id: stockId }
        });

        if (!stock) {
            throw new AppError(
                "Stock not found",
                404
            );
        }

        if (!quantity || quantity <= 0) {
            throw new AppError(
                "Quantity must be greater than 0",
                400
            );
        }

        const updatedStock = await this._stockModel.update(
            { _id: stockId },
            {
                quantity: stock.quantity + quantity
            }
        );

        await this._stockTransactionModel.create({
            stockId: new mongoose.Types.ObjectId(stockId),
            quantity,
            type: TransactionStock_Enum.IN,
            reason: reason || "Stock In",
            createdBy: req.user?._id
        });

        return successResponse({
            res,
            status: 200,
            message: "Stock increased successfully",
            data: updatedStock
        });
    }

    decreaseYarnStock = async (req: Request, res: Response, next: NextFunction) => {
        const { stockId } = req.params;
        const { quantity, reason } = req.body;

        if (Array.isArray(stockId)) {
            throw new AppError("Invalid stock id", 400);
        }

        if (!mongoose.Types.ObjectId.isValid(stockId)) {
            throw new AppError("Invalid stock id", 400);
        }

        const stock = await this._stockModel.findOne({
            filter: { _id: stockId }
        });

        if (!stock) {
            throw new AppError(
                "Stock not found",
                404
            );
        }

        if (!quantity || quantity <= 0) {
            throw new AppError(
                "Quantity must be greater than 0",
                400
            );
        }


        const material = await this._materialModel.findOne({
            filter: { _id: stock.materialId }
        });

        const color = await this._colorModel.findOne({
            filter: { _id: stock.colorId }
        });
        const newQuantity = stock.quantity - quantity
        if (newQuantity < 0) {
            throw new AppError(
                "Quantity cannot be less than zero",
                400
            );
        }

        const updatedStock = await this._stockModel.update(
            { _id: stockId },
            {
                quantity: newQuantity
            }
        );

        await this._stockTransactionModel.create({
            stockId: new mongoose.Types.ObjectId(stockId),
            quantity,
            type: TransactionStock_Enum.OUT,
            reason: reason || "Stock Out",
            createdBy: req.user?._id
        });

        if (newQuantity <= stock.minQuantity) {
            await sendEmail({
                to: req.user.email!,
                subject: "Low Stock Alert",
                html: templateLowStock({
                    materialName: material?.name!,
                    colorName: color?.name!,
                    currentQuantity: newQuantity,
                    minQuantity: stock.minQuantity,
                })
            });
            // eventEmitter.emit(EmailEnum.lowStock, {
            //     stock,
            //     newQuantity,
            //     material,
            //     color
            // });
            eventEmitter.emit(
                NotificationEventEnum.LOW_STOCK,
                {
                    material,
                    color,
                    newQuantity,
                }
            );
        }

        successResponse({ res, status: 200, message: "Stock updated successfully", data: { quantity: updatedStock } })
    }

    historyOfStock = async (req: Request, res: Response, next: NextFunction) => {
        const { stockId } = req.params
        const stock = await this._stockModel.findOne({ filter: { _id: stockId } })
        if (!stock) {
            throw new AppError(
                "Stock not found",
                404
            );
        }
        const history =
            await this._stockTransactionModel.find({
                filter: {
                    stockId
                },
                options: {
                    populate: [
                        {
                            path: "createdBy",
                            select: "firstName lastName  email"
                        }
                    ]
                }
            })
        return successResponse({ res, status: 200, message: "Stock history retrieved successfully", data: history })
    }

    getAllStockTransaction = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        const { stockId } = req.params;

        const stock = await this._stockModel.findOne({
            filter: { _id: stockId }
        });

        if (!stock) {
            throw new AppError(
                "Stock not found",
                404
            );
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const transactions =
            await this._stockTransactionModel.paginate({
                page,
                limit,
                search: {
                    stockId
                },
                populate: [
                    {
                        path: "createdBy",
                        select: "firstName lastName email"
                    }
                ],
                sort: {
                    createdAt: -1
                }
            });

        return successResponse({
            res,
            status: 200,
            message: "Stock transactions retrieved successfully",
            data: transactions
        });
    }
}

export default new StockTransactionService()