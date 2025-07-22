// src/routes/user.routes.js
import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js'; // Adjust path as needed
import { getHiredEmployeesForClient } from '../controllers/dashboard.controller.js'; // Adjust the import path as necessary

const router = Router();

router.route('/hired-employees').post(verifyJWT, getHiredEmployeesForClient    )


export default router;