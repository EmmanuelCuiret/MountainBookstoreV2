const jwt = require("jsonwebtoken");
require("dotenv").config(); // Charger les variables d'environnement

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Vérifier le token

    req.user = decoded; // Ajouter l'utilisateur à la requête
    next(); // Passer au middleware suivant
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;
