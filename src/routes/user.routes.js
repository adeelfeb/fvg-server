// src/routes/user.routes.js
import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js'; // Adjust path as needed
import { getHiredEmployeesForClient, saveEmployeesForClient, unsaveEmployeesForClient, getSavedEmployeesForClient } from '../controllers/dashboard.controller.js'; // Adjust the import path as necessary

const router = Router();

router.route('/hired-employees').post(verifyJWT, getHiredEmployeesForClient    )
router.route('/save-employee').post(verifyJWT, saveEmployeesForClient    )
router.route('/unsave-employee').post(verifyJWT, unsaveEmployeesForClient    )
router.route('/all-saved-employees').post(verifyJWT, getSavedEmployeesForClient    )


export default router;