import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String }], // Array of image URLs
    description: { type: String, required: true },
    location: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviews: [
      {
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reviewText: { type: String },
        rating: { type: Number, min: 0, max: 5 },
      },
    ],
    rating: { type: Number, default: 0 }, // Derive this from reviews
    isVerified: { type: Boolean, default: false },
    roomType: {
      type: String,
      enum: ["Single", "Double", "Triple"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Property", propertySchema);
