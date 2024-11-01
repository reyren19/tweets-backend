import {Router} from 'express';
import { loginUser, registerUser } from '../controllers/user.controller.js';
import { upload } from '../middleware/multer.middleware.js';
const router = Router();

// Right before register executes, we use the multer middleware to handle file uploads to server
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser);
router.route("/login").post(loginUser);

export default router;