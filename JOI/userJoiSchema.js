const Joi = require('joi');

const userJoiSchema = Joi.object({
    _id: Joi.object(),
    __v: Joi.any(),
    firebaseID: Joi.string().required(),
    merchantID: Joi.string(),
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    emailVerified: Joi.boolean().default(false),
    expertise: Joi.string().allow(''),
    birthDate: Joi.string().allow(''),
    profileFirstName: Joi.string().allow(''),
    profileLastName: Joi.string().allow(''),
    phoneNumber: Joi.number().default('').allow(''),
    citizenship: Joi.string().default('').allow(''),

    businessEmail: Joi.string().default('').allow(''),
    businessName: Joi.string().default('').allow(''),

    profilePicture: Joi.object({
        path: Joi.string().allow(''),
        filename: Joi.string().allow(''),
    }).optional(), // Make the profilePicture field optional
    bannerPicture: Joi.object({
        path: Joi.string().allow(''),
        filename: Joi.string().allow(''),
    }).optional(), // Make the bannerPicture field optional
    platforms: Joi.array().items(
        Joi.object({
            platform: Joi.string(),
            userAlias: Joi.string(),
            storeID: Joi.string(),
            _id: Joi.object(),

        })
    ).required(),
    createdAt: Joi.date().default(Date.now),
});

module.exports = userJoiSchema;
