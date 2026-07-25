import { EventEmitter } from "node:events";
import { EmailEnum } from "../../enums/user.enum";
import { sendEmail } from "./nodeMailer";
import { IColor } from "../../../DB/models/color.model";
import { IMaterial } from "../../../DB/models/materials.model";
import { NotificationType } from "../../../DB/models/notifications.model";
import NotificationRepository from "../../../DB/repository/notification.repository";
import { templateLowStock } from "./lowStock..templete";
export enum NotificationEventEnum {
    LOW_STOCK = "LOW_STOCK_NOTIFICATION",

    PURCHASE_ORDER_CREATED = "PURCHASE_ORDER_CREATED",
    PURCHASE_ORDER_APPROVED = "PURCHASE_ORDER_APPROVED",
    PURCHASE_ORDER_CANCELLED = "PURCHASE_ORDER_CANCELLED",
    PURCHASE_ORDER_RECEIVED = "PURCHASE_ORDER_RECEIVED"
}
export const eventEmitter = new EventEmitter();
const notificationModel =
    new NotificationRepository();
/**
 * Confirm Email Event
 */
eventEmitter.on(EmailEnum.confirmedEmail, async (fn: () => Promise<void>) => {
    await fn();
});

/**
 * Low Stock Event
 */
eventEmitter.on(
    EmailEnum.lowStock,
    async ({
        stock,
        material,
        color,
        newQuantity,
        userEmail
    }: {
        stock: any;
        material: IMaterial;
        color: IColor;
        newQuantity: number;
        userEmail: string
    }) => {
        await sendEmail({
            to: userEmail!,
            subject: "Low Stock Alert",
            html: templateLowStock({
                materialName: material.name,
                colorName: color.name,
                currentQuantity: newQuantity,
                minQuantity: stock.minQuantity,
            })
        });
    }
);

eventEmitter.on(
    NotificationEventEnum.LOW_STOCK,
    async ({
        material,
        color,
        newQuantity,
    }) => {
        console.log("LOW_STOCK_NOTIFICATION FIRED");
        await notificationModel.create({
            title: "Low Stock Alert",
            message:
                `${material.name} (${color.name}) stock is low. Remaining: ${newQuantity}`,
            type: NotificationType.LOW_STOCK
        });

    }
);

eventEmitter.on(
    NotificationEventEnum.PURCHASE_ORDER_CREATED,
    async ({ orderId }) => {

        await notificationModel.create({
            title: "Purchase Order Created",
            message: `Purchase Order #${orderId} has been created`,
            type: NotificationType.PURCHASE_ORDER
        });

    }
);
eventEmitter.on(
    NotificationEventEnum.PURCHASE_ORDER_CANCELLED,
    async ({ orderId }) => {

        await notificationModel.create({
            title: "Purchase Order Cancelled",
            message: `Purchase Order #${orderId} has been Cancelled`,
            type: NotificationType.PURCHASE_ORDER
        });

    }
);
eventEmitter.on(
    NotificationEventEnum.PURCHASE_ORDER_APPROVED,
    async ({ orderId }) => {

        await notificationModel.create({
            title: "Purchase Order Approved",
            message: `Purchase Order #${orderId} has been Approved`,
            type: NotificationType.PURCHASE_ORDER
        });

    }
);
eventEmitter.on(
    NotificationEventEnum.PURCHASE_ORDER_RECEIVED,
    async ({ orderId }) => {

        await notificationModel.create({
            title: "Purchase Order Received",
            message: `Purchase Order #${orderId} has been Received`,
            type: NotificationType.PURCHASE_ORDER
        });

    }
);
