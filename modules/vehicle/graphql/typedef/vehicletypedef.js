const { gql } = require('apollo-server-express');

const vehicleTypeDef = gql`
  # Define the Upload scalar type to handle file uploads
  scalar Upload

  # Define the Vehicle type representing a vehicle entity
  type Vehicle {
    id: ID
    name: String
    manufacturer: String   # New field for Manufacturer
    model: String          # New field for Model
    fuelType: FuelType     # New field for Fuel Type
    gearType: GearType     # New field for Gear Type
    seats: Int             # New field for Number of Seats
    price: Float
    primaryImage: String
    secondaryImage: String
     otherImages: [String!] 
    availableQty: Int
    bookings:[Booking!]!
  }

  # Define enums for FuelType and GearType
  enum FuelType {
    PETROL
    DIESEL
    CNG
    EV
  }

  enum GearType {
    MANUAL
    AUTOMATIC
  }

  # Define the available Queries
  type Query {
    # Fetch all vehicles
    getAllVehicles: [Vehicle] 

    # Fetch a specific vehicle by ID
    getVehicleById(id: ID!): Vehicle
  }

  # Define the available Mutations
  type Mutation {
    # Mutation to add a new vehicle
    addVehicle(
      name: String!
      manufacturer: String!     # New field for Manufacturer
      model: String!            # New field for Model
      fuelType: FuelType!       # New field for Fuel Type
      gearType: GearType!       # New field for Gear Type
      seats: Int!   
      price: Float!            # New field for Number of Seats
      primaryImageFile: Upload!  # Input file for primary image
      secondaryImageFile: Upload!  # Input file for secondary image
      otherImageFiles: [Upload!]!
      availableQty: Int!
    ): Vehicle!
  

     editVehicle(
    id: ID!
    name: String
    manufacturer: String
    model: String
    fuelType: FuelType
    gearType: GearType
    seats: Int
    price: Float
    primaryImageFile: Upload
    secondaryImageFile: Upload
     otherImageFiles: [Upload]  # Ensure this is defined as an array of Upload
    availableQty: Int
  ): Vehicle

    # Mutation to delete a vehicle by ID
    deleteVehicle(id: ID!): String!  # Returns a message upon successful deletion

         importVehicles(file: Upload!): String
  }
`;

module.exports = vehicleTypeDef;
