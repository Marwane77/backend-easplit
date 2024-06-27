const mongoose = require("mongoose"); // Importe le module mongoose pour interagir avec MongoDB

const userSchema = mongoose.Schema({ // Crée un schéma de document pour les utilisateurs
  firstName: String,
  lastName: String,
  password: String,
  token: String,
  email: String,
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "events" }],
  balance: Number, //zéro par défaut au départ
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "transactions" }],
});

const User = mongoose.model("users", userSchema); // Crée un modèle de document pour les utilisateurs

module.exports = User; // Exporte le modèle de document pour les utilisateurs
