import coinbase from 'coinbase-commerce-node';
const { Client, resources } = coinbase;
Client.init(process.env.COINBASE_API_KEY || '');
const createpayment = async (req, res) => {
    const { amount, currency } = req.body;
    try {
        const charge = await resources.Charge.create({
            name: 'Test Charge',
            description: 'Test Charge Description',
            local_price: {
                amount: amount,
                currency: currency
            },
            pricing_type: 'fixed_price',
            metadata: {
                user_id: "3434",
            },
        });
        res.status(200).json({ charge });
    }
    catch (error) {
        console.error('Failed creating charge:', error);
        res.status(500).json({ error: 'Failed to create charge', details: error.message });
    }
};
const PaymentController = {
    createCharge: createpayment,
};
export default PaymentController;
//# sourceMappingURL=payment.js.map