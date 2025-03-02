const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const app = express();
const authMiddleware = require("./middleware/authMiddleware.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypting = require("./middleware/crypting.js");

app.use(cors());
app.use(express.json());

let db;

(async () => {
  db = await connectDB();
})();


// const password = "becode";
// const hashedPassword = "$2b$10$sBUql.gubycwytMYtleIPe1uBbEGiIEPStg5ZFka58uy5tFNbAUwG";

// bcrypt.compare(password, hashedPassword).then(result => {
//   console.log("Mot de passe valide ?", result);
// });

// (async () => {
//   const hashedPassword = await crypting.hashPassword("becode");
//   console.log("Mot de passe hashé:", hashedPassword);
// })();


// 📌 Route de connexion
app.post("/login", (req, res) => {
  const { login, password } = req.body;

  // Vérifier si l'utilisateur existe
  db.query("SELECT * FROM users WHERE login = ?", [login], async (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length === 0) {
          return res.status(401).json({ error: "Invalid login" });
      }

      const user = results[0];

      // Vérifier le mot de passe hashé
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
          return res.status(401).json({ error: "Invalid password" });
      }

      // Générer un token JWT
      const token = jwt.sign({ userId: user.id, login: user.login }, process.env.JWT_SECRET, { expiresIn: "1h" });

      res.json({ token });
  });
});

// 📌 Route pour voir la liste des candidats pour un projet en particulier
app.get("/project/:id/candidates", authMiddleware, (req, res) => {
  const projectId = req.params.id;
  
  const sql = `
 select * from (SELECT 
 	  p.id as id,
      p.author AS candidate_name,  -- L'auteur est inclus comme un candidat
      NULL AS candidate_id         -- Identifiant NULL pour l'auteur
    FROM projects p
     WHERE p.id = ?
    
    UNION ALL  -- Combine les auteurs et les candidats dans un seul résultat

    SELECT 
    	p.id as id,
      c.name AS candidate_name, 
      c.id AS candidate_id
    FROM projects p
    JOIN candidates c ON p.id = c.project_id) as combined_results
    where id = ?

    ORDER BY candidate_id IS NULL DESC, candidate_id;
  `;
  
  db.query(sql, [projectId, projectId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json(results);
  });
});

// 📌 Route récupérer un projet en particulier
app.get("/project/:id", authMiddleware, (req, res) => {
  const projectId = req.params.id;
  const sql = `
    SELECT 
      p.id, p.title, p.author, p.description, p.technologies
    FROM projects p
    WHERE p.id = ?
  `;

  db.query(sql, [projectId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (results.length === 0) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    
    res.json(results[0]);
  });
});

// 📌 Route pour supprimer un participant d'un projet
app.delete("/project/candidate/:id", authMiddleware, (req, res) => {
  const candidateId = req.params.id;

  const sql = "DELETE FROM candidates WHERE id = ?";
  db.query(sql, [candidateId], (err, result) => {
    if (err) {
      console.error("Error while deleting candidate: ", err);
      return res.status(500).json({ error: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.status(200).json({ message: "Candidate deleted successfully!" });
  });
});

// 📌 Route pour supprimer un projet
app.delete("/project/:id", authMiddleware, (req, res) => {
  const projectId = req.params.id;

  const sql = "DELETE FROM projects WHERE id = ?";
  db.query(sql, [projectId], (err, result) => {
    if (err) {
      console.error("Error while deleting project:", err);
      return res.status(500).json({ error: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted successfully!" });
  });
});

// 📌 Route pour mettre à jour un projet en particulier
app.patch("/project/:id", authMiddleware, (req, res) => {
  const projectId = req.params.id;
  const { title, author, description, technologies } = req.body;
  
  const sql = `
    UPDATE projects
    SET title = ?, author = ?, description = ?, technologies = ?
    WHERE id = ?
  `;
  
  db.query(sql, [title, author, description, technologies, projectId], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    
    res.json({ message: "Project updated successfully" });
  });
});

// 📌 Route pour voir la liste des projets
app.get("/projects", authMiddleware, (req, res) => {
  const sql = `
    SELECT 
      p.id, p.title, p.author, 
      COUNT(c.id) AS candidate_count
    FROM projects p
    LEFT JOIN candidates c ON p.id = c.project_id
    GROUP BY p.id, p.title, p.author
  `;

  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// 📌 Route pour voir la liste des projets et leurs candidats
app.get("/projects-with-candidates", authMiddleware, (req, res) => {
  const sql = `
    SELECT 
      p.id, 
      p.title, 
      p.author AS candidate_name,  -- L'auteur est inclus comme un candidat
      NULL AS candidate_id         -- Identifiant NULL pour l'auteur
    FROM projects p
    
    UNION ALL  -- Combine les auteurs et les candidats dans un seul résultat

    SELECT 
      p.id, 
      p.title, 
      c.name AS candidate_name, 
      c.id AS candidate_id
    FROM projects p
    JOIN candidates c ON p.id = c.project_id

    ORDER BY id, candidate_id IS NULL DESC, candidate_name;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Regrouper les candidats par projet
    const projectsMap = new Map();
    results.forEach(row => {
      if (!projectsMap.has(row.id)) {
        projectsMap.set(row.id, {
          id: row.id,
          title: row.title,
          candidates: []  // Liste des candidats
        });
      }
      projectsMap.get(row.id).candidates.push(row.candidate_name);
    });

    res.json(Array.from(projectsMap.values()));
  });
});

// 📌 Route pour ajouter un project
app.post("/add-project", authMiddleware, (req, res) => {
  const { title, description, author, technologies } = req.body;

  if (!title || !description || !author) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO projects (title, description, author, technologies) VALUES (?, ?, ?, ?)";
  db.query(sql, [title, description, author, technologies], (err, result) => {
    if (err) {
      console.error("Error while inserting :", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.status(201).json({ message: "Project created successfully !" });
  });
});

// 📌 Route pour ajouter un candidat à un projet
app.post("/project/:id/add-candidate", authMiddleware, (req, res) => {
  const projectId = req.params.id;
  const { candidateName } = req.body;

  if (!candidateName) {
    return res.status(400).json({ error: "Candidate name is required" });
  }

  const sql = "INSERT INTO candidates (name, project_id) VALUES (?, ?)";
  db.query(sql, [candidateName, projectId], (err, result) => {
    if (err) {
      console.error("Error while adding candidate:", err);
      return res.status(500).json({ error: "Server error" });
    }

    res.status(201).json({ message: "Candidate added successfully!", candidateId: result.insertId });
  });
});

app.listen(3300, () => {
  console.log("Backend server on http://localhost:3300");
});
