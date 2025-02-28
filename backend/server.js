const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// 📌 Route pour voir la liste des candidats pour un projet en particulier
app.get("/project/:id/candidates", (req, res) => {
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
app.get("/project/:id", (req, res) => {
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
app.delete("/project/candidate/:id", (req, res) => {
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
app.delete("/project/:id", (req, res) => {
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
app.patch("/project/:id", (req, res) => {
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
app.get("/projects", (req, res) => {
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
app.get("/projects-with-candidates", (req, res) => {
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
app.post("/add-project", (req, res) => {
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
app.post("/project/:id/add-candidate", (req, res) => {
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
