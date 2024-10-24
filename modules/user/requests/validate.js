const Joi = require('joi');

const customerValidationSchema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.base': 'Name must be a string.',
      'string.empty': 'Name is required.',
      'string.min': 'Name should have a minimum length of 2.',
      'string.max': 'Name should have a maximum length of 50.',
      'any.required': 'Name is required.',
    }),
    email: Joi.string().email().required().messages({
      'string.base': 'Email must be a valid string.',
      'string.email': 'Please provide a valid email.',
      'string.empty': 'Email is required.',
      'any.required': 'Email is required.',
    }),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
      'string.pattern.base': 'Phone number must be a 10-digit number.',
      'string.empty': 'Phone number is required.',
      'any.required': 'Phone number is required.',
    }),
    city: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'City is required.',
      'any.required': 'City is required.',
    }),
    state: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'State is required.',
      'any.required': 'State is required.',
    }),
    country: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Country is required.',
      'any.required': 'Country is required.',
    }),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
      'string.pattern.base': 'Pincode must be a 6-digit number.',
      'string.empty': 'Pincode is required.',
      'any.required': 'Pincode is required.',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long.',
      'string.empty': 'Password is required.',
      'any.required': 'Password is required.',
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords must match.',
      'string.empty': 'Confirm Password is required.',
      'any.required': 'Confirm Password is required.',
    }),
  });

  module.exports = customerValidationSchema;  