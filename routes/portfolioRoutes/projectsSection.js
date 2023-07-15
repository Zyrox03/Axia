const express = require('express');
const router = express.Router({ mergeParams: true })
const { v4: uuidv4 } = require('uuid');

const PortfolioContent = require('../../models/PortfolioContent');

const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { storage } = require('../../cloudinary')

const upload = multer({ storage })



// PUT route for adding & updating an existing project in the projectsSection
router.put('/', upload.single('projectImage'), async (req, res) => {
  const { firebaseID } = req.params;
  try {
    const existingPortfolio = await PortfolioContent.findOne({ firebaseID });

    if (!existingPortfolio) {
      return res.status(400).json({ message: "Can't find that portfolio" });
    }

    let updatedPortfolio;

    // Check if the project already exists in the projectsSection
    const existingProjectIndex = existingPortfolio.projectsSection.findIndex(
      (project) => project.projectID === req.body.projectID
    );

    if (existingProjectIndex !== -1) {
      // Update the existing project in the projectsSection
      if (existingPortfolio.projectsSection[existingProjectIndex].projectImage && existingPortfolio.projectsSection[existingProjectIndex].projectImage.filename) {
        const { filename } = existingPortfolio.projectsSection[existingProjectIndex].projectImage
        await cloudinary.uploader.destroy(filename);
      }

      // If req.file exists, update the projectImage path and filename
      if (req.file && req.file.path) {
        req.body.projectImage = {
          path: req.file.path,
          filename: req.file.filename,
        };
      }



      // UPDATE

      updatedPortfolio = await PortfolioContent.findOneAndUpdate(
        { firebaseID, "projectsSection.projectID": req.body.projectID },
        { $set: { "projectsSection.$": req.body } },
        { new: true }
      );
    } else {
      // Push a new project object to the projectsSection

      // If req.file exists, assign the projectImage path and filename
      if (req.file && req.file.path) {
        req.body.projectImage = {
          path: req.file.path,
          filename: req.file.filename,
        };
      }

      req.body.projectID = uuidv4();
      updatedPortfolio = await PortfolioContent.findOneAndUpdate(
        { firebaseID },
        { $push: { projectsSection: req.body } },
        { new: true }
      );
    }

    const savedPortfolioContent = await updatedPortfolio.save();
    res.status(200).json({ message: `Project updated successfully`, savedPortfolioContent });


  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while updating the portfolio' });
  }
});










// DELETE route for removing a project from the projectsSection
router.delete('/:projectID', async (req, res) => {
  const { firebaseID, projectID } = req.params;
  try {
    const existingPortfolio = await PortfolioContent.findOne({ firebaseID });

    if (!existingPortfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // Find the project to be deleted
    const project = existingPortfolio.projectsSection.find(
      (project) => project.projectID === projectID
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Delete the projectImage filename in Cloudinary
    const { filename } = project.projectImage;
    if (filename) {
      await cloudinary.uploader.destroy(filename);
    }

    // Remove the project from projectsSection
    existingPortfolio.projectsSection = existingPortfolio.projectsSection.filter(
      (project) => project.projectID !== projectID
    );

    // Save the updated portfolio
    const updatedPortfolio = await existingPortfolio.save();

    return res.status(200).json({ message: "Project deleted successfully", updatedPortfolio });
  } catch (error) {
    console.log(error);
    res.status(500).json(error.message);
  }
});


module.exports = router;
