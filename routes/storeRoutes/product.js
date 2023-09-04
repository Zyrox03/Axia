const express = require('express');
const router = express.Router({ mergeParams: true })

const Product = require('../../models/Product');
const Store = require('../../models/Store');


const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { storage } = require('../../cloudinary')
const upload = multer({ storage })

router.get('/', async (req, res) => {
  const { storeID } = req.params
  const allProducts = await Product.find({ store: storeID })


  res.status(200).json({ allProducts })
})
router.get('/:productID', async (req, res) => {
  try {

    const { storeID, productID } = req.params
    const product = await Product.findOne({ store: storeID, _id: productID })


    res.status(200).json({ product })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'something went wrong' })
  }
})

router.post('/', upload.fields([

  { name: 'productImage', maxCount: 4 },
  { name: 'metaImage', maxCount: 1 }])
  ,
  async (req, res) => {
    try {


      const { storeID } = req.params;
      let {
        productName,
        productSlug,
        productCategory,
        productDescription,
        richTextDescription,
        price,
        originalPrice,
        costPrice,
        variantsArray,
        relatedProductsArray,
        metaSlug,
        metaTitle,
        metaDescription,
        productHidden
      } = req.body

      const richTextWithBase64 = richTextDescription

      const imageMatches = richTextWithBase64.match(/src="data:image\/jpeg;base64,([^"]+)"/g);

      if (imageMatches) {
        // Upload base64 images to Cloudinary and get hosted image URLs
        const cloudinaryUploadPromises = imageMatches.map(async (base64Url) => {
          const base64Image = base64Url.match(/data:image\/jpeg;base64,([^"]+)/)[1];
          try {
            const uploadResult = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Image}`);
            return uploadResult.secure_url;
          } catch (error) {
            console.error('Error uploading image to Cloudinary:', error);
            return null;
          }
        });

        const hostedImageUrls = await Promise.all(cloudinaryUploadPromises);

        // Replace base64 image URLs with hosted image URLs
        const updatedRichTextDescription = richTextWithBase64.replace(/src="data:image\/jpeg;base64,([^"]+)"/g, () => {
          const hostedImageUrl = hostedImageUrls.shift(); // Get the next hosted image URL
          return `src="${hostedImageUrl}"`;
        });


        richTextDescription = updatedRichTextDescription
      }

      variantsArray = JSON.parse(variantsArray)


      let productImage
      if (req.files.productImage && req.files.productImage.length > 0) {
        productImage = req.files.productImage.map((file) => {
          return { path: file.path, filename: file.filename };
        });
      }


      let metaImage = {};
      if (req.files.metaImage) {
        metaImage = {
          path: req.files.metaImage[0].path,
          filename: req.files.metaImage[0].filename
        }

      } else {
        metaImage = null
      }


      const { categories } = await Store.findById(storeID)
      const category = categories.find(category => category.categoryName.toString() === productCategory);


      if (category) {
        productCategory = category._id
      }

      const product = new Product({
        productName,
        productSlug,
        productCategory,
        productDescription,
        richTextDescription,
        productImage,
        price,
        originalPrice,
        costPrice,
        variantsArray,
        relatedProductsArray,
        metaSlug,
        metaTitle,
        metaDescription,
        metaImage,
        productHidden,

        store: storeID

      })

      const savedProduct = await product.save()

      res.status(200).json({ savedProduct, message: 'Product added successfully' })

    } catch (error) {
      console.log(error)
      res.status(500).json(error)
    }
  })


// UPDATE 

router.put('/:productID', upload.fields([

  { name: 'productImageFile', maxCount: 4 },
  { name: 'metaImageFile', maxCount: 1 }])
  ,
  async (req, res) => {
    try {

      const { storeID, productID } = req.params;
      let {
        productName,
        productImage,
        productSlug,
        productCategory,
        productDescription,
        richTextDescription,
        price,
        originalPrice,
        costPrice,
        variantsArray,
        relatedProductsArray,
        metaSlug,
        metaTitle,
        metaDescription,
        metaImage,
        productHidden
      } = req.body


      const richTextWithBase64 = richTextDescription

      const imageMatches = richTextWithBase64.match(/src="data:image\/jpeg;base64,([^"]+)"/g);

      if (imageMatches) {
        // Upload base64 images to Cloudinary and get hosted image URLs
        const cloudinaryUploadPromises = imageMatches.map(async (base64Url) => {
          const base64Image = base64Url.match(/data:image\/jpeg;base64,([^"]+)/)[1];
          try {
            const uploadResult = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Image}`);
            return uploadResult.secure_url;
          } catch (error) {
            console.error('Error uploading image to Cloudinary:', error);
            return null;
          }
        });

        const hostedImageUrls = await Promise.all(cloudinaryUploadPromises);

        // Replace base64 image URLs with hosted image URLs
        const updatedRichTextDescription = richTextWithBase64.replace(/src="data:image\/jpeg;base64,([^"]+)"/g, () => {
          const hostedImageUrl = hostedImageUrls.shift(); // Get the next hosted image URL
          return `src="${hostedImageUrl}"`;
        });


        richTextDescription = updatedRichTextDescription
      }

      variantsArray = JSON.parse(variantsArray)
      productImage = JSON.parse(productImage)



      let updatedProductImage = [...productImage.map((image) => ({
        path: image.dataURL,
        filename: image.filename,
      }))]

      let productImageFile
      if (req.files.productImageFile && req.files.productImageFile.length > 0) {
        productImageFile = req.files.productImageFile.map((file) => {
          return { path: file.path, filename: file.filename };
        });

        updatedProductImage.push(...productImageFile)
      }




      if (req.files.metaImageFile) {
        metaImage = {
          path: req.files.metaImageFile[0].path,
          filename: req.files.metaImageFile[0].filename
        }

      } else {
        metaImage = JSON.parse(metaImage);

      }




      const updatedProduct = await Product.findOneAndUpdate(
        { store: storeID, _id: productID },
        {
          productName,
          productImage: updatedProductImage,
          productSlug,
          productCategory,
          productDescription,
          richTextDescription,
          price,
          originalPrice,
          costPrice,
          variantsArray,
          relatedProductsArray,
          metaSlug,
          metaTitle,
          metaDescription,
          productHidden,
          metaImage
        },
        { new: true }
      );
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.status(200).json({ updatedProduct, message: 'Product updated successfully' })

    } catch (error) {
      console.log(error)
      res.status(500).json({error})
    }
  })


// delete


router.delete('/', async (req, res) => {
  try {
    const { storeID } = req.params;
    const { productsToDeleteArray } = req.body;

    // Delete products that have their IDs in the productsToDeleteArray
    const deletedProducts = await Product.deleteMany({
      _id: { $in: productsToDeleteArray },
      store: storeID,
    });

    // After deletion, fetch the updated products for the store
    const updatedProducts = await Product.find({ store: storeID });

    res.status(200).json({
      updatedProducts,
      message: `${deletedProducts.deletedCount} ${deletedProducts.deletedCount === 1 ? 'product has' : 'products have'} been deleted.`,
    })

  } catch (error) {
    console.log(error)
    res.status(500).json('something went wrong')
  }
})

router.delete('/:productID', async (req, res) => {
  try {
    const { storeID, productID } = req.params

    const deletedProduct = await Product.findByIdAndDelete(productID)


    const updatedProducts = await Product.find({ store: storeID })
    res.status(200).json({ updatedProducts, message: `${deletedProduct.productName} has been deleted.` })
  } catch (error) {
    console.log(error)
    res.status(500).json('something went wrong')
  }
})

module.exports = router  