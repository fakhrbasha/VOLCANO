"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = exports.NotificationEventEnum = void 0;
const node_events_1 = require("node:events");
const user_enum_1 = require("../../enums/user.enum");
const nodeMailer_1 = require("./nodeMailer");
const notifications_model_1 = require("../../../DB/models/notifications.model");
const notification_repository_1 = __importDefault(require("../../../DB/repository/notification.repository"));
const lowStock__templete_1 = require("./lowStock..templete");
var NotificationEventEnum;
(function (NotificationEventEnum) {
    NotificationEventEnum["LOW_STOCK"] = "LOW_STOCK_NOTIFICATION";
    NotificationEventEnum["PURCHASE_ORDER_CREATED"] = "PURCHASE_ORDER_CREATED";
    NotificationEventEnum["PURCHASE_ORDER_APPROVED"] = "PURCHASE_ORDER_APPROVED";
    NotificationEventEnum["PURCHASE_ORDER_CANCELLED"] = "PURCHASE_ORDER_CANCELLED";
    NotificationEventEnum["PURCHASE_ORDER_RECEIVED"] = "PURCHASE_ORDER_RECEIVED";
})(NotificationEventEnum || (exports.NotificationEventEnum = NotificationEventEnum = {}));
exports.eventEmitter = new node_events_1.EventEmitter();
const notificationModel = new notification_repository_1.default();
exports.eventEmitter.on(user_enum_1.EmailEnum.confirmedEmail, async (fn) => {
    await fn();
});
exports.eventEmitter.on(user_enum_1.EmailEnum.lowStock, async ({ stock, material, color, newQuantity, userEmail }) => {
    await (0, nodeMailer_1.sendEmail)({
        to: userEmail,
        subject: "Low Stock Alert",
        html: (0, lowStock__templete_1.templateLowStock)({
            materialName: material.name,
            colorName: color.name,
            currentQuantity: newQuantity,
            minQuantity: stock.minQuantity,
        })
    });
});
exports.eventEmitter.on(NotificationEventEnum.LOW_STOCK, async ({ material, color, newQuantity, }) => {
    console.log("LOW_STOCK_NOTIFICATION FIRED");
    await notificationModel.create({
        title: "Low Stock Alert",
        message: `${material.name} (${color.name}) stock is low. Remaining: ${newQuantity}`,
        type: notifications_model_1.NotificationType.LOW_STOCK
    });
});
exports.eventEmitter.on(NotificationEventEnum.PURCHASE_ORDER_CREATED, async ({ orderId }) => {
    await notificationModel.create({
        title: "Purchase Order Created",
        message: `Purchase Order #${orderId} has been created`,
        type: notifications_model_1.NotificationType.PURCHASE_ORDER
    });
});
exports.eventEmitter.on(NotificationEventEnum.PURCHASE_ORDER_CANCELLED, async ({ orderId }) => {
    await notificationModel.create({
        title: "Purchase Order Cancelled",
        message: `Purchase Order #${orderId} has been Cancelled`,
        type: notifications_model_1.NotificationType.PURCHASE_ORDER
    });
});
exports.eventEmitter.on(NotificationEventEnum.PURCHASE_ORDER_APPROVED, async ({ orderId }) => {
    await notificationModel.create({
        title: "Purchase Order Approved",
        message: `Purchase Order #${orderId} has been Approved`,
        type: notifications_model_1.NotificationType.PURCHASE_ORDER
    });
});
exports.eventEmitter.on(NotificationEventEnum.PURCHASE_ORDER_RECEIVED, async ({ orderId }) => {
    await notificationModel.create({
        title: "Purchase Order Received",
        message: `Purchase Order #${orderId} has been Received`,
        type: notifications_model_1.NotificationType.PURCHASE_ORDER
    });
});
