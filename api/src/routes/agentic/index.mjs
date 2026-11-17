import express from 'express';
import learnRouter from './learn.mjs';
import earnRouter from './earn.mjs';
import burnRouter from './burn.mjs';
import agentsRouter from '../agents.mjs';

const router = express.Router();

router.use('/learn', learnRouter);
router.use('/earn', earnRouter);
router.use('/burn', burnRouter);
router.use('/agents', agentsRouter);

export default router;
