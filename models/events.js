const mongoose = require("mongoose"); // Importe le module mongoose pour interagir avec MongoDB

const eventSchema = mongoose.Schema({ // Crée un schéma de document pour les événements
  eventUniqueId: String, 
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  name: String,
  eventDate: Date,
  paymentDate: Date,
  description: String,
  remainingBalance: {
    type: Number,
    default: this.totalSum
  },
  guests: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
      email: String,
      share: Number,
      hasPaid: Boolean,
    },
  ],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "transactions" }],
  totalSum: Number,
  shareAmount: Number,
});

const Event = mongoose.model("events", eventSchema); // Crée un modèle de document pour les événements 

module.exports = Event; // Exporte le modèle de document pour les événements
