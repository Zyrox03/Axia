const Joi = require('joi');


const facebookUrlRegex = /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9_.\-]+\/?$/i;
const twitterUrlRegex = /^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/i;
const instagramUrlRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/i;
const linkedInUrlRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=.]+$/i;
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?youtube\.com\/[a-zA-Z0-9_.\-]+\/?$/i;


const projectJoiSchema = Joi.object().keys({
    _id: Joi.object(),
    projectID: Joi.string().required(),
    projectImage: Joi.object({
        path: Joi.string().allow(null),
        filename: Joi.string().allow(null),
    }).allow(null), // Make the projectImage field optional
    title: Joi.string().required(),
    description: Joi.string().allow(''),
    linkButton: Joi.string().required(),
});

const portfolioContentJoiSchema = Joi.object({
    _id: Joi.object(),
    __v: Joi.any(),
    firebaseID: Joi.string().required(),
    navigationBar: Joi.object({
        logo: Joi.object({
            path: Joi.string().allow(''),
            filename: Joi.string().allow(''),
        }).allow(null), // Make the logo field optional
    }),
    heroSection: Joi.object({
        title: Joi.string().required(),
        subHeading: Joi.string().required(),
        ctaButton: Joi.string().required(),
        mainImage: Joi.object({
            path: Joi.string().allow(''),
            filename: Joi.string().allow(''),
        }).allow(null), // Make the mainImage field optional
    }),
    aboutSection: Joi.object({
        description: Joi.string().allow(''),
    }),
    projectsSection: Joi.array().items(projectJoiSchema),
    contactSection: Joi.object({
        contactText: Joi.string().required(),
        subjectPlaceholder: Joi.string().required(),
        messagePlaceholder: Joi.string().required(),
        sendButton: Joi.string().required(),
    }),
    footerSection: Joi.object({
        socials: Joi.object({
            facebook: Joi.string().pattern(facebookUrlRegex).allow('').messages({
                'string.pattern.base': 'Invalid Facebook URL',
            }),
            twitter: Joi.string().pattern(twitterUrlRegex).allow('').messages({
                'string.pattern.base': 'Invalid Twitter URL',
            }),
            instagram: Joi.string().pattern(instagramUrlRegex).allow('').messages({
                'string.pattern.base': 'Invalid Instagram URL',
            }),
            linkedIn: Joi.string().pattern(linkedInUrlRegex).allow('').messages({
                'string.pattern.base': 'Invalid LinkedIn URL',
            }),
            youtube: Joi.string().pattern(youtubeUrlRegex).allow('').messages({
                'string.pattern.base': 'Invalid Youtube URL',
            }),
        }),
        footerText: Joi.string().required(),
    }),
    userAlias: Joi.string().required(),
});

module.exports = portfolioContentJoiSchema;
