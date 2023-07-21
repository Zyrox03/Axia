const mongoose = require('mongoose');
const portfolioContentJoiSchema = require('../JOI/portfolioContentJoiSchema')


const projectSchema = new mongoose.Schema({
    projectID: {
        type: String,
    },
    projectImage: {
        path: {
            type: String
        },
        filename: {
            type: String
        },
    },
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    linkButton: {
        type: String,
    },
});


const portfolioContentSchema = new mongoose.Schema({

    firebaseID: {
        type: String,

    },


    navigationBar: {
        logo: {
            path: {
                type: String
            },
            filename: {
                type: String
            },

        },
    },
    heroSection: {
        title: {
            type: String,
        },
        subHeading: {
            type: String,
        },
        ctaButton: {
            type: String,
        },
        mainImage: {
            path: {
                type: String
            },
            filename: {
                type: String
            },
        },
    },
    aboutSection: {
        description: {
            type: String,
        },
    },

    projectsSection: [projectSchema]

    ,
    contactSection: {
        contactText: {
            type: String,
        },
        subjectPlaceholder: {
            type: String,
        },
        messagePlaceholder: {
            type: String,
        },
        sendButton: {
            type: String,
        },
    },
    footerSection: {
        socials: {
            instagram: {
                type: String,
            },
            linkedIn: {
                type: String,
            },
            twitter: {
                type: String,
            },
            youtube: {
                type: String,
            },
            facebook: {
                type: String,
            },
        },
        footerText: {
            type: String,
        },
    },

    userAlias: {
        type: String,
        required: true
    },
});


// Mongoose middleware to validate and save data before saving to the database
portfolioContentSchema.pre('save', async function (next) {
    try {
      await portfolioContentJoiSchema.validateAsync(this.toObject());
      next();
    } catch (err) {
      next(err);
    }
  });

const PortfolioContent = mongoose.model('PortfolioContent', portfolioContentSchema);

module.exports = PortfolioContent;
