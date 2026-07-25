"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handling_1 = require("../../common/utils/global-error-handling");
const mongoose_1 = __importDefault(require("mongoose"));
const color_repository_1 = __importDefault(require("../../DB/repository/color.repository"));
const success_response_1 = require("../../common/utils/success.response");
const stock_repository_1 = __importDefault(require("../../DB/repository/stock.repository"));
const material_repository_1 = __importDefault(require("../../DB/repository/material.repository"));
const email_event_1 = require("../../common/utils/email/email.event");
const nodeMailer_1 = require("../../common/utils/email/nodeMailer");
const stockTransaction_repository_1 = __importDefault(require("../../DB/repository/stockTransaction.repository"));
const stockTransaction_model_1 = require("../../DB/models/stockTransaction.model");
const lowStock__templete_1 = require("../../common/utils/email/lowStock..templete");
class StockTransactionService {
    _stockModel = new stock_repository_1.default();
    _stockTransactionModel = new stockTransaction_repository_1.default();
    _materialModel = new material_repository_1.default();
    _colorModel = new color_repository_1.default();
    increaseYarnStock = async (req, res, next) => {
        const { stockId } = req.params;
        const { quantity, reason } = req.body;
        if (Array.isArray(stockId)) {
            throw new global_error_handling_1.AppError("Invalid stock id", 400);
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(stockId)) {
            throw new global_error_handling_1.AppError("Invalid stock id", 400);
        }
        const stock = await this._stockModel.findOne({
            filter: { _id: stockId }
        });
        if (!stock) {
            throw new global_error_handling_1.AppError("Stock not found", 404);
        }
        if (!quantity || quantity <= 0) {
            throw new global_error_handling_1.AppError("Quantity must be greater than 0", 400);
        }
        const updatedStock = await this._stockModel.update({ _id: stockId }, {
            quantity: stock.quantity + quantity
        });
        await this._stockTransactionModel.create({
            stockId: new mongoose_1.default.Types.ObjectId(stockId),
            quantity,
            type: stockTransaction_model_1.TransactionStock_Enum.IN,
            reason: reason || "Stock In",
            createdBy: req.user?._id
        });
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            message: "Stock increased successfully",
            data: updatedStock
        });
    };
    decreaseYarnStock = async (req, res, next) => {
        const { stockId } = req.params;
        const { quantity, reason } = req.body;
        if (Array.isArray(stockId)) {
            throw new global_error_handling_1.AppError("Invalid stock id", 400);
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(stockId)) {
            throw new global_error_handling_1.AppError("Invalid stock id", 400);
        }
        const stock = await this._stockModel.findOne({
            filter: { _id: stockId }
        });
        if (!stock) {
            throw new global_error_handling_1.AppError("Stock not found", 404);
        }
        if (!quantity || quantity <= 0) {
            throw new global_error_handling_1.AppError("Quantity must be greater than 0", 400);
        }
        const material = await this._materialModel.findOne({
            filter: { _id: stock.materialId }
        });
        const color = await this._colorModel.findOne({
            filter: { _id: stock.colorId }
        });
        const newQuantity = stock.quantity - quantity;
        if (newQuantity < 0) {
            throw new global_error_handling_1.AppError("Quantity cannot be less than zero", 400);
        }
        const updatedStock = await this._stockModel.update({ _id: stockId }, {
            quantity: newQuantity
        });
        await this._stockTransactionModel.create({
            stockId: new mongoose_1.default.Types.ObjectId(stockId),
            quantity,
            type: stockTransaction_model_1.TransactionStock_Enum.OUT,
            reason: reason || "Stock Out",
            createdBy: req.user?._id
        });
        if (newQuantity <= stock.minQuantity) {
            await (0, nodeMailer_1.sendEmail)({
                to: req.user.email,
                subject: "Low Stock Alert",
                html: (0, lowStock__templete_1.templateLowStock)({
                    materialName: material?.name,
                    colorName: color?.name,
                    currentQuantity: newQuantity,
                    minQuantity: stock.minQuantity,
                })
            });
            email_event_1.eventEmitter.emit(email_event_1.NotificationEventEnum.LOW_STOCK, {
                material,
                color,
                newQuantity,
            });
        }
        (0, success_response_1.successResponse)({ res, status: 200, message: "Stock updated successfully", data: { quantity: updatedStock } });
    };
    historyOfStock = async (req, res, next) => {
        const { stockId } = req.params;
        const stock = await this._stockModel.findOne({ filter: { _id: stockId } });
        if (!stock) {
            throw new global_error_handling_1.AppError("Stock not found", 404);
        }
        const history = await this._stockTransactionModel.find({
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
        });
        return (0, success_response_1.successResponse)({ res, status: 200, message: "Stock history retrieved successfully", data: history });
    };
    getAllStockTransaction = async (req, res, next) => {
        const { stockId } = req.params;
        const stock = await this._stockModel.findOne({
            filter: { _id: stockId }
        });
        if (!stock) {
            throw new global_error_handling_1.AppError("Stock not found", 404);
        }
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const transactions = await this._stockTransactionModel.paginate({
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
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            message: "Stock transactions retrieved successfully",
            data: transactions
        });
    };
}
exports.default = new StockTransactionService();
