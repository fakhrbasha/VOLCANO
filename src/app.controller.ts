import express, { NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./DB/connectionDB"
import { AppError, globalErrorHandler } from "./common/utils/global-error-handling";
import { PORT } from "./config/config.service";
import redisService from "./common/services/redis.service";
import authRouter from "./modules/auth/auth.controller";
import departmentRouter from "./modules/department/department.controller";
import employeeRouter from "./modules/employee/employee.controller";
import attendanceRouter from "./modules/Attendance/attendance.controller";
import materialRouter from "./modules/materials/material.controller";
import colorRouter from "./modules/Color/Color.controller";
import yarnStockRouter from "./modules/Stock/yarnStock.controller";
import supplierRouter from "./modules/supplier/supplier.controller";
import { swaggerSpec } from "./config/swagger.config";
import purchaseOrderRouter from "./modules/PurchaseOrder/PurchaseOrder.controller";
import productRouter from "./modules/products/product.controller";
import customerRouter from "./modules/Customer/Customer.controller";
import expensesRouter from "./modules/expenses/expenses.controller";
import dashboardRouter from "./modules/dashboard/dashboard.controller";
import reportsRouter from "./modules/Reports/Reports.controller";
import notificationRouter from "./modules/notification/notification.controller";
// import { checkConnection } from "./DB/connectionDB";
import salesRouter from "./modules/sales/sales.controller";
import returnSalesRouter from "./modules/return sales/returnSales.controller";
import accountingRouter from "./modules/accounting/accounting.controller";
import cors from "cors";
import shiftRouter from "./modules/shift/shift.controller";
import payrollRouter from "./modules/payroll/payroll.controller";
// import { checkConnection } from "./DB/connectionDB";
const app: express.Application = express();
const port = PORT || 3000
app.use(cors());
app.use(express.json());

// ─── Swagger UI ──────────────────────────────────────────────────────────────
// console.log(JSON.stringify(swaggerSpec, null, 2));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: '🌋 Volcano API Docs',
    customCss: `.swagger-ui .topbar { background-color: #1a1a2e; } .swagger-ui .topbar-wrapper img { content: none; } .swagger-ui .topbar-wrapper::after { content: '🌋 Volcano API'; color: #e94560; font-size: 1.4rem; font-weight: 700; }`,
    swaggerOptions: { persistAuthorization: true },
}));
app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});
app.use(async (req, res, next) => {
    await connectDB();
    await redisService.connect();
    next();
});
// checkConnection()
// redisService.connect()

app.use('/auth', authRouter)
app.use('/department', departmentRouter)
app.use('/shift', shiftRouter)
app.use('/attendance', attendanceRouter)
app.use('/employee', employeeRouter)
app.use('/material', materialRouter)
app.use('/color', colorRouter)
app.use('/yarn-stock', yarnStockRouter)
app.use('/suppliers', supplierRouter)
app.use('/purchase-order', purchaseOrderRouter)
app.use('/products', productRouter)
app.use('/customers', customerRouter)
app.use('/expenses', expensesRouter)
app.use('/dashboard', dashboardRouter)
app.use('/reports', reportsRouter)
app.use('/notifications', notificationRouter)
app.use('/sales', salesRouter)
app.use('/return-sales', returnSalesRouter)
app.use('/accounting', accountingRouter)
// app.use('/employee-payment', payrollRouter)
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: "Welcome Fakhr In Your Home" })
})
app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
    throw new AppError(`Invalid URL ${req.originalUrl} with method ${req.method} not found`, 404)
})
app.use(globalErrorHandler);

export const bootstrap = () => {
    app.listen(port, () => {
        console.log(`✅ Server is running on port ${port}`);
        console.log(`📄 Swagger docs  → http://localhost:${port}/api-docs`);
        console.log(`🔗 API JSON spec → http://localhost:${port}/api-docs.json`);
    });
}

export default app;