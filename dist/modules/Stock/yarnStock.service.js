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
const user_enum_1 = require("../../common/enums/user.enum");
const notification_repository_1 = __importDefault(require("../../DB/repository/notification.repository"));
class StockService {
    _stockModel = new stock_repository_1.default();
    _materialModel = new material_repository_1.default();
    _colorModel = new color_repository_1.default();
    _notificationModel = new notification_repository_1.default();
    createYarnStock = async (req, res, next) => {
        const { materialId, colorId, quantity, minQuantity } = req.body;
        const material = await this._materialModel.findOne({ filter: { _id: materialId } });
        if (!material) {
            throw new global_error_handling_1.AppError("Material not found", 404);
        }
        const color = await this._colorModel.findOne({ filter: { _id: colorId } });
        if (!color) {
            throw new global_error_handling_1.AppError("Color not found", 404);
        }
        const stockExists = await this._stockModel.findOne({ filter: { materialId, colorId } });
        if (stockExists) {
            throw new global_error_handling_1.AppError("Stock for this material and color already exists", 400);
        }
        if (minQuantity < 0 || quantity < 0) {
            throw new global_error_handling_1.AppError("Quantity and minimum quantity cannot be negative", 400);
        }
        if (minQuantity > quantity) {
            throw new global_error_handling_1.AppError("Minimum quantity cannot be greater than available quantity", 400);
        }
        const newStock = await this._stockModel.create({ materialId, colorId, quantity, minQuantity, createdBy: req.user._id });
        return (0, success_response_1.successResponse)({ res, status: 201, message: "Stock created successfully", data: newStock });
    };
    getAllYarnStock = async (req, res, next) => {
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
        const stocks = await this._stockModel.paginate({ page, limit, search: searchQuery });
        return (0, success_response_1.successResponse)({ res, status: 200, message: "Stocks retrieved successfully", data: stocks });
    };
    deleteYarnStock = async (req, res, next) => {
        const { id } = req.params;
        const stock = await this._stockModel.findOne({ filter: { _id: id } });
        if (!stock) {
            throw new global_error_handling_1.AppError("Stock not found", 404);
        }
        await this._stockModel.delete(new mongoose_1.default.Types.ObjectId(stock._id));
        return (0, success_response_1.successResponse)({ res, status: 200, message: "Stock deleted successfully" });
    };
    getYarnStockById = async (req, res, next) => {
        const { id } = req.params;
        const stock = await this._stockModel.findOne({ filter: { _id: id } });
        if (!stock) {
            throw new global_error_handling_1.AppError("Stock not found", 404);
        }
        return (0, success_response_1.successResponse)({ res, status: 200, message: "Stock retrieved successfully", data: stock });
    };
    increaseYarnStock = async (req, res, next) => {
        const { id } = req.params;
        const { quantity } = req.body;
        const stock = await this._stockModel.findOne({ filter: { _id: id }, });
        if (!stock) {
            throw new global_error_handling_1.AppError("Stock not found", 404);
        }
        if (quantity < 0) {
            throw new global_error_handling_1.AppError("Quantity cannot be negative", 400);
        }
        const newQuantity = stock.quantity + quantity;
        await this._stockModel.update({ _id: id }, { quantity: newQuantity });
        (0, success_response_1.successResponse)({ res, status: 200, message: "Stock updated successfully", data: { quantity: newQuantity } });
    };
    decreaseYarnStock = async (req, res, next) => {
        const { id } = req.params;
        const { quantity } = req.body;
        const stock = await this._stockModel.findOne({ filter: { _id: id } });
        if (!stock) {
            throw new global_error_handling_1.AppError("Stock not found", 404);
        }
        if (quantity < 0) {
            throw new global_error_handling_1.AppError("Quantity cannot be negative", 400);
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
        await this._stockModel.update({ _id: id }, { quantity: newQuantity });
        if (newQuantity <= stock.minQuantity) {
            email_event_1.eventEmitter.emit(user_enum_1.EmailEnum.lowStock, {
                stock,
                newQuantity,
                material,
                color,
                emailUser: req.user.email
            });
        }
        (0, success_response_1.successResponse)({ res, status: 200, message: "Stock updated successfully", data: { quantity: newQuantity } });
    };
    historyOfYarnStock = async (req, res, next) => {
        const { id } = req.params;
        const stock = await this._stockModel.findOne({ filter: { _id: id } });
        if (!stock) {
            throw new global_error_handling_1.AppError("Stock not found", 404);
        }
        const history = await this._stockModel.find({
            filter: {
                materialId: stock.materialId,
                colorId: stock.colorId
            },
            options: {
                sort: { createdAt: -1 }
            }
        });
        return (0, success_response_1.successResponse)({ res, status: 200, message: "Stock history retrieved successfully", data: history });
    };
}
exports.default = new StockService();
