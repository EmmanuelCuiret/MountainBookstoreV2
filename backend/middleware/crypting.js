const bcrypt = require("bcrypt");

const hashPassword = async (password) => {
  const saltRounds = 10; // Plus le nombre est élevé, plus c'est sécurisé mais plus lent
  return await bcrypt.hash(password, saltRounds);
};

// Exemple d'utilisation
// (async () => {
//   const hashedPassword = await hashPassword("becode");
//   console.log("Mot de passe hashé:", hashedPassword);
// })();

module.exports = { hashPassword };