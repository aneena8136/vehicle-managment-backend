const vehicleTypeDef = require('./vehicletypedef');
const bookingTypeDef = require('./bookingTypeDef');

const cartypeDefs = [
  vehicleTypeDef, 
  bookingTypeDef,
  // You can add other typedefs here if you have more modules in the future.
];

module.exports = cartypeDefs;  // Export cartypeDefs as an array
