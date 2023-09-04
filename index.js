const express = require('express');
const app = express();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const he = require('he');

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

const productRouter = require('./routes/storeRoutes/product');
const categoryRouter = require('./routes/storeRoutes/category');
const storeRouter = require('./routes/storeRoutes/store');
const ordersRouter = require('./routes/storeRoutes/orders');
const User = require('./models/Users');
const Store = require('./models/Store');

const mongoUrl = process.env.MONGODB_URL

mongoose.set('strictQuery', false);

main().catch(err => console.log(err));

async function main() {
  // mongodb://127.0.0.1:27017/Axia
  await mongoose.connect(mongoUrl);
  console.log("Connected to Database")
}


app.use(sanitizeMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', true);

app.use(limiter)
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://axia-editor.pages.dev/', 'https://axia-store.pages.dev/'], // Add other allowed origins here
    credentials: true,
  })
);





app.use('/user/:firebaseID', userRouter);

app.use('/:firebaseID/portfolio', portfolioContentRouter);
app.use('/:firebaseID/portfolio/projectsSection', projectsSectionRouter);
app.use('/portfolio/:userAlias/', portfolioRouter);

app.use('/:storeID/product/', productRouter);
app.use('/:storeID/category/', categoryRouter);


const generateAccessToken = require('./getAccessTokenPayPal')
const handleResponse = require('./handleResponse');
const base = 'https://api.sandbox.paypal.com'


const generateReferalLink = async (requestBody) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/customer/partner-referrals`;

  const stringifiedBody = JSON.stringify(requestBody)

  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: stringifiedBody,

  });

  return handleResponse(response);


}

function isOnboardingActive(onboardingData) {
  // Check if at least one product has vetting_status 'SUBSCRIBED'
  const hasActiveProduct = onboardingData.products.some(
    (product) => product.vetting_status === 'SUBSCRIBED'
  );

  // Check if any capability has status 'ACTIVE'
  const hasActiveCapability = onboardingData.capabilities.some(
    (capability) => capability.status === 'ACTIVE'
  );

  // Overall onboarding status is active if either products or capabilities are active
  return hasActiveProduct || hasActiveCapability;
}


app.post("/generate-referral-link", async (req, res) => {
  try {
    const { requestBody } = req.body
    const decodedRequestBody = he.decode(requestBody);
    const jsonRequestBody = JSON.parse(decodedRequestBody);

    const { links } = await generateReferalLink(jsonRequestBody);

    const { href } = links.find(link => link.rel === 'action_url')


    res.status(200).json({ actionUrlHref: href })
  } catch (error) {
    console.error("Failed to generate referal link:", error);
    res.status(500).json({ error: "Failed to generate referal link." });
  }
});

const getMerchantID = async (firebaseID) => {
  const accessToken = await generateAccessToken();

  const url = `${base}/v1/customer/partners/JHEXEKNUBA5HA/merchant-integrations?tracking_id=${firebaseID}`;

  const response = await fetch(url, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    }
  });

  return handleResponse(response);
}

const getOnboardingStatus = async (merchantID) => {
  const accessToken = await generateAccessToken();

  const url = `${base}/v1/customer/partners/JHEXEKNUBA5HA/merchant-integrations/${merchantID}`;

  const response = await fetch(url, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    }
  });

  return handleResponse(response);
}

app.post('/merchant/COD', async (req, res) => {
  try {

    const { collectInfo, collectAddress, userID } = req.body
    const store = await Store.findOne({ 'owner.ownerID': userID });
    if (!store) {
      return res.status(404).json({ message: 'Store not Found' })
    }

    store.paymentMethod = store.paymentMethod.filter(method => method.type !== 'COD');
    if (collectInfo) {
      const newPaymentMethod = {
        type: 'COD',
        data: {
          collectInfo,
          collectAddress
        }
      }

      store.paymentMethod.push(newPaymentMethod)
    }


    store.save()

    res.status(201).json({ store })

  } catch (error) {
    console.log(error)
    res.status(500).json({ error })

  }

})

app.get("/merchant/create", async (req, res) => {
  try {

    const { firebaseID } = req.query;

    const { merchant_id } = await getMerchantID(firebaseID)
    if (!merchant_id) {
      return res.status(404).json({ error: 'Merchant not Found' })
    }

    const user = await User.findOne({ firebaseID })
    const store = await Store.findOne({ 'owner.ownerID': user._id });

    store.paymentMethod = store.paymentMethod.filter(method => method.type !== 'PayPal');

    const newPaymentMethod = {
      type: 'PayPal',
      data: {
        merchantID: merchant_id
      }
    }
    user.merchantID = merchant_id
    store.paymentMethod.push(newPaymentMethod)
    store.owner.ownerEmail = user.email
    store.owner.ownerMerchantID = merchant_id
    await user.save()
    await store.save()


    const merchantOnboardingStatus = await getOnboardingStatus(merchant_id)

    const onboardingStatus = isOnboardingActive(merchantOnboardingStatus);


    res.status(200).json({ updatedUser: user, onboardingStatus })

  } catch (error) {
    console.error("Failed to get merchantID:", error);
    res.status(500).json({ error: "Failed to get merchantID." });
  }
});




app.use('/orders/', ordersRouter);
app.use('/:storeID/', storeRouter);



// Error handling middleware
app.use((err, req, res, next) => {
  // Handle connection errors
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
    return res.status(500).json({ error: 'Connection error occurred' });
  }

  console.log(err)
  // Handle other errors
  res.status(500).json({ error: 'Oops! Something went wrong.' });
});

const port = process.env.PORT || 3000
const HOST = '0.0.0.0';

// app.listen(port, () => console.log(`Server listening on port: ${port}`))
app.listen(port, HOST, () => console.log(`Server listening on ${HOST}:${port}`))
