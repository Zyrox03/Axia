const express = require('express');
const app = express();

const mongoose = require('mongoose');
require('dotenv').config();

var admin = require("firebase-admin");

const serviceAccount = require('./FBServiceAccount.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
 



const helmet = require('helmet')
const cors = require('cors');
const limiter = require("./middleware/rateLimitMiddleware");
const sanitizeMiddleware = require("./middleware/sanitizationMiddleware");

const userRouter = require('./routes/userRoutes/user');

const portfolioContentRouter = require('./routes/portfolioRoutes/portfolioContent');
const projectsSectionRouter = require('./routes/portfolioRoutes/projectsSection');
const portfolioRouter = require('./routes/portfolioRoutes/portfolio');

const mongoUrl = process.env.MONGODB_URL
mongoose.set('strictQuery', false);

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(mongoUrl);
  console.log("Connected to Database")
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}



app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(limiter)
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(sanitizeMiddleware);




app.use('/user/:firebaseID', userRouter);
app.use('/:firebaseID/portfolio', portfolioContentRouter);
app.use('/:firebaseID/portfolio/projectsSection', projectsSectionRouter);
app.use('/portfolio/:userAlias/', portfolioRouter);





// Error handling middleware
app.use((err, req, res, next) => {
  // Handle connection errors
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
    return res.status(500).json({ error: 'Connection error occurred' });
  }

  // Handle other errors
  res.status(500).json({ error: 'An error occurred while updating the portfolio' });
});

const port = process.env.PORT || 3000
const HOST = '0.0.0.0';

// app.listen(port, () => console.log(`Server listening on port: ${port}`))
app.listen(port, HOST, () => console.log(`Server listening on ${HOST}:${port}`))
