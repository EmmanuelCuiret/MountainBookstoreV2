require("dotenv").config();
const mysql = require("mysql2");

// Vérification des variables d'environnement
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT) {
  console.error("❌ Erreur: Certaines variables d'environnement sont manquantes.");
  process.exit(1); // Arrêter le serveur si la config est incorrecte
}

// Fonction pour se connecter à la base de données
const connectDB = async () => {
  try {
    const db = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
    });

    console.log("✅ Connecté à MariaDB !");
    return db;
  } catch (err) {
    console.error("❌ Erreur de connexion à la base de données:", err.message);
    process.exit(1); // Arrêter le serveur si la connexion échoue
  }
};

// Exporter la connexion à la base de données
module.exports = connectDB;
