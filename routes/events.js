var express = require("express"); // Importe le framework Express.js
var router = express.Router();  // Crée un routeur Express.js

const mongoose = require("mongoose"); // Importe le module mongoose pour interagir avec MongoDB

require("../models/connection"); // Importe la connexion à la base de données MongoDB
const Event = require("../models/events"); // Importe le modèle de document pour les évènements
const User = require("../models/users"); // Importe le modèle de document pour les utilisateurs
const Transaction = require("../models/transactions"); // Importe le modèle de document pour les transactions
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2"); // Importe le module uid2 pour générer des identifiants uniques
const cloudinary = require("cloudinary").v2; // Importe le module cloudinary pour stocker des fichiers
const uniqid = require("uniqid"); // Importe le module uniqid pour générer des identifiants uniques
const fs = require("fs"); // Importe le module fs pour interagir avec le système de fichiers
const { promisify } = require('util');
const mkdirAsync = promisify(fs.mkdir);


//const { addUserToGuest } = require("./users");

// Route utilisée dans le screen CreateEventScreen (création d'un évènement)
router.post("/create-event/:token", async (req, res) => {
  // on récupère le token de l'utilisateur
  const token = req.params.token; 
  User.findOne({ token }) // on cherche l'utilisateur correspondant au token
    .then(async (user) => { // on récupère l'utilisateur
      if (!user) { // si l'utilisateur n'est pas trouvé
        res.json({ result: false, error: "Utilisateur non trouvé" });
        return; // on arrête la fonction
      }
      // on vérifie que les champs obligatoires sont bien remplis
      if (
        !checkBody(req.body, [
          "name",
          "eventDate",
          "paymentDate",
          "description",
          "guests",
          "totalSum",
        ])
      ) {
        //console.log("Request body:", req.body);
        res.json({ result: false, error: "Champs manquants ou vides" });
        return;
      }
      // on vérifie que les dates sont valides
      if (
        isNaN(new Date(req.body.eventDate)) || // on vérifie que la date de l'évènement est un nombre
        isNaN(new Date(req.body.paymentDate)) // on vérifie que la date de paiement est un nombre
      ) {
        res.json({ result: false, error: "Date invalide" });
        return; // on arrête la fonction
      }
      // on vérifie que le montant total est un nombre
      let organizerShare = 1; // on définit la part par défaut de l'organisateur

      // On definit guests comme un tableau contenant dejà l'organisateur avec sa part et le fait qu'il n'a pas payé 
      const guests = [
        {
          userId: user._id,
          email: user.email,
          share: organizerShare,
          hasPaid: false,
        },
      ];
      // On definit shareAmount comme un nombre égal à 0 
      let shareAmount = 0;
      // On boucle sur les participants 
      for (let participant of req.body.guests) { // pour chaque participant
        let participantShare = Number(participant.parts);  // on récupère la part du participant
        if (isNaN(participantShare)) { // si la part n'est pas un nombre
          res.json({
            result: false,
            error: "Le partage doit être un nombre", // on renvoie une erreur
          });
          return; // on arrête la fonction
        }
      
        if (participant.email === user.email) { // si l'email du participant est égal à l'email de l'organisateur
          organizerShare = participantShare; // on met à jour la part de l'organisateur
          guests[0].share = organizerShare; // on met à jour la part de l'organisateur dans la liste des participants
        } else {
          // On vérifie si l'utilisateur est déjà enregistré
          let participantUser = await User.findOne({
            email: participant.email,
          });

          // Si l'utilisateur n'est pas enregistré, on le crée
          if (!participantUser) {
            participantUser = new User({ email: participant.email }); //
            await participantUser.save(); 
          }
          // On ajoute le participant à la liste des participants
          guests.push({
            userId: participantUser._id,
            email: participantUser.email,
            share: participantShare,
            hasPaid: false,
          });
        }
        // On met à jour le montant total
        shareAmount += participantShare;
      }
      // On crée l'évènement
      const newEvent = new Event({
        eventUniqueId: uid2(32),
        organizer: user._id,
        name: req.body.name,
        eventDate: new Date(req.body.eventDate),
        paymentDate: new Date(req.body.paymentDate),
        description: req.body.description,
        guests: guests,
        totalSum: req.body.totalSum,
        shareAmount: shareAmount,
        transactions: [],
      });
      // On sauvegarde l'évènement
      newEvent.save().then(async (data) => {
        for (let guest of guests) { // pour chaque participant
          if (guest.userId.toString() !== user._id.toString()) { // si l'id du participant est différent de l'id de l'organisateur
            let guestUser = await User.findOne({ _id: guest.userId });  // on récupère le participant
            if (guestUser) { // si le participant est trouvé
              guestUser.events.push(data._id);  // on ajoute l'évènement à la liste des évènements du participant
              await guestUser.save(); // on sauvegarde le participant
            }
          }
        }
        // On ajoute l'évènement à la liste des évènements de l'organisateur
        let organizerUser = await User.findOne({ _id: newEvent.organizer });
        if (organizerUser) {
          organizerUser.events.push(data._id);
          await organizerUser.save();
        }

        res.json({
          result: true,
          message: "Evenement créé avec succès",
          data: data,
        });
      });
    })
    .catch((err) => {
      res.json({ result: false, error: err.message });
    });
});

