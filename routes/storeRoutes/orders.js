const express = require('express');
const router = express.Router({ mergeParams: true })
const mongoose = require('mongoose')

const he = require('he');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const Order = require('../../models/Order');


const generateAccessToken = require('../../getAccessTokenPayPal')
const handleResponse = require('../../handleResponse');
const Product = require('../../models/Product');
const base = 'https://api.sandbox.paypal.com'


const createOrder = async (address, orderItems, payeeEmail, payeeMerchantID) => {

    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;


    // Initialize the payload structure
    const payload = {
        intent: 'CAPTURE',
        purchase_units: [
            {
                items: [],
                amount: {
                    currency_code: 'USD',
                    value: '0.00',
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: '0.00'
                        },
                        // "shipping": {
                        // "currency_code": "str",
                        // "value": "string"
                        // },
                        // "handling": {
                        // "currency_code": "str",
                        // "value": "string"
                        // },
                        // "tax_total": {
                        // "currency_code": "str",
                        // "value": "string"
                        // },
                        // "insurance": {
                        // "currency_code": "str",
                        // "value": "string"
                        // },
                        // "shipping_discount": {
                        // "currency_code": "str",
                        // "value": "string"
                        // },
                        // "discount": {
                        // "currency_code": "str",
                        // "value": "string"
                        // }
                    }
                },
                shipping: {
                    //           "type": "SHIPPING",
                    // "name": {
                    // "given_name": "string",
                    // "surname": "string"
                    // },
                    address: {}
                },
                payee: {
                    email_address: payeeEmail,
                    merchant_id: payeeMerchantID

                },
                payment_instruction: {
                    disbursement_mode: "INSTANT",
                    platform_fees: [
                        {
                            amount: {
                                currency_code: "USD",
                                value: "0.00"
                            },
                            payee: {
                                email_address: "sb-gkdyr27021114@business.example.com",
                                merchant_id: "CNVQBJC5QA6YS"
                            }
                        }
                    ]
                }
            }
        ]
    };



    const platformFeePercentage = 0.02; // 2% fee for the platform
    let grossTotal = 0;

    // Populate the items array in the payload

    for (const itemData of orderItems) {

        const itemTotal = parseFloat(itemData.price) * parseInt(itemData.cartVariants.quantity);
        grossTotal += itemTotal;

        const maxLength = 127; // Example length limit for description
        const truncatedDescription = itemData.productDescription.slice(0, maxLength);

        const item = {
            name: itemData.productName,
            description: truncatedDescription,
            quantity: itemData.cartVariants.quantity.toString(),
            unit_amount: {
                currency_code: 'USD',
                value: itemData.price
            }
        };

        payload.purchase_units[0].items.push(item);
    }


    const platformFee = grossTotal * platformFeePercentage;
    const netAmount = grossTotal


    // Update the payload amounts
    payload.purchase_units[0].amount.breakdown.item_total.value = grossTotal.toFixed(2);
    payload.purchase_units[0].payment_instruction.platform_fees[0].amount.value = platformFee.toFixed(2);
    payload.purchase_units[0].amount.value = netAmount.toFixed(2); // Net amount after fees


    // Update the shipping address
    payload.purchase_units[0].shipping.address = address;

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    return handleResponse(response);
};


const getOrderDetailsPAYPAL = async (orderID) => {

    const accessToken = await generateAccessToken();

    const url = `${base}/v2/checkout/orders/${orderID}`;

    const response = await fetch(url, {
        method: "get",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // PRODUCTION ONLY => 'PayPal-Partner-Attribution-Id: &lt;BN-Code&gt;'
        }
    });

    return handleResponse(response);
};



const saveOrder = async (orderID, cartItems) => {
    try {
        const orderDetails = await getOrderDetailsPAYPAL(orderID)
        const itemsArray = orderDetails.purchase_units[0].items.map(item => {
            // Find the matching cartItem based on name
            const cartItem = cartItems.find(cartItem => cartItem.productName === item.name);


            // Extract variants and productImage from the cartItem
            const variantsArray = cartItem
                ? Object.entries(cartItem.cartVariants).map(([name, value]) => ({ name, value }))
                : [];

            const productImage = cartItem ? cartItem.productImage[0].path : '';
            return {
                _id: cartItem._id,
                name: item.name,
                unit_price: parseFloat(item.unit_amount.value),
                quantity: parseInt(item.quantity),
                currency_code: item.unit_amount.currency_code,
                productImage,
                variantsArray,
            };
        });

        const newOrder = new Order({
            orderID: orderDetails.id,
            storeOwner: {
                // ownerID: orderDetails.purchase_units[0].payee.merchant_id,
                ownerEmail: orderDetails.purchase_units[0].payee.email_address
            },
            captureID: orderDetails.purchase_units[0].payments.captures[0].id,
            status: orderDetails.status,
            payerName: `${orderDetails.payer.name.given_name} ${orderDetails.payer.name.surname}`,
            payerEmail: orderDetails.payer.email_address,
            paymentMethod: 'PayPal', // Set the payment method based on your requirement
            totalAmount: orderDetails.purchase_units[0].amount,
            items: itemsArray,
            shippingAddress: orderDetails.purchase_units[0].shipping.address,
            create_time: new Date(orderDetails.create_time),
            update_time: new Date(orderDetails.update_time),
        });

        await newOrder.save();

        // Increment orderCount for each ordered product
        for (const item of itemsArray) {
            console.log(item)
            const product = await Product.findById(item._id);

            if (product) {
                // Increment the orderCount field for the product by 1
                product.orderCount += 1;

                // Save the updated product
                await product.save();
            }


        }

    } catch (error) {
        console.log(error)
    }
}



