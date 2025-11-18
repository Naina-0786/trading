import { Router } from 'express';
import { subscriptionPlanController } from '../controller/subscriptoin.js';

const subscriptionRoutes = Router();

// ✅ Create a new subscription plan
subscriptionRoutes.post('/create', subscriptionPlanController.createSubscriptionPlan);

// ✅ Get all subscription plans
subscriptionRoutes.get('/all', subscriptionPlanController.getAllSubscriptionPlans);

// ✅ Get a specific subscription plan by ID
subscriptionRoutes.route('/:id')
    .get(subscriptionPlanController.getSubscriptionPlanById)
    .put(subscriptionPlanController.updateSubscriptionPlan)
    .delete(subscriptionPlanController.deleteSubscriptionPlan);

// Get all investments for a specific subscription plan
subscriptionRoutes.get('/investments/:id', subscriptionPlanController.getSubscriptionPlanInvestments);

export default subscriptionRoutes;
