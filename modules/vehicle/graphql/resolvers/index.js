const vehicleResolvers = require('./vehicleResolver');
const bookingResolver = require('./bookingResolver')

const vehicleModuleResolvers = {
  Mutation: {
    ...vehicleResolvers.Mutation,
    ...bookingResolver.Mutation, // Include vehicle resolvers for mutations
  },
  Query : {
    ...vehicleResolvers.Query,
    ...bookingResolver.Query,
  }
};

module.exports = vehicleModuleResolvers;
