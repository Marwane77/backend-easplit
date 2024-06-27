const mongoose = require("mongoose"); // Importe le module mongoose pour interagir avec MongoDB

const transactionSchema = mongoose.Schema({ // Crée un schéma de document pour les transactions
  amount: Number,
  date: Date,
  invoice: String,
  type: {
    type: String,
    enum: ["refund", "payment", "reload", "expense"],
  },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "events" },
  emitter: String,
  recipient: String,
  name: String,
  category: String,
});

const Transaction = mongoose.model("transactions", transactionSchema); // Crée un modèle de document pour les transactions

module.exports = Transaction; // Exporte le modèle de document pour les transactions
