const { gql } = require('apollo-server-express');

const adminTypedefs = gql`
type Admin {
    id: ID!
    username: String!
    email: String!
  }
  
  type Mutation {
    loginAdmin(email: String!, password: String!): Admin
  }
`;

module.exports= adminTypedefs;


  