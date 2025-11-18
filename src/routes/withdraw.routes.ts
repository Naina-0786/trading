import { Router } from 'express';
import { withdrawalController } from '../controller/withdraw.js';

const withdrawalRoutes = Router();

// Create a new withdrawal
withdrawalRoutes.post('/create', withdrawalController.createWithdrawal);

// Get all withdrawals
withdrawalRoutes.get('/all', withdrawalController.getAllWithdrawals);

// Routes for a specific withdrawal by ID
withdrawalRoutes.route('/:id')
  .get(withdrawalController.getWithdrawalById)
  .put(withdrawalController.updateWithdrawal)
  .delete(withdrawalController.deleteWithdrawal);

// Get withdrawals by user ID
withdrawalRoutes.get('/user/:userId', withdrawalController.getWithdrawalsByUserId);

export default withdrawalRoutes;
