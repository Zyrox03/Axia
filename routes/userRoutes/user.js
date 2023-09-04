const express = require('express');
const router = express.Router({ mergeParams: true })
const mongoose = require('mongoose');

const User = require('../../models/Users')
const Store = require('../../models/Store');

const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { storage } = require('../../cloudinary')
const upload = multer({ storage })

const authenticateToken = require('../../middleware/authenticateTokenMiddleware');
const { isProfileOwner } = require('../../middleware/authorizationMiddleware');


router.get('/', authenticateToken, isProfileOwner, async (req, res) => {
    try {

        const { firebaseID } = req.params
        const user = await User.findOne({ firebaseID })

        if (!user) {
            return res.status(404).json({ error: 'User not fouund' });
        }

        const userStore = user.platforms.find(platform => platform.platform === 'store');
        const storeID = userStore ? userStore.storeID : null;

        if (!mongoose.Types.ObjectId.isValid(storeID)) {
            return res.status(404).json({ error: 'Store not Found' })
        }

        const store = await Store.findById(storeID)
        if (!store) {
            return res.status(404).json({ error: 'Store not Found' })
        }


        res.status(200).json({ userData: JSON.stringify(user), store });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }

})



router.post('/', authenticateToken, isProfileOwner, async (req, res) => {
    try {
        const { firebaseID } = req.params;
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            if (!existingUser.emailVerified || !existingUser.location) {
                // Update emailVerified and location if needed
                existingUser.emailVerified = req.body.emailVerified || existingUser.emailVerified;
                existingUser.location = req.body.location ? req.body.location : existingUser.location;
                const savedUser = await existingUser.save();
                return res.status(200).json({
                    savedUser: JSON.stringify(savedUser),
                });
            }

            const userStore = existingUser.platforms.find(platform => platform.platform === 'store');
            const storeID = userStore ? userStore.storeID : null;

            if (!mongoose.Types.ObjectId.isValid(storeID)) {
                return res.status(404).json({ error: 'Store not Found' })
            }

            const store = await Store.findById(storeID)
            if (!store) {
                return res.status(404).json({ error: 'Store not Found' })
            }


            return res.status(200).json({
                savedUser: JSON.stringify(existingUser),
                store
            });

        } else {

            const preUserAlias = req.body.displayName.replace(/[\s\W]+/g, '') + Date.now()
            const storeID = new mongoose.Types.ObjectId();

            // User doesn't exist, create a new user
            const newUser = new User({
                firebaseID,
                username: req.body.displayName,
                email: req.body.email,
                emailVerified: req.body.emailVerified,
                expertise: '',
                profileFirstName: req.body.displayName,
                phoneNumber: '',
                profilePicture: {
                    path:
                        req.body.photoURL ||
                        "https://w7.pngwing.com/pngs/146/551/png-transparent-user-login-mobile-phones-password-user-miscellaneous-blue-text.png",
                    filename: '',
                },
                bannerPicture: {
                    path:
                        'https://images.unsplash.com/photo-1489183988443-b37b7e119ba6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=872&q=80',
                    filename: '',
                },
                platforms: [{
                    platform: 'store',
                    userAlias: preUserAlias,
                    storeID: storeID
                }],
                location: req.body.location || '',
            });

            const savedUser = await newUser.save();

            // CREATE A STORE FOR THAT NEW USER 
            const newStore = new Store({
                _id: storeID,
                store_name: `${req.body.displayName}'s Store`,
                heroTitle: "Welcome to my store!",
                description: "Your go-to shop for all your favorite things, delivered with a smile.",
                owner: {
                    ownerID: savedUser._id, // Link the store to the newly created user
                    ownerEmail: savedUser.email, // Link the store to the newly created user
                }
            });
            // Save the store
            const savedStore = await newStore.save();

            return res.status(200).json({ savedUser: JSON.stringify(savedUser), savedStore: JSON.stringify(savedStore) });
        }
    } catch (error) {
        if (error.isJoi) {
            // Handle Joi validation errors
            console.error('Joi Validation Error:', error.message);
            res.status(400).json({ message: error.message });
        } else if (error.code === 11000) {
            // Handle duplicate key error
            console.log(error)
            return res.status(400).json({ message: 'User with this firebaseID already exists' });
        } else {
            // Handle other unexpected errors
            console.error('Unexpected Error:', error);
            res.status(500).json({ message: 'Something went wrong. Please try again later.' });
        }
    }

});


