const express = require('express');
const router = express.Router({ mergeParams: true })

const User = require('../../models/Users')
const PortfolioContent = require('../../models/PortfolioContent');


const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { storage } = require('../../cloudinary')
const upload = multer({ storage })


router.get('/', async (req, res) => {
    const { firebaseID } = req.params
    try {

        const PortfolioData = await PortfolioContent.findOne({ firebaseID })
        if (!PortfolioData) {
            return res.status(200).json(null)

        }
        res.status(200).json(PortfolioData)

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'ERROR FETCHING PORTFOLIO CONTENT' })
    }

})

router.post('/', async (req, res) => {
    try {
        const { firebaseID } = req.params
        const existingUser = await User.findOne({ firebaseID });

        if (!existingUser) {
            return res.status(400).json({ message: "Can't find User" });
        }

        const preUserAlias = existingUser.username.replace(/[\s\W]+/g, '') + Date.now()


        if (!existingUser.platforms.some(platform => platform.platform === "portfolio")) {
            existingUser.platforms.push({ platform: "portfolio", userAlias: preUserAlias });
        }



        // Create a new PortfolioContent document with random fake data
        const prePortfolioContent = new PortfolioContent({
            firebaseID,
            navigationBar: {
                logo: {
                    path: "",
                    filename: ""
                },
            },
            heroSection: {
                title: "Welcome to My Portfolio",
                subHeading: "Explore my work and achievements",
                ctaButton: "Learn More",
                mainImage: {
                    path: "",
                    filename: ""
                }
            },
            aboutSection: {
                description: "I am a passionate and dedicated professional with years of experience in my field. I strive to deliver high-quality results and exceed expectations.",
            },
            projectsSection: [], // Empty array for now, as no projects are added
            contactSection: {
                contactText: "Get in touch with me",
                subjectPlaceholder: "Enter the subject",
                messagePlaceholder: "Write your message here",
                sendButton: "Send Message",
            },
            footerSection: {
                socials: {
                    instagram: "https://www.instagram.com/myprofile",
                    linkedIn: "https://www.linkedin.com/in/myprofile",
                    twitter: "https://www.twitter.com/myprofile",
                    youtube: "https://www.youtube.com/myprofile",
                    facebook: "https://www.facebook.com/myprofile",
                },
                footerText: "© 2023 My Portfolio. All rights reserved.",
            },
            userAlias: preUserAlias

        });

        // Save the prePortfolioContent document to the database


        const savedPortfolioContent = await prePortfolioContent.save();
        const updatedUser = await existingUser.save();


        res.status(200).json({ message: "Congrats on your new portfolio !", savedPortfolioContent, updatedUser })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something went wrong" })

    }

})


