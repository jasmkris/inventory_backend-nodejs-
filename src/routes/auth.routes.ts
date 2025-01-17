import express from 'express';
import { body } from 'express-validator';
import { register, login, verifyEmail } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { upload as uploadMiddleware } from '../middleware/upload';
import { Request, Response, NextFunction } from 'express';
const router = express.Router();

router.post(
  '/register', uploadMiddleware.single('selfie'),
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty().trim(),
    body('confirmPassword')
      .notEmpty()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      })
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    register(req, res).catch(next);
  }
);

router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ]),
  login
);

router.post(
  '/verify-email',
  validate([
    body('token').notEmpty()
  ]),
  verifyEmail
);

export default router; 