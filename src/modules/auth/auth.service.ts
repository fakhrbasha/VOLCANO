import { NextFunction, Request, Response } from "express";
import UserRepository from "../../DB/repository/user.repository";
import redisService from "../../common/services/redis.service";
import { EmailEnum, RoleEnum } from "../../common/enums/user.enum";
import { AppError } from "../../common/utils/global-error-handling";
import { sendEmail, sendOtp } from "../../common/utils/email/nodeMailer";
import { eventEmitter } from "../../common/utils/email/email.event";
import { templateEmail } from "../../common/utils/email/email.tamplete";
import { Compare, Hash } from "../../common/utils/security/hash";
import { HydratedDocument, Types } from "mongoose";
import { IUser } from "../../DB/models/user.model";
import { IRegisterType } from "./auth.dto";
import { encrypt } from "../../common/utils/security/encrypt";
import { randomUUID } from "node:crypto"
import TokenService from "../../common/utils/jwt/jwt.service";
import { ACCESS_SECRET_KEY_ADMIN, ACCESS_SECRET_KEY_USER, REFRESH_SECRET_KEY_ADMIN, REFRESH_SECRET_KEY_USER } from "../../config/config.service";
import { successResponse } from "../../common/utils/success.response";
import CompanyRepository from "../../DB/repository/company.repository";
class UserService {
    private readonly _userModel = new UserRepository()
    private readonly _companyModel = new CompanyRepository()
    private readonly _redisService = redisService
    private readonly _tokenService = TokenService
    constructor() { }

    sendEmailOtp = async ({ email, subject }: { email: string, subject: EmailEnum }) => {
        const isBlocked = await this._redisService.ttl({ key: this._redisService.block_otp_key({ email }) })
        if (isBlocked && isBlocked > 0) {
            throw new AppError(`you have exceeded the maximum number of attempts to resend otp please try again later after ${isBlocked} seconds`, 429)
        }
        const otpTTl = await this._redisService.ttl({ key: this._redisService.otpKey({ email, subject }) })
        if (otpTTl && otpTTl > 0) {
            throw new AppError(`you have already sent otp please check your email or try again later after ${otpTTl} seconds`, 429)
        }
        const maxOtp = await this._redisService.get({ key: this._redisService.max_otp_key({ email }) })
        if (maxOtp && maxOtp >= 3) {
            await this._redisService.setValue({ key: this._redisService.block_otp_key({ email }), value: "blocked", ttl: 60 * 5 })
            throw new AppError(`you have exceeded the maximum number of attempts to resend otp please try again later after 300 seconds`, 429)
        }
        const otp = await sendOtp()
        await sendEmail({
            to: email,
            subject: "FAKHR-ERP App",
            html: templateEmail(otp)
        })

        await this._redisService.setValue({ key: this._redisService.otpKey({ email }), value: Hash({ plan_text: `${otp}` }), ttl: 60 * 10 })
        await this._redisService.increment({ key: email })



    }
    register = async (req: Request, res: Response, next: NextFunction) => {
        const { userName, email, password, confirmPassword, role = RoleEnum.ADMIN, phone, isConfirmed = false }: IRegisterType = req.body

        const isEmailExist = await this._userModel.findOne({
            filter: { email }
        })
        if (isEmailExist) {
            throw new AppError("This email already Exist", 400)
        }

        // ─── 1. Generate a stable adminId so company & user can reference each other ───
        const adminId = new Types.ObjectId()

        // ─── 2. Create the company for this admin ────────────────────────────────────
        const company = await this._companyModel.create({
            name: `${userName}'s Company`,
            adminId
        })

        const otp = await sendOtp()
        await sendEmail({
            to: email,
            subject: "Email Confirmation",
            html: templateEmail(otp)
        })
        await this._redisService.setValue({ key: this._redisService.otpKey({ email, subject: EmailEnum.confirmedEmail }), value: Hash({ plan_text: `${otp}` }), ttl: 60 * 5 })
        await this._redisService.setValue({ key: this._redisService.max_otp_key({ email }), value: "1", ttl: 60 * 30 })

        // ─── 3. Create the user tied to the company ───────────────────────────────────
        const user: HydratedDocument<IUser> = await this._userModel.create({
            _id: adminId,
            userName,
            email,
            password: Hash({ plan_text: password }),
            role,
            phone: phone ? encrypt(phone) : undefined,
            isConfirmed,
            companyId: company._id
        })
        res.status(201).json({
            message: "User signed up successfully", data: user
        })
    }

    confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
        const { email, otp } = req.body
        const otpValue = await this._redisService.get({ key: this._redisService.otpKey({ email, subject: EmailEnum.confirmedEmail }) })
        if (!otpValue) {
            throw new AppError("OTP Expire", 400)
        }
        if (!Compare({ plan_text: otp, cipher_text: otpValue })) {
            throw new AppError("Invalid OTP", 400)
        }
        const user = await this._userModel.findOne({ filter: { email } })
        if (!user) {
            throw new AppError("User not found", 400)
        }
        const userUpdated = await this._userModel.update({ email }, { isConfirmed: true })

        await this._redisService.del({
            key: this._redisService.otpKey({ email, subject: EmailEnum.confirmedEmail })
        })
        res.status(200).json({
            message: "Email confirmed successfully",
            data: userUpdated
        });
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body

        const user = await this._userModel.findOne({ filter: { email } })

