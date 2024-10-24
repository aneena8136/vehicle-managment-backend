const { gql } = require('apollo-server-express');

const customerTypeDefs = gql`
  scalar Upload

  type Customer {
    id: ID!
    name: String!
    email: String!
    phone: String!
    city: String!
    state: String!
    country: String!
    pincode: String!
    profilePicture: String
    bookings: [Booking!]!
  }

  input RegisterCustomerInput {
    name: String!
    email: String!
    phone: String!
    city: String!
    state: String!
    country: String!
    pincode: String!
    password: String!
    confirmPassword: String!
  }

  input UpdateCustomerInput {
    name: String
    email: String
    phone: String
    city: String
    state: String
    country: String
    pincode: String
  }

  type AuthPayload {
    token: String!
    customer: Customer!
  }

  type Query {
    getUserProfile: Customer!
  }

  type Mutation {
    registerCustomer(input: RegisterCustomerInput!): Customer!
    loginCustomer(email: String!, password: String!): AuthPayload!
    updateCustomer(
      id: ID!
      input: UpdateCustomerInput!
      profileImageFile: Upload  # Allow uploading a profile image during update
    ): Customer!
  }
`;

module.exports = customerTypeDefs;