router.put('/section/:section', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'mainImage', maxCount: 1 }]), async (req, res) => {
    const { firebaseID, section } = req.params;

    try {
        const existingPortfolio = await PortfolioContent.findOne({ firebaseID });

        if (!existingPortfolio) {
            return res.status(400).json({ message: "Can't find that portfolio" });
        }


        let updatedUser;
        let updatedPortfolio;
        let updateObject;
        let savedUser
        
        if (section === 'footerSection') {
            updateObject = {
                [section]: { ...req.body, socials: JSON.parse(req.body.socials) }
            };
        } else {
            updateObject = {
                [section]: req.body,
            };
        }


        // Update the logo string in the navigationBar object
        if (section === "navigationBar") {
            if (req.files && req.files['logo'] && req.files['logo'].length !== 0 && req.files['logo'][0]) {
                if (existingPortfolio.navigationBar.logo && existingPortfolio.navigationBar.logo.filename) {
                    const { filename } = existingPortfolio.navigationBar.logo;
                    await cloudinary.uploader.destroy(filename);
                }
                updateObject.navigationBar = {
                    ...updateObject.navigationBar,
                    logo: {
                        path: req.files['logo'][0].path,
                        filename: req.files['logo'][0].filename,
                    },
                };

            }
            else {
                updateObject.navigationBar = {
                    ...updateObject.navigationBar,
                    logo: existingPortfolio.navigationBar.logo
                };
            }
        }

        if (section === "heroSection") {
            if (req.files && req.files['mainImage'] && req.files['mainImage'].length !== 0 && req.files['mainImage'][0]) {
                if (existingPortfolio.heroSection.mainImage && existingPortfolio.heroSection.mainImage.filename) {
                    const { filename } = existingPortfolio.heroSection.mainImage;
                    await cloudinary.uploader.destroy(filename);
                }
                updateObject.heroSection = {
                    ...updateObject.heroSection,
                    mainImage: {
                        path: req.files['mainImage'][0].path,
                        filename: req.files['mainImage'][0].filename,
                    },
                };

            }
            else {
                updateObject.heroSection = {
                    ...updateObject.heroSection,
                    mainImage: existingPortfolio.heroSection.mainImage
                };
            }
        }


        if (section === 'URLSettings') {
            const { userAlias } = req.body;


            // Check if the userAlias already exists in the PortfolioContent collection
            const duplicateAlias = await PortfolioContent.findOne({ userAlias });

            if (duplicateAlias) {
                return res.status(400).json({ error: "The user alias is already taken. Please choose a different one." });
            }

            updateObject = {
                ...updateObject,
                userAlias,
            };

            updatedUser = await User.findOneAndUpdate(
                { firebaseID },
                { $set: { 'platforms.$[elem].userAlias': userAlias } },
                { arrayFilters: [{ 'elem.platform': 'portfolio' }], new: true }
            );


        }


        // Update other sections
        updatedPortfolio = await PortfolioContent.findOneAndUpdate(
            { firebaseID },
            { $set: updateObject },
            { new: true }
        );

        if (section === "URLSettings") {
            savedUser = await updatedUser.save();
          }
        const savedPortfolioContent = await updatedPortfolio.save();

        const jsonResponse = {
            message: "Section updated successfully",
            savedPortfolioContent,
          };
          
          if (section === "URLSettings") {
            jsonResponse.savedUser = savedUser;
          }
          
          res.status(200).json(jsonResponse);   
        
        } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'An error occurred while updating the portfolio' });
    }
});

router.delete('/', async (req, res) => {
    const { firebaseID } = req.params
    try {
        const deletedPortfolio = await PortfolioContent.findOneAndDelete({ firebaseID },);

        if (!deletedPortfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        // Pull the 'portfolio' string from the platforms array in the User collection
        const updatedUser = await User.findOneAndUpdate({ firebaseID }, { $pull: { platforms: { platform: 'portfolio' } } }, { new: true });

        return res.status(200).json({ message: "Portfolio deleted successfully", deletedPortfolio, updatedUser });

    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
})



// portfolio delete image

router.delete('/:section/pictures/:encodedFilename', async (req, res) => {
    const { firebaseID, section, encodedFilename } = req.params;
    const filename = decodeURIComponent(encodedFilename);

    try {
        const existingPortfolio = await PortfolioContent.findOne({ firebaseID });

        if (!existingPortfolio) {
            return res.status(400).json({ message: "Can't find that portfolio" });
        }

        if (existingPortfolio[section] && existingPortfolio[section][section === 'navigationBar' ? 'logo' : 'mainImage'] && existingPortfolio[section][section === 'navigationBar' ? 'logo' : 'mainImage'].filename === filename) {
            // Delete the image
            await cloudinary.uploader.destroy(filename);

            // Assign new object with empty path and filename values
            existingPortfolio[section][section === 'navigationBar' ? 'logo' : 'mainImage'] = {
                path: "",
                filename: "",
            };

            // Save the updated portfolio
            const savedPortfolioContent = await existingPortfolio.save();

            return res.status(200).json({ message: "Image deleted successfully", savedPortfolioContent });
        }

        return res.status(404).json({ message: "Image not found in the portfolio" });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'An error occurred while deleting the image' });
    }
});


module.exports = router