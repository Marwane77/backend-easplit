// Importe le module mongoose pour interagir avec MongoDB
const mongoose = require("mongoose");

// Récupère la chaîne de connexion à la base de données depuis les variables d'environnement
const connectionString = process.env.CONNECTION_STRING;

// Établit une connexion à la base de données MongoDB en utilisant la chaîne de connexion
mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 }) // Définit un délai de connexion de 2000ms
  .then(() => console.log("Database connected")) // Log un message en cas de connexion réussie
  .catch((error) => console.error(error)); // Log l'erreur en cas d'échec de la connexion
