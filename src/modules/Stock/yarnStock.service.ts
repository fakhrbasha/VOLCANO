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
import { eventEmitter } from "../../common/utils/email/email.event"
import { sendEmail } from "../../common/utils/email/nodeMailer"
import { EmailEnum } from "../../common/enums/user.enum"
import { NotificationType } from "../../DB/models/notifications.model"
import NotificationRepository from "../../DB/repository/notification.repository"



class StockService {




    private readonly _stockModel = new StockRepository()
    private readonly _materialModel = new MaterialRepository()
    private readonly _colorModel = new ColorRepository()
    private readonly _notificationModel = new NotificationRepository()


    createYarnStock = async (req: Request, res: Response, next: NextFunction) => {
        const { materialId, colorId, quantity, minQuantity }: IYarnStock = req.body

        const material = await this._materialModel.findOne({ filter: { _id: materialId } })
        if (!material) {
            throw new AppError(
                "Material not found",
                404
            );
        }

        const color = await this._colorModel.findOne({ filter: { _id: colorId } })
        if (!color) {
            throw new AppError(
                "Color not found",
                404
            );
        }

        const stockExists = await this._stockModel.findOne({ filter: { materialId, colorId } })
        if (stockExists) {
            throw new AppError(
                "Stock for this material and color already exists",
                400
            );
        }

        if (minQuantity < 0 || quantity < 0) {
            throw new AppError(
                "Quantity and minimum quantity cannot be negative",
                400
            );
        }

        if (minQuantity > quantity) {
            throw new AppError(
                "Minimum quantity cannot be greater than available quantity",
                400
            );
        }



        const newStock = await this._stockModel.create({ materialId, colorId, quantity, minQuantity, createdBy: req.user!._id })
        return successResponse({ res, status: 201, message: "Stock created successfully", data: newStock })
    }

    getAllYarnStock = async (req: Request, res: Response, next: NextFunction) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const searchQuery = req.query.search
            ? {
                name: {
                    $regex: req.query.search,
                    $options: "i"
                }
            }
            : {};
        const stocks = await this._stockModel.paginate({ page, limit, search: searchQuery })



        return successResponse({ res, status: 200, message: "Stocks retrieved successfully", data: stocks })
    }

    deleteYarnStock = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        const stock = await this._stockModel.findOne({ filter: { _id: id } })
        if (!stock) {
            throw new AppError(
                "Stock not found",
                404
            );
        }

        await this._stockModel.delete(new mongoose.Types.ObjectId(stock._id))
        return successResponse({ res, status: 200, message: "Stock deleted successfully" })
    }

    getYarnStockById = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        const stock = await this._stockModel.findOne({ filter: { _id: id } })
        if (!stock) {
            throw new AppError(
                "Stock not found",
                404
            );
        }

        return successResponse({ res, status: 200, message: "Stock retrieved successfully", data: stock })
    }

    increaseYarnStock = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        const { quantity } = req.body
        const stock = await this._stockModel.findOne({ filter: { _id: id }, })

        if (!stock) {
            throw new AppError(
                "Stock not found",
                404
            );
        }

        if (quantity < 0) {
            throw new AppError(
                "Quantity cannot be negative",
                400
            );
        }

        const newQuantity = stock.quantity + quantity
        await this._stockModel.update({ _id: id }, { quantity: newQuantity })

        // return newQuantity

        successResponse({ res, status: 200, message: "Stock updated successfully", data: { quantity: newQuantity } })
    }

    decreaseYarnStock = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        const { quantity } = req.body
        const stock = await this._stockModel.findOne({ filter: { _id: id } })
        if (!stock) {
            throw new AppError(
                "Stock not found",
                404
            );
        }

        if (quantity < 0) {
            throw new AppError(
                "Quantity cannot be negative",
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
        await this._stockModel.update({ _id: id }, { quantity: newQuantity })


        if (newQuantity <= stock.minQuantity) {
            eventEmitter.emit(EmailEnum.lowStock, {
                stock,
                newQuantity,
                material,
                color,
                emailUser: req.user.email
            });

        }

        successResponse({ res, status: 200, message: "Stock updated successfully", data: { quantity: newQuantity } })
    }

    historyOfYarnStock = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        const stock = await this._stockModel.findOne({ filter: { _id: id } })
        if (!stock) {
            throw new AppError(
                "Stock not found",
                404
            );
        }
        const history = await this._stockModel.find({
            filter: {
                materialId: stock.materialId,
                colorId: stock.colorId
            },
            options: {
                sort: { createdAt: -1 }
            }
        })
        return successResponse({ res, status: 200, message: "Stock history retrieved successfully", data: history })
    }

}

export default new StockService()