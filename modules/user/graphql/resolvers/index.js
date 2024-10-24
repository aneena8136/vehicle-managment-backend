const customerResolvers = require('./customerResolver');
const otpresolvers = require('./otpResolver');

const userResolvers = {
  Mutation: {
    ...customerResolvers.Mutation, 
    ...otpresolvers.Mutation,
  },
};

module.exports = userResolvers;
