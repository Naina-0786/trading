
import coinbase from 'coinbase-commerce-node';


const { Client, resources,webhook} = coinbase as any;

Client.init(process.env.COINBASE_API_KEY || '');

const createpayment = async (req: any, res: any) => {
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
    } catch (error: any) {
        console.error('Failed creating charge:', error);
        res.status(500).json({ error: 'Failed to create charge', details: error.message });
    }
};



const verifypayment = async (req:any, res:any) => {
    const event = webhook.verifyEventBody(
        req.rawBody,
        req.headers['x-cc-webhook-signature'],
        process.env.COINBASE_WEBHOOK_SECRET || ''
    );

    if (event.type === 'charge:confirmed') {
    let amount = event.data.pricing.local.amount;
    let currency = event.data.pricing.local.currency;
    let user_id = event.data.metadata.user_id;

       // Handle confirmed charge (e.g., update order status, notify user)
    }
}

const PaymentController = {
    createCharge: createpayment,
};


export default PaymentController;