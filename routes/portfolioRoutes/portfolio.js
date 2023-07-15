const express = require('express');
const PortfolioContent = require('../../models/PortfolioContent');
const router = express.Router({ mergeParams: true })


router.get('/', async (req, res) => {
    const { userAlias } = req.params
    try {
        const portfolioData = await PortfolioContent.findOne({ userAlias })
        res.status(200).json({ portfolioData })

 
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "An error occured when fetching portfolio data" })
    } 
}) 










module.exports = router