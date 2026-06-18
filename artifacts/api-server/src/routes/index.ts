import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import audioRouter from "./audio.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(audioRouter);

export default router;