router.put('/', authenticateToken, isProfileOwner, upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'profileBanner', maxCount: 1 }]), async (req, res) => {
    try {
        const { firebaseID } = req.params
        const { profileUsername, profileFirstName, profileLastName, birthDate, profileSkill, profilePhone, citizenship, businessEmail, businessName } = req.body

        const existingUser = await User.findOne({ firebaseID })

        if (!existingUser) {
            return res.status(400).json({ message: "Can't find User" });
        }


        let profileImage;
        if (req.files['profileImage'] && req.files['profileImage'][0]) {

            if (existingUser.profilePicture && existingUser.profilePicture.filename) {
                const { filename } = existingUser.profilePicture
                await cloudinary.uploader.destroy(filename);
            }
            profileImage = {
                path: req.files['profileImage'][0].path,
                filename: req.files['profileImage'][0].filename,
            };
        } else {
            profileImage = {
                path: existingUser.profilePicture.path || '',
                filename: existingUser.profilePicture.filename || '',
            };
        }

        let profileBanner;
        if (req.files['profileBanner'] && req.files['profileBanner'][0]) {
            if (existingUser.profilePicture && existingUser.bannerPicture.filename) {
                const { filename } = existingUser.bannerPicture
                await cloudinary.uploader.destroy(filename);
            }
            profileBanner = {
                path: req.files['profileBanner'][0].path,
                filename: req.files['profileBanner'][0].filename,
            };
        } else {
            profileBanner = {
                path: existingUser.bannerPicture.path || '',
                filename: existingUser.bannerPicture.filename || '',
            };
        }

        const updatedUser = await User.findOneAndUpdate({ firebaseID }, {
            username: profileUsername,
            expertise: profileSkill,
            profileFirstName,
            profileLastName,
            birthDate,
            phoneNumber: profilePhone,
            profilePicture: profileImage,
            bannerPicture: profileBanner,
            citizenship,

            businessName,
            businessEmail,
        }, {
            new: true
        });



        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Profile updated successfully ', updatedUser });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'An error occurred while updating the user profile' });
    }
});






// profile delete image

router.delete('/:picture/:encodedFilename', authenticateToken, isProfileOwner, async (req, res) => {
    const { firebaseID, picture, encodedFilename } = req.params;
    const filename = decodeURIComponent(encodedFilename);
    try {

        if (filename === "noFileName") {
            return res.status(400).json({ error: "Nice try! Can't delete the basic picture, Deleting it would be like erasing a Picasso masterpiece!" })

        }


        const existingUser = await User.findOne({ firebaseID })
        let store
        if (!existingUser) {
            return res.status(400).json({ message: "Can't find the user" })
        }

        if (picture === 'profilePicture') {
            // Delete the profile image
            if (existingUser.profilePicture.filename) {
                await cloudinary.uploader.destroy(filename)
            }
            existingUser.profilePicture.path = "https://w7.pngwing.com/pngs/146/551/png-transparent-user-login-mobile-phones-password-user-miscellaneous-blue-text.png"
            existingUser.profilePicture.filename = ''



        } else if (picture === 'bannerPicture') {
            // Delete the profile banner
            if (existingUser.bannerPicture.filename) {
                await cloudinary.uploader.destroy(filename)
            }
            existingUser.bannerPicture.path = "https://images.unsplash.com/photo-1489183988443-b37b7e119ba6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=872&q=80"
            existingUser.bannerPicture.filename = ''

        } else if (picture === 'storeLogo') {


            const userStore = existingUser.platforms.find(platform => platform.platform === 'store');
            const storeID = userStore ? userStore.storeID : null;

            store = await Store.findById(storeID)

            if (!store) {
                return res.status(400).json({ message: "Can't find the store" })
            }

            // Delete the profile banner
            if (store.store_logo.filename) {
                await cloudinary.uploader.destroy(filename)
            }

            store.store_logo.path = '',
                store.store_logo.filename = ''


        }
        else if (picture === 'storeBanner') {


            const userStore = existingUser.platforms.find(platform => platform.platform === 'store');
            const storeID = userStore ? userStore.storeID : null;

            store = await Store.findById(storeID)

            if (!store) {
                return res.status(400).json({ message: "Can't find the store" })
            }

            // Delete the profile banner
            if (store.store_banner.filename) {
                await cloudinary.uploader.destroy(filename)
            }

            store.store_banner.path = '',
                store.store_banner.filename = ''


        }
        else {
            // Invalid picture parameter
            return res.status(400).json({ error: 'Invalid picture parameter' });
        }

        const updatedUser = await existingUser.save()
        const updatedStore = await store.save()
        res.status(200).json({ message: "Picture deleted successfully ", updatedUser, updatedStore })

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'An error occurred while deleting the image' });
    }

})


module.exports = router  