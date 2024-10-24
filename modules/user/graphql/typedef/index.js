const { gql } = require('apollo-server-express');
const customerTypeDefs = require('./customer');
const otptypeDefs = require('./otp');

const usertypeDefs = [
  customerTypeDefs,
  otptypeDefs,
]

 

module.exports =  usertypeDefs ;









