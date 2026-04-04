import express from "express";
import { loginUser, register } from "../controllers/userController.js";

const userRouter=express.Router();

userRouter.post('/register',register);
userRouter.post('/login',loginUser);

export default userRouter;