//Route utilisée dans le screen EventScreen (récupération des données d'un évènement ciblé)
router.get("/event/:id", (req, res) => {
  Event.findById(req.params.id)
    .populate("organizer", ["firstName", "email"]) //Récupération des champs qui nous intéresse dans l'object 
    .populate("guests.userId", [
      "userId",
      "firstName",
      "email",
      "share",
      "hasPaid",
    ]) //Récupération des champs qui nous intéresse dans l'object
    .populate("transactions")
    .then((event) => {
      if (!event) {
        res.json({ result: false, error: "Évènement non trouvé" });
        return;
      }
      res.json({
        result: true,
        event, // on renvoie l'object event au complet dans le champs event soit => event: event
      });
    });
});

//Route utilisée dans le screen EventsListScreen (récupération de la liste des évènements grâce au token de l'user)
router.get("/user-events/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    .populate("events")
    .then((user) => {
      if (!user) {
        res.json({ result: false, error: "Compte utilisateur non trouvé" });
        return;
      }
      res.json({ result: true, events: user.events });
    });
});

// route pour fetch l'organisateur d'un évènement - non utilisée
// router.get("/organizer/:eventId", (req, res) => {
//   console.log("Received request for event:", req.params.eventId);

//   Event.findById(req.params.eventId)
//     .populate("organizer")
//     .then((event) => {
//       if (!event) {
//         console.log("Event not found:", req.params.eventId);
//         res.json({ result: false, error: "Évènement non trouvé" });
//         return;
//       }
//       console.log("Found event:", event);
//       res.json({ result: true, organizer: event.organizer });
//     });


router.post("/upload", async (req, res) => {
  const dirPath = 'C:\\tmp';
  try {
    // Create directory if it doesn't exist
    await mkdirAsync(dirPath, { recursive: true });
    console.log(`Directory created or already exists: ${dirPath}`);

    if (!req.files || !req.files.photoFromFront) {
      return res.status(400).json({ result: false, error: "No file uploaded" });
    }

    const photoPath = `${dirPath}\\${uniqid()}.jpg`;
    console.log(`Moving uploaded file to: ${photoPath}`);

    // Convert mv to a promise-based function
    const mvAsync = promisify(req.files.photoFromFront.mv);

    // Move the uploaded file
    await mvAsync(photoPath);
    console.log(`File moved successfully: ${photoPath}`);

    // Upload the file to Cloudinary
    const resultCloudinary = await cloudinary.uploader.upload(photoPath);
    res.json({ result: true, url: resultCloudinary.secure_url });
  } catch (error) {
    // Log the error message if available, otherwise log the entire error object
    console.error(`Error: ${error.message || JSON.stringify(error)}`);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

module.exports = router;