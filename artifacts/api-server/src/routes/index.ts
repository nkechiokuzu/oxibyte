import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import walletRouter from "./wallet";
import profileRouter from "./profile";
import collectionPointsRouter from "./collection-points";
import devRouter from "./dev";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(walletRouter);
router.use(profileRouter);
router.use(collectionPointsRouter);
router.use(devRouter);

export default router;
