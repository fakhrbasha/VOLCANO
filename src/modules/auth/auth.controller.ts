import { Router } from "express";
import { validation } from "../../common/middleware/validation";
import * as userValidation from "./auth.validation";
import UserService from './auth.service'
import { authentication } from "../../common/middleware/authentication";
import { authorization } from "../../common/middleware/authorization";
import { RoleEnum } from "../../common/enums/user.enum";
const authRouter = Router()

authRouter.post("/register", validation(userValidation.registerSchema), UserService.register)
authRouter.post("/users", authentication, authorization(RoleEnum.ADMIN), validation(userValidation.createUser), UserService.createUser)
authRouter.get("/users", authentication, authorization(RoleEnum.ADMIN), UserService.getUsers)
authRouter.get("/profile", authentication, UserService.getProfile)
authRouter.delete("/users/:id", authentication, authorization(RoleEnum.ADMIN), validation(userValidation.deleteUser), UserService.deleteUser)
authRouter.post("/users/:id/role", authentication, authorization(RoleEnum.ADMIN), validation(userValidation.updateRole), UserService.updateUserRole)
authRouter.post("/confirm-email", validation(userValidation.confirmEmailSchema), UserService.confirmEmail)
authRouter.post("/login", validation(userValidation.loginSchema), UserService.login)
authRouter.post("/resend-otp", validation(userValidation.resendOtpSchema), UserService.resendOtp)
authRouter.post('/forget-password', validation(userValidation.forgetPasswordSchema), UserService.forgetPassword)
authRouter.post('/reset-password', validation(userValidation.resetPasswordSchema), UserService.resetPassword)
authRouter.post('/update-password', authentication, validation(userValidation.updatePasswordSchema), UserService.updatePassword)
authRouter.post('/logout', authentication, UserService.logOut)
authRouter.post('/refresh-token', UserService.refreshToken)

export default authRouter