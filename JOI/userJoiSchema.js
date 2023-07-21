const Joi = require('joi');

const userJoiSchema = Joi.object({
    _id: Joi.object(),
    __v: Joi.any(),
    firebaseID: Joi.string().required(),
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    emailVerified: Joi.boolean().default(false),
    expertise: Joi.string().allow(''),
    name: Joi.string().required(),
    phoneNumber: Joi.number().default('').allow(''),
    profilePicture: Joi.object({
        path: Joi.string().allow(''),
        filename: Joi.string().allow(''),
    }).optional(), // Make the profilePicture field optional
    bannerPicture: Joi.object({
        path: Joi.string().allow(''),
        filename: Joi.string().allow(''),
    }).optional(), // Make the bannerPicture field optional
    location: Joi.string().allow(''),
    platforms: Joi.array().items(
        Joi.object({
            platform: Joi.string(),
            userAlias: Joi.string(),
            _id: Joi.object(),

        })
    ).required(),
    createdAt: Joi.date().default(Date.now),
});

module.exports = userJoiSchema;
