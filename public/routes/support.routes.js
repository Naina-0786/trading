// routes/supportTickets.js
const express = require('express');
const router = express.Router();
const { getAllSupportTickets, getSupportTicketById, getSupportTicketsByUserId, createSupportTicket, updateSupportTicket, deleteSupportTicket, } = require('../controllers/supportTicketController');
// GET /api/support-tickets - Get all support tickets (with optional filters)
router.get('/', getAllSupportTickets);
// GET /api/support-tickets/:id - Get support ticket by ID
router.get('/:id', getSupportTicketById);
// GET /api/support-tickets/user/:userId - Get support tickets by user ID (with optional filters)
router.get('/user/:userId', getSupportTicketsByUserId);
// POST /api/support-tickets - Create a new support ticket
router.post('/', createSupportTicket);
// PUT /api/support-tickets/:id - Update a support ticket
router.put('/:id', updateSupportTicket);
// DELETE /api/support-tickets/:id - Delete a support ticket
router.delete('/:id', deleteSupportTicket);
module.exports = router;
export {};
//# sourceMappingURL=support.routes.js.map