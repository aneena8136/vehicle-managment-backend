// schema.js
const { gql } = require('apollo-server-express');

const otptypeDefs = gql`
  type Mutation {
     sendOTP(phoneNumber: String!): String!
    verifyOTP(phoneNumber: String!, otp: String!): Boolean!
  }
`;

module.exports = otptypeDefs;
