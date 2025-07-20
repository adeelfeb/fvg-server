import { Router } from 'express';
import { updateVpcPrice } from '../controllers/admin.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

import { verifyAdmin } from '../middlewares/auth.verifyAdmin.js';    

const router = Router();

// PUBLIC ROUTES
router.route("/update-vp-price").post(verifyJWT, verifyAdmin, updateVpcPrice);

// SECURED ROUTES (Example)
// router.route("/logout").post(verifyJWT, logoutUser);

export default router;