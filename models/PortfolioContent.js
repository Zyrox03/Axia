const mongoose = require('mongoose');



const projectSchema = new mongoose.Schema({
    projectID: {
        type: String,
        required: true,
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
        required: true,
    },
    description: {
        type: String,
    },
    linkButton: {
        type: String,
        required: true,
    },
});


const portfolioContentSchema = new mongoose.Schema({

    firebaseID: {
        type: String,
        required: true

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

const PortfolioContent = mongoose.model('PortfolioContent', portfolioContentSchema);

module.exports = PortfolioContent;
