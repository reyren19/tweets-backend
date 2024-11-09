import mongoose, { model, Schema, Types } from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  subscriber: {
    type: Object.Types.Schema,
    ref: "User",
  },
  channel: {
    type: Object.Types.Schema,
    ref: "User",
  },
});

export const Subscriber = mongoose.model("Subscriber", subscriptionSchema);