        if (!user) {
            throw new AppError("User not exist", 400)
        }
        if (!Compare({ plan_text: password, cipher_text: user.password })) {
            return next(new AppError("Invalid email or password", 400));
        }
        const uuid = randomUUID()
        const access_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secretKey: user?.role == RoleEnum.user ? ACCESS_SECRET_KEY_USER! : ACCESS_SECRET_KEY_ADMIN!,
            options: { jwtid: uuid }
        })
        const refresh_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secretKey: user?.role == RoleEnum.user ? REFRESH_SECRET_KEY_USER! : REFRESH_SECRET_KEY_ADMIN!,
            options: { jwtid: uuid }
        })
        return res.status(200).json({
            message: "User signed in successfully",
            data: { access_token, refresh_token }
        });

    }

    getProfile = async (req: Request, res: Response, next: NextFunction) => {

        const user = await this._userModel.findById(req.user._id)

        successResponse({
            res,
            message: "profile fetched success",
            data: user
        })
    }
    // resend otp

    resendOtp = async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body
        const userExist = await this._userModel.findOne({ filter: { email } })
        if (!userExist) {
            throw new AppError("User Not Exist", 400)
        }
        await this.sendEmailOtp({ email, subject: EmailEnum.confirmedEmail })
        return res.status(201).json({ message: "message otp send successfully" })
    }

    // forget pass
    forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body
        const userExist = await this._userModel.findOne({ filter: { email } })
        if (!userExist) {
            throw new AppError("user not found", 400)
        }

        const otp = await sendOtp()
        await sendEmail({
            to: email,
            subject: "Reset password OTP",
            html: templateEmail(otp)
        })

        await this._redisService.setValue({ key: this._redisService.otpKey({ email, subject: EmailEnum.forgetPassword }), value: Hash({ plan_text: `${otp}` }), ttl: 60 * 10 })
        res.status(201).json({
            message: "OTP sent to email successfully"
        })
    }

    // reset pass

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        const { otp, email, newPassword } = req.body

        const otpValue = await this._redisService.get({ key: this._redisService.otpKey({ email, subject: EmailEnum.forgetPassword }) })

        if (!otpValue) {
            throw new AppError("OTP expired", 400)
        }

        if (!Compare({ plan_text: otp, cipher_text: otpValue })) {
            return next(new AppError("Invalid OTP", 400));
        }

        const user = await this._userModel.findOne({
            filter: { email }
        })

        if (!user) {
            throw new AppError("user not exist", 400)
        }

        const hashedPassword = Hash({ plan_text: newPassword })

        await this._userModel.update({ email }, { password: hashedPassword })
        // console.log(hashedPassword)
        await this._redisService.del({ key: this._redisService.otpKey({ email, subject: EmailEnum.forgetPassword }) })

        res.status(200).json({
            message: "Password reset successfully"
        });

    }


    // update password

    updatePassword = async (req: Request, res: Response, next: NextFunction) => {
        const { oldPassword, newPassword } = req.body

        if (!Compare({ plan_text: oldPassword, cipher_text: req.user?.password })) {
            throw new AppError("Invalid Old Password", 400)
        }

        const hashPassword = Hash({ plan_text: newPassword })

        req.user!.password = hashPassword
        await req.user!.save()
        res.status(201).json({
            message: "Password updated successfully"
        });
    }

    createUser = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        const {
            firstName,
            lastName,
            email,
            password,
            role,
            phone
        } = req.body;

        const exists =
            await this._userModel.findOne({
                filter: { email }
            });

        if (exists) {
            throw new AppError(
                "Email already exists",
                409
            );
        }

        const hashedPassword = Hash({ plan_text: password })

        const user =
            await this._userModel.create({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                phone,
                isConfirmed: true,
                companyId: req.user.companyId
            });
        // console.log("User CompanyId:", req.user.companyId);
        successResponse({
            res,
            status: 201,
            message:
                "User created successfully",
            data: user
        });
    };
    updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        const { role } = req.body;
        const user = await this._userModel.findOne({
            filter: {
                _id: id
            }
        })
        if (!user) {
            throw new AppError("User not Found", 404)
        }
        await this._userModel.update(
            { _id: id },
            { role }
        );

        return successResponse({
            res,
            status: 200,
            message:
                "Role updated successfully"
        });
    }

    deleteUser = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        const user = await this._userModel.findOne({
            filter: {
                _id: id
            }
        })
        if (!user) {
            throw new AppError("User not Found", 404)
        }
        await this._userModel.delete(user._id)
        successResponse({ res, message: "User deleted Success" })
    }

    getUsers = async (req: Request, res: Response, next: NextFunction) => {
        const page = Number(req.query.page)
        const limit = Number(req.query.limit)
        const users = await this._userModel.paginate({ page, limit })


        successResponse({ res, message: "users fetched success", data: users })
    }
    // logOut

    logOut = async (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers.authorization?.split(" ")[1]
        if (token) {
            await this._redisService.setValue({ key: token, value: "invalid", ttl: 60 * 60 })
        }
        res.status(200).json({
            message: "Logged out successfully"
        });

    }

    refreshToken = async (req: Request, res: Response, next: NextFunction) => {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            throw new AppError("Refresh token is required", 400);
        }

        let decoded: any;

        try {
            try {
                decoded = this._tokenService.verifyToken({
                    token: refresh_token,
                    secretKey: REFRESH_SECRET_KEY_USER!
                });
            } catch {
                decoded = this._tokenService.verifyToken({
                    token: refresh_token,
                    secretKey: REFRESH_SECRET_KEY_ADMIN!
                });
            }

        } catch (error) {
            throw new AppError("Invalid or expired refresh token", 401);
        }

        const user = await this._userModel.findById(decoded.id);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const access_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secretKey: user.role === RoleEnum.user
                ? ACCESS_SECRET_KEY_USER!
                : ACCESS_SECRET_KEY_ADMIN!,
        });

        return res.status(200).json({
            message: "Token refreshed successfully",
            data: { access_token }
        });
    };
}
export default new UserService();