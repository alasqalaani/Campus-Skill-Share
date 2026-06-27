import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import postsRouter from "./posts";
import messagesRouter from "./messages";
import usersRouter from "./users";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/posts", postsRouter);
router.use("/messages", messagesRouter);
router.use("/users", usersRouter);
router.use("/admin", adminRouter);

export default router;
