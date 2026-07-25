"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const user_enum_1 = require("../../common/enums/user.enum");
const global_error_handling_1 = require("../../common/utils/global-error-handling");
const nodeMailer_1 = require("../../common/utils/email/nodeMailer");
const email_tamplete_1 = require("../../common/utils/email/email.tamplete");
const hash_1 = require("../../common/utils/security/hash");
const mongoose_1 = require("mongoose");
const encrypt_1 = require("../../common/utils/security/encrypt");
const node_crypto_1 = require("node:crypto");
const jwt_service_1 = __importDefault(require("../../common/utils/jwt/jwt.service"));
const config_service_1 = require("../../config/config.service");
const success_response_1 = require("../../common/utils/success.response");
const company_repository_1 = __importDefault(require("../../DB/repository/company.repository"));
class UserService {
    _userModel = new user_repository_1.default();
    _companyModel = new company_repository_1.default();
    _redisService = redis_service_1.default;
    _tokenService = jwt_service_1.default;
    constructor() { }
    sendEmailOtp = async ({ email, subject }) => {
        const isBlocked = await this._redisService.ttl({ key: this._redisService.block_otp_key({ email }) });
        if (isBlocked && isBlocked > 0) {
            throw new global_error_handling_1.AppError(`you have exceeded the maximum number of attempts to resend otp please try again later after ${isBlocked} seconds`, 429);
        }
        const otpTTl = await this._redisService.ttl({ key: this._redisService.otpKey({ email, subject }) });
        if (otpTTl && otpTTl > 0) {
            throw new global_error_handling_1.AppError(`you have already sent otp please check your email or try again later after ${otpTTl} seconds`, 429);
        }
        const maxOtp = await this._redisService.get({ key: this._redisService.max_otp_key({ email }) });
        if (maxOtp && maxOtp >= 3) {
            await this._redisService.setValue({ key: this._redisService.block_otp_key({ email }), value: "blocked", ttl: 60 * 5 });
            throw new global_error_handling_1.AppError(`you have exceeded the maximum number of attempts to resend otp please try again later after 300 seconds`, 429);
        }
        const otp = await (0, nodeMailer_1.sendOtp)();
        await (0, nodeMailer_1.sendEmail)({
            to: email,
            subject: "FAKHR-ERP App",
            html: (0, email_tamplete_1.templateEmail)(otp)
        });
        await this._redisService.setValue({ key: this._redisService.otpKey({ email }), value: (0, hash_1.Hash)({ plan_text: `${otp}` }), ttl: 60 * 10 });
        await this._redisService.increment({ key: email });
    };
    register = async (req, res, next) => {
        const { userName, email, password, confirmPassword, role = user_enum_1.RoleEnum.ADMIN, phone, isConfirmed = false } = req.body;
        const isEmailExist = await this._userModel.findOne({
            filter: { email }
        });
        if (isEmailExist) {
            throw new global_error_handling_1.AppError("This email already Exist", 400);
        }
        const adminId = new mongoose_1.Types.ObjectId();
        const company = await this._companyModel.create({
            name: `${userName}'s Company`,
            adminId
        });
        const otp = await (0, nodeMailer_1.sendOtp)();
        await (0, nodeMailer_1.sendEmail)({
            to: email,
            subject: "Email Confirmation",
            html: (0, email_tamplete_1.templateEmail)(otp)
        });
        await this._redisService.setValue({ key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.confirmedEmail }), value: (0, hash_1.Hash)({ plan_text: `${otp}` }), ttl: 60 * 5 });
        await this._redisService.setValue({ key: this._redisService.max_otp_key({ email }), value: "1", ttl: 60 * 30 });
        const user = await this._userModel.create({
            _id: adminId,
            userName,
            email,
            password: (0, hash_1.Hash)({ plan_text: password }),
            role,
            phone: phone ? (0, encrypt_1.encrypt)(phone) : undefined,
            isConfirmed,
            companyId: company._id
        });
        res.status(201).json({
            message: "User signed up successfully", data: user
        });
    };
    confirmEmail = async (req, res, next) => {
        const { email, otp } = req.body;
        const otpValue = await this._redisService.get({ key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.confirmedEmail }) });
        if (!otpValue) {
            throw new global_error_handling_1.AppError("OTP Expire", 400);
        }
        if (!(0, hash_1.Compare)({ plan_text: otp, cipher_text: otpValue })) {
            throw new global_error_handling_1.AppError("Invalid OTP", 400);
        }
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user) {
            throw new global_error_handling_1.AppError("User not found", 400);
        }
        const userUpdated = await this._userModel.update({ email }, { isConfirmed: true });
        await this._redisService.del({
            key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.confirmedEmail })
        });
        res.status(200).json({
            message: "Email confirmed successfully",
            data: userUpdated
        });
    };
    login = async (req, res, next) => {
        const { email, password } = req.body;
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user) {
            throw new global_error_handling_1.AppError("User not exist", 400);
        }
        if (!(0, hash_1.Compare)({ plan_text: password, cipher_text: user.password })) {
            return next(new global_error_handling_1.AppError("Invalid email or password", 400));
        }
        const uuid = (0, node_crypto_1.randomUUID)();
        const access_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secretKey: user?.role == user_enum_1.RoleEnum.user ? config_service_1.ACCESS_SECRET_KEY_USER : config_service_1.ACCESS_SECRET_KEY_ADMIN,
            options: { jwtid: uuid }
        });
        const refresh_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secretKey: user?.role == user_enum_1.RoleEnum.user ? config_service_1.REFRESH_SECRET_KEY_USER : config_service_1.REFRESH_SECRET_KEY_ADMIN,
            options: { jwtid: uuid }
        });
        return res.status(200).json({
            message: "User signed in successfully",
            data: { access_token, refresh_token }
        });
    };
    getProfile = async (req, res, next) => {
        const user = await this._userModel.findById(req.user._id);
        (0, success_response_1.successResponse)({
            res,
            message: "profile fetched success",
            data: user
        });
    };
    resendOtp = async (req, res, next) => {
        const { email } = req.body;
        const userExist = await this._userModel.findOne({ filter: { email } });
        if (!userExist) {
            throw new global_error_handling_1.AppError("User Not Exist", 400);
        }
        await this.sendEmailOtp({ email, subject: user_enum_1.EmailEnum.confirmedEmail });
        return res.status(201).json({ message: "message otp send successfully" });
    };
    forgetPassword = async (req, res, next) => {
        const { email } = req.body;
        const userExist = await this._userModel.findOne({ filter: { email } });
        if (!userExist) {
            throw new global_error_handling_1.AppError("user not found", 400);
        }
        const otp = await (0, nodeMailer_1.sendOtp)();
        await (0, nodeMailer_1.sendEmail)({
            to: email,
            subject: "Reset password OTP",
            html: (0, email_tamplete_1.templateEmail)(otp)
        });
        await this._redisService.setValue({ key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.forgetPassword }), value: (0, hash_1.Hash)({ plan_text: `${otp}` }), ttl: 60 * 10 });
        res.status(201).json({
            message: "OTP sent to email successfully"
        });
    };
    resetPassword = async (req, res, next) => {
        const { otp, email, newPassword } = req.body;
        const otpValue = await this._redisService.get({ key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.forgetPassword }) });
        if (!otpValue) {
            throw new global_error_handling_1.AppError("OTP expired", 400);
        }
        if (!(0, hash_1.Compare)({ plan_text: otp, cipher_text: otpValue })) {
            return next(new global_error_handling_1.AppError("Invalid OTP", 400));
        }
        const user = await this._userModel.findOne({
            filter: { email }
        });
        if (!user) {
            throw new global_error_handling_1.AppError("user not exist", 400);
        }
        const hashedPassword = (0, hash_1.Hash)({ plan_text: newPassword });
        await this._userModel.update({ email }, { password: hashedPassword });
        await this._redisService.del({ key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.forgetPassword }) });
        res.status(200).json({
            message: "Password reset successfully"
        });
    };
    updatePassword = async (req, res, next) => {
        const { oldPassword, newPassword } = req.body;
        if (!(0, hash_1.Compare)({ plan_text: oldPassword, cipher_text: req.user?.password })) {
            throw new global_error_handling_1.AppError("Invalid Old Password", 400);
        }
        const hashPassword = (0, hash_1.Hash)({ plan_text: newPassword });
        req.user.password = hashPassword;
        await req.user.save();
        res.status(201).json({
            message: "Password updated successfully"
        });
    };
    createUser = async (req, res, next) => {
        const { firstName, lastName, email, password, role, phone } = req.body;
        const exists = await this._userModel.findOne({
            filter: { email }
        });
        if (exists) {
            throw new global_error_handling_1.AppError("Email already exists", 409);
        }
        const hashedPassword = (0, hash_1.Hash)({ plan_text: password });
        const user = await this._userModel.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
            phone,
            isConfirmed: true,
            companyId: req.user.companyId
        });
        (0, success_response_1.successResponse)({
            res,
            status: 201,
            message: "User created successfully",
            data: user
        });
    };
    updateUserRole = async (req, res, next) => {
        const { id } = req.params;
        const { role } = req.body;
        const user = await this._userModel.findOne({
            filter: {
                _id: id
            }
        });
        if (!user) {
            throw new global_error_handling_1.AppError("User not Found", 404);
        }
        await this._userModel.update({ _id: id }, { role });
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            message: "Role updated successfully"
        });
    };
    deleteUser = async (req, res, next) => {
        const { id } = req.params;
        const user = await this._userModel.findOne({
            filter: {
                _id: id
            }
        });
        if (!user) {
            throw new global_error_handling_1.AppError("User not Found", 404);
        }
        await this._userModel.delete(user._id);
        (0, success_response_1.successResponse)({ res, message: "User deleted Success" });
    };
    getUsers = async (req, res, next) => {
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const users = await this._userModel.paginate({ page, limit });
        (0, success_response_1.successResponse)({ res, message: "users fetched success", data: users });
    };
    logOut = async (req, res, next) => {
        const token = req.headers.authorization?.split(" ")[1];
        if (token) {
            await this._redisService.setValue({ key: token, value: "invalid", ttl: 60 * 60 });
        }
        res.status(200).json({
            message: "Logged out successfully"
        });
    };
    refreshToken = async (req, res, next) => {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            throw new global_error_handling_1.AppError("Refresh token is required", 400);
        }
        let decoded;
        try {
            try {
                decoded = this._tokenService.verifyToken({
                    token: refresh_token,
                    secretKey: config_service_1.REFRESH_SECRET_KEY_USER
                });
            }
            catch {
                decoded = this._tokenService.verifyToken({
                    token: refresh_token,
                    secretKey: config_service_1.REFRESH_SECRET_KEY_ADMIN
                });
            }
        }
        catch (error) {
            throw new global_error_handling_1.AppError("Invalid or expired refresh token", 401);
        }
        const user = await this._userModel.findById(decoded.id);
        if (!user) {
            throw new global_error_handling_1.AppError("User not found", 404);
        }
        const access_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secretKey: user.role === user_enum_1.RoleEnum.user
                ? config_service_1.ACCESS_SECRET_KEY_USER
                : config_service_1.ACCESS_SECRET_KEY_ADMIN,
        });
        return res.status(200).json({
            message: "Token refreshed successfully",
            data: { access_token }
        });
    };
}
exports.default = new UserService();
