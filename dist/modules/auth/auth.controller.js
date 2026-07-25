"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../../common/middleware/validation");
const userValidation = __importStar(require("./auth.validation"));
const auth_service_1 = __importDefault(require("./auth.service"));
const authentication_1 = require("../../common/middleware/authentication");
const authorization_1 = require("../../common/middleware/authorization");
const user_enum_1 = require("../../common/enums/user.enum");
const authRouter = (0, express_1.Router)();
authRouter.post("/register", (0, validation_1.validation)(userValidation.registerSchema), auth_service_1.default.register);
authRouter.post("/users", authentication_1.authentication, (0, authorization_1.authorization)(user_enum_1.RoleEnum.ADMIN), (0, validation_1.validation)(userValidation.createUser), auth_service_1.default.createUser);
authRouter.get("/users", authentication_1.authentication, (0, authorization_1.authorization)(user_enum_1.RoleEnum.ADMIN), auth_service_1.default.getUsers);
authRouter.get("/profile", authentication_1.authentication, auth_service_1.default.getProfile);
authRouter.delete("/users/:id", authentication_1.authentication, (0, authorization_1.authorization)(user_enum_1.RoleEnum.ADMIN), (0, validation_1.validation)(userValidation.deleteUser), auth_service_1.default.deleteUser);
authRouter.post("/users/:id/role", authentication_1.authentication, (0, authorization_1.authorization)(user_enum_1.RoleEnum.ADMIN), (0, validation_1.validation)(userValidation.updateRole), auth_service_1.default.updateUserRole);
authRouter.post("/confirm-email", (0, validation_1.validation)(userValidation.confirmEmailSchema), auth_service_1.default.confirmEmail);
authRouter.post("/login", (0, validation_1.validation)(userValidation.loginSchema), auth_service_1.default.login);
authRouter.post("/resend-otp", (0, validation_1.validation)(userValidation.resendOtpSchema), auth_service_1.default.resendOtp);
authRouter.post('/forget-password', (0, validation_1.validation)(userValidation.forgetPasswordSchema), auth_service_1.default.forgetPassword);
authRouter.post('/reset-password', (0, validation_1.validation)(userValidation.resetPasswordSchema), auth_service_1.default.resetPassword);
authRouter.post('/update-password', authentication_1.authentication, (0, validation_1.validation)(userValidation.updatePasswordSchema), auth_service_1.default.updatePassword);
authRouter.post('/logout', authentication_1.authentication, auth_service_1.default.logOut);
authRouter.post('/refresh-token', auth_service_1.default.refreshToken);
exports.default = authRouter;
