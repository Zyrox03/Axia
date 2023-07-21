const express = require('express');
const router = express.Router({ mergeParams: true })

const User = require('../../models/Users')

const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { storage } = require('../../cloudinary')
const upload = multer({ storage })

const authenticateToken = require('../../middleware/authenticateTokenMiddleware');
const { isProfileOwner } = require('../../middleware/authorizationMiddleware');

router.get('/', authenticateToken,isProfileOwner, async (req, res) => {
    try {

        const { firebaseID } = req.params
        const user = await User.findOne({ firebaseID })

        if (!user) {
            return res.status(404).json({ error: 'User not fouund' });
        }

        res.status(200).json(JSON.stringify(user));
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }

})



router.post('/', authenticateToken,isProfileOwner, async (req, res) => {
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

            return res.status(200).json({
                savedUser: JSON.stringify(existingUser),
            });

        } else {
            // User doesn't exist, create a new user
            const newUser = new User({
                firebaseID,
                username: req.body.displayName,
                email: req.body.email,
                emailVerified: req.body.emailVerified,
                expertise: '', // Add the required fields here
                name: req.body.displayName,
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
                platforms: [],
                location: req.body.location || '',
            });

            const savedUser = await newUser.save();
            return res.status(200).json({ savedUser: JSON.stringify(savedUser) });
        }
    } catch (error) {
        if (error.isJoi) {
            // Handle Joi validation errors
            console.error('Joi Validation Error:', error.message);
            res.status(400).json({ message: error.message });
        } else if (error.code === 11000) {
            // Handle duplicate key error
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
        const { profileUsername, profileName, profileSkill, profilePhone } = req.body

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
            name: profileName,
            phoneNumber: profilePhone,
            profilePicture: profileImage,
            bannerPicture: profileBanner,
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

router.delete('/:picture/:encodedFilename', authenticateToken,isProfileOwner, async (req, res) => {
    const { firebaseID, picture, encodedFilename } = req.params;
    const filename = decodeURIComponent(encodedFilename);
    try {

        if (filename === "noFileName") {
            return res.status(400).json({ error: "Nice try! Can't delete the basic picture, Deleting it would be like erasing a Picasso masterpiece!" })

        }


        const existingUser = await User.findOne({ firebaseID })

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

        } else {
            // Invalid picture parameter
            return res.status(400).json({ error: 'Invalid picture parameter' });
        }
        const updatedUser = await existingUser.save()
        res.status(200).json({ message: "Picture deleted successfully ", updatedUser })

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'An error occurred while deleting the image' });
    }

})




module.exports = router  