import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth-firebase";
import postsRouter from "./posts";
import messagesRouter from "./messages";
import usersRouter from "./users";
import adminRouter from "./admin";
import chatbotRouter from "../chatbot";
import pushRouter from "./push";
import uploadRouter from "./upload";
import ratingsRouter from "./ratings";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/posts", postsRouter);
router.use("/messages", messagesRouter);
router.use("/users", usersRouter);
router.use("/admin", adminRouter);
router.use("/chatbot", chatbotRouter);
router.use("/push", pushRouter);
router.use("/upload", uploadRouter);
router.use("/ratings", ratingsRouter);

export default router;
