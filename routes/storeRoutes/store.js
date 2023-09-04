const express = require('express');
const Store = require('../../models/Store');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const router = express.Router({ mergeParams: true })
const { v4: uuidv4 } = require('uuid');
const { mongoose } = require('mongoose');

const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { storage } = require('../../cloudinary');
const VisitorLog = require('../../models/VisitorLog');
const upload = multer({ storage })


router.get('/', async (req, res) => {
    const { storeID } = req.params
    try {

        if (!mongoose.Types.ObjectId.isValid(storeID)) {
            return res.status(404).json({ error: 'Store not Found' })
        }

        const store = await Store.findById(storeID)
        if (!store) {
            return res.status(404).json({ error: 'Store not Found' })
        }

        const products = await Product.find({ store: storeID })
        if (!products) {
            return res.status(404).json({ error: 'No Product has been Found' })
        }


        res.status(200).json({ store, products });



    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "An error occured when fetching store data" })
    }
})



router.put('/', upload.fields([{ name: 'storeLogo', maxCount: 1 }, { name: 'storeBanner', maxCount: 1 }]), async (req, res) => {
    try {
        const { storeID } = req.params
        let { updatedData } = req.body

        updatedData = JSON.parse(updatedData)
        const storeLogoFile = req.files['storeLogo']; // Access the storeLogo file data
        const storeBannerFile = req.files['storeBanner']; // Access the storeBanner file data

        let updateObject = {
            store_name: updatedData.storeName,
            theme: {
                buttonColor: updatedData.buttonColor,
            },
            description: updatedData.storeDescription,
            heroTitle: updatedData.storeTitle,
            socialMedia: updatedData.links,
            contactInformation: updatedData.contactInfo,
        };

        // Conditionally update store_logo if hostedLogo is defined
        if (storeLogoFile) {
            const hostedLogo = {
                path: storeLogoFile[0].path,
                filename: storeLogoFile[0].filename,
            };
            updateObject = {
                ...updateObject,
                store_logo: hostedLogo,
            };
        }

        if (storeBannerFile) {
            const hostedBanner = {
                path: storeBannerFile[0].path,
                filename: storeBannerFile[0].filename,
            };
            updateObject = {
                ...updateObject,
                store_banner: hostedBanner,
            };
        }

        const store = await Store.findByIdAndUpdate(storeID, updateObject, { new: true });

        if (!store) {
            return res.status(404).json({ error: 'Store not Found' })
        }


        res.status(201).json({ updatedStore: store, message: 'Store Updated Successfully' })

    } catch (error) {
        console.log(error)
        res.status(500).json('Something went wrong while updating Store')
    }
})


router.get('/details/:ownerEmail', async (req, res) => {
    try {

        const { storeID, ownerEmail } = req.params
        const store = await Store.findById(storeID)
        if (!store) {
            return res.status(404).json({ error: 'Store not Found' })
        }


        // Fetch orders placed today for this store
        const today = new Date();

        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const allOrders = await Order.find({ 'storeOwner.ownerEmail': ownerEmail, status: 'COMPLETED' });
        const VisitorLogToday = await VisitorLog
            .find({ storeID, date: currentDate })
            .sort({ _id: -1 }) // Sort in descending order based on the document's ObjectId
            .limit(1) // Limit the result to one document
            .findOne();



        const totalOrders = allOrders.length

        const todayOrders = allOrders.filter((order) =>
            order.create_time >= startOfDay && order.create_time < endOfDay
        );

        // Calculate total revenue
        const totalRevenue = allOrders.reduce((total, order) => total + order.totalAmount.value, 0);

        // Calculate today's revenue
        const todayRevenue = todayOrders.reduce((total, order) => total + order.totalAmount.value, 0);


        // Return store details and today's revenue as JSON
        res.json({ store, todayRevenue, totalRevenue, totalOrders, todayVisitors: VisitorLogToday?.visitorCount || 0 });


    } catch (error) {
        console.log(error)
        res.status(500).json('Something went wrong')
    }
})




// VISITOR LOG ROUTE

router.get('/visitor', async (req, res) => {
    try {
        const today = new Date();

        const { storeID } = req.params
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Find or create the visitor log entry for today
        let visitorLog = await VisitorLog.findOneAndUpdate(
            {
                storeID,
                date: currentDate
            },
            {
                $inc: { visitorCount: 1 }, // Increment the visitor count
            },
            { upsert: true, new: true }
        );

        return res.json({ visitorCount: visitorLog.visitorCount });
    } catch (error) {
        console.error('Error updating visitor count:', error);
        res.status(500).json({ error: 'Failed to update visitor count.' });
    }
});








module.exports = router