const capturePayment = async (orderID) => {
    const accessToken = await generateAccessToken();

    const url = `${base}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        }
    });

    return handleResponse(response);
};




router.get("/", async (req, res) => {
    try {

        const { ownerEmail } = req.query; // Get the store owner's email from the query parameter

        // Fetch orders associated with the provided ownerEmail
        const orders = await Order.find({ 'storeOwner.ownerEmail': ownerEmail })
            .sort({ create_time: -1 }) // Sort by create_time in descending order
            .exec();

        res.status(200).json({ orders });

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Failed to get orders." });

    }
})

router.get("/:orderID", async (req, res) => {
    try {
        const { orderID } = req.params;

        const orderDetails = await Order.findOne({ orderID })
        if (!orderDetails) {
            return res.status(404).json({ error: `Order " ${orderID} " not Found` })
        }
        res.status(200).json(orderDetails);
    } catch (error) {
        console.error("Failed to get order details:", error);
        res.status(500).json({ error: "Failed to get order details." });
    }
});


router.post("/", async (req, res) => {
    try {
        const { orderItems, address, payeeEmail, payeeMerchantID } = req.body

        const decodedOrderItems = he.decode(orderItems);
        const decodedAddress = he.decode(address);

        // Parse the JSON string
        const jsonOrderItems = JSON.parse(decodedOrderItems);
        const jsonAddress = JSON.parse(decodedAddress);

        const response = await createOrder(jsonAddress, jsonOrderItems, payeeEmail, payeeMerchantID);
        res.json(response);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
});

router.post("/:orderID/capture", async (req, res) => {
    try {
        const { orderID } = req.params;
        const { cartItems } = req.body;
        const decodedCartItems = he.decode(cartItems);
        const jsonCartItems = JSON.parse(decodedCartItems);
        const capturedOrder = await capturePayment(orderID);
        await saveOrder(orderID, jsonCartItems);
        res.json(capturedOrder);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
});

function generatePayPalLikeOrderID() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 16;
    let orderID = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        orderID += characters.charAt(randomIndex);
    }

    return orderID;
}

router.post("/cod", async (req, res) => {
    try {
        let { codInfo, ownerEmail, orderItems } = req.body;
        codInfo = JSON.parse(codInfo)



        const decodedCartItems = he.decode(orderItems);
        const jsonCartItems = JSON.parse(decodedCartItems);




        const itemsArray = jsonCartItems.map(item => {
            const variantsArray = item
                ? Object.entries(item.cartVariants).map(([name, value]) => ({ name, value }))
                : [];
            const quantity = variantsArray.find(variant => variant.name === 'quantity').value
            const productImage = item.productImage[0].path || ''
            const unit_price = parseFloat(item.price);

            return {
                _id: item._id,
                name: item.productName,
                unit_price,
                quantity,
                currency_code: 'USD',
                productImage,
                variantsArray, // Make sure to define and populate this array
            };

        })

        const orderTotal = itemsArray.reduce((total, item) => total + item.unit_price * item.quantity, 0);

        const orderID = generatePayPalLikeOrderID(); // Generate a PayPal-like order ID

        const order = new Order({
            orderID,
            storeOwner: {
                // ownerID: orderDetails.purchase_units[0].payee.merchant_id,
                ownerEmail
            },
            status: 'PENDING',
            payerName: codInfo.name || '',
            payerEmail: codInfo.email || '',
            payerPhone: codInfo.phone || '',
            paymentMethod: 'COD', // Set the payment method based on your requirement
            totalAmount: {
                value: orderTotal,
                currency_code: 'USD'
            },
            items: itemsArray,
            shippingAddress: codInfo.address || '',

            notes: codInfo.notes,
            create_time: new Date(),
            update_time: new Date(),

        })

        await order.save()


        // Increment orderCount for each ordered product
        for (const item of itemsArray) {
            const product = await Product.findById(item._id);

            if (product) {
                // Increment the orderCount field for the product by 1
                product.orderCount += 1;

                // Save the updated product
                await product.save();
            }


        }



        res.status(200).json({ codOrder: order });
    } catch (error) {
        console.error("Failed to create cod order:", error);
        res.status(500).json({ error: "Failed to create cod order." });
    }
});



router.put('/status/:orderID', async (req, res) => {
    try {
        const { orderID } = req.params
        const { updatedStatus } = req.body

        const order = await Order.findOne({ orderID })

        if (!order) {
            res.status(404).json('Order not Found')
        }
        order.status = updatedStatus

        order.save()

        res.status(201).json({ updatedOrder: order })

    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
})

module.exports = router  
