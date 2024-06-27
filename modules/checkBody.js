function checkBody(body, keys) { // keys est un tableau de chaînes de caractères
  let isValid = true; 

  for (const field of keys) { // Pour chaque champ dans keys
    if (!body[field] || body[field] === '') {   
      isValid = false; // Si le champ n'existe pas ou est vide, isValid est faux
    }
  }

  return isValid;   // Retourne isValid
}

module.exports = { checkBody };   // Exporte la fonction checkBody
