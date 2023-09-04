const express = require('express');
const router = express.Router({ mergeParams: true })
const mongoose = require('mongoose')

const Store = require('../../models/Store')
const Product = require('../../models/Product')


const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { storage } = require('../../cloudinary');
const upload = multer({ storage })

router.get('/', async (req, res) => {
    try {
        const { storeID } = req.params
        const { categories } = await Store.findById(storeID)
        res.status(200).json({ categories })

    } catch (error) {
        console.log(error)
        res.status(500).json('something went wrong')
    }
})
router.get('/:categoryID', async (req, res) => {
    try {
        const { storeID, categoryID } = req.params

        if (!mongoose.Types.ObjectId.isValid(storeID)) {
            return res.status(404).json({ error: 'Store not Found' })
        }
        if (!mongoose.Types.ObjectId.isValid(categoryID)) {
            return res.status(404).json({ error: 'Category not Found' })
        }

        const store = await Store.findById(storeID)

        if (!store) {
            return res.status(404).json({ error: 'Store not Found' })
        }

        const category = store.categories.find((category) => category._id.toString() === categoryID);


        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }


        const categoryProducts = await Product.find({ productCategory: categoryID })

        res.status(200).json({ store, category, categoryProducts })

    } catch (error) {
        console.log(error)
        res.status(500).json('something went wrong')
    }
})

router.post('/', upload.single('categoryCover'), async (req, res) => {
    try {
        const { storeID } = req.params;
        const { categoryName, categoryDescription } = req.body;


        // Find the store by its ID
        const store = await Store.findById(storeID);

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }


        let categoryCover
        if (req.file) {
            categoryCover = {
                path: req.file.path,
                filename: req.file.filename
            }
        }

        // Create a new category object
        const newCategory = {
            categoryName,
            categoryDescription,
            categoryCover,
            created_at: new Date(),
        };

        // Push the new category to the categories array in the store document
        store.categories.push(newCategory);

        // Save the updated store document
        const updatedStore = await store.save();

        res.status(200).json({ categories: updatedStore.categories, message: 'Category has been added successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json('Something went wrong');
    }
});
router.put('/:categoryID', upload.single('categoryCover'), async (req, res) => {
    try {
        const { storeID, categoryID } = req.params;
        const { categoryName, categoryDescription } = req.body;

        // Find the store by its ID
        const store = await Store.findById(storeID);

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Find the category to be updated by its ID
        const categoryIndex = store.categories.findIndex((category) => category._id.toString() === categoryID);

        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Get the existing category cover data
        const existingCategoryCover = store.categories[categoryIndex].categoryCover;

        let categoryCover = existingCategoryCover; // Initialize with the existing data

        // Check if a new categoryCover file has been uploaded
        if (req.file) {
            categoryCover = {
                path: req.file.path,
                filename: req.file.filename,
            };
        }


        // Update the category data
        store.categories[categoryIndex].categoryName = categoryName;
        store.categories[categoryIndex].categoryDescription = categoryDescription;
        store.categories[categoryIndex].categoryCover = categoryCover;

        // Save the updated store document
        const updatedStore = await store.save();

        res.status(200).json({ categories: updatedStore.categories, message: 'Category has been updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json('Something went wrong');
    }
});

router.delete('/:categoryID', async (req, res) => {

    try {
        const { storeID, categoryID } = req.params;
        let { deleteRelatedProducts } = req.body;
        // Find the store by its ID
        const store = await Store.findById(storeID);

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Find the category to delete
        const category = store.categories.find(category => category._id.toString() === categoryID);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        deleteRelatedProducts = JSON.parse(deleteRelatedProducts);

        if (deleteRelatedProducts) {
            const productsToDelete = await Product.find({ store: storeID, productCategory: category._id });
            for (const product of productsToDelete) {
                await product.deleteOne();
            }
        } else {

            // Set productCategory to an empty string for all products that belong to the category
            await Product.updateMany({ store: storeID, productCategory: category._id }, { productCategory: '' });
        }

        // Remove the category from the categories array using splice
        const categoryIndex = store.categories.findIndex(category => category._id.toString() === categoryID);
        store.categories.splice(categoryIndex, 1);

        // Save the updated store document
        const updatedStore = await store.save();

        res.status(200).json({ categories: updatedStore.categories, message: 'Category has been deleted' });
    } catch (error) {
        console.log(error);
        res.status(500).json('Something went wrong');
    }
});



module.exports = router  