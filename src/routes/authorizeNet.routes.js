import { Router } from 'express';
import { processAuthorizeNetPayment, testAuthorizeNetPayment } from '../controllers/authorizeNet.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js'; // if you want protection

const router = Router();

// Protected if you need authentication
router.post("/pay", verifyJWT, processAuthorizeNetPayment);

router.post("/pay-test", testAuthorizeNetPayment);

export default router;
