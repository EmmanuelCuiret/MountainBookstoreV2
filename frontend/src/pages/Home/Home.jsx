import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import "./Loading.css";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "../../axiosInstance";

function Home() {
  const baseURL = "http://localhost:3300/";
  //const baseURL = "mountain-bookstore-v2.netlify.app";
  const [projects, setProjects] = useState([]); // Liste des projets
  const [candidatesAndProjects, setCandidatesAndProjects] = useState({}); // Liste détaillée avec candidats
  const [showCandidates, setShowCandidates] = useState(false); // Basculer entre vues
  const [loadingCandidates, setLoadingCandidates] = useState(false); // État de chargement

  const token = localStorage.getItem("token"); // Récupérer le token stocké

  // Chargement des projets au démarrage
  useEffect(() => {
    axiosInstance
      .get(baseURL + "projects")
      .then((response) => setProjects(response.data))
      .catch((error) =>
        console.error("Erreur lors de la récupération des projets:", error)
      );
  }, []);

  // Charger la liste des projets avec les candidats lorsqu'on clique sur "Afficher candidats"
  const fetchDetailedProjects = () => {
    setLoadingCandidates(true);
    axiosInstance
      .get(baseURL + "projects-with-candidates")
      .then((response) => {
        const formattedData = {};
        response.data.forEach((project) => {
          formattedData[project.title] =
            project.candidates.length > 0
              ? project.candidates
              : ["No candidates"];
        });

        setCandidatesAndProjects(formattedData);
        setShowCandidates(true);
      })
      .catch((error) =>
        console.error(
          "Erreur lors de la récupération des projets détaillés:",
          error
        )
      )
      .finally(() => setLoadingCandidates(false));
  };

  // Fonction pour afficher/masquer la liste des candidats
  const handleShowAttendeeAndProjects = () => {
    if (showCandidates) {
      setShowCandidates(false);
    } else {
      fetchDetailedProjects();
    }
  };

  // Suppression d'un projet (à implémenter côté backend aussi)
  const handleRemoveProject = (project) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        axiosInstance
          .delete(baseURL + `project/${project.id}`)
          .then(() => {
            setProjects(projects.filter((p) => p.id !== project.id));
            //Swal.fire("Deleted!", "Your project has been deleted.", "success");
          })
          .catch((error) =>
            Swal.fire("Error!", "Could not delete project.", "error")
          );
      }
    });
  };

  // Exporter les projets et candidats en PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Ajouter un titre
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(
      "List of Mountain Projects from the Hamilton 10 promotion",
      105,
      15,
      { align: "center" }
    );

    // Préparer les données pour le tableau
    const tableData = [];

    Object.entries(candidatesAndProjects).forEach(([title, candidates]) => {
      // Ajouter une ligne avec le projet (avec un fond coloré)
      tableData.push([
        {
          content: title.toUpperCase(),
          colSpan: 2,
          styles: {
            fillColor: [200, 220, 255],
            halign: "left",
            fontStyle: "bold",
          },
        },
      ]);

      // Ajouter les candidates
      candidates.forEach((participant, index) => {
        tableData.push([
          "", // Colonne vide pour garder la structure du tableau
          {
            content: index === 0 ? `${participant}` : participant,
            styles: index === 0 ? { fontStyle: "bold" } : {},
          },
        ]);
      });
    });

    // Générer le tableau
    autoTable(doc, {
      startY: 25,
      head: [["Project", "Candidates"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 12 },
      headStyles: {
        fillColor: [30, 80, 160],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] }, // Gris clair pour les lignes paires

      columnStyles: {
        0: { cellWidth: "auto" }, // Colonne "Project" (80px)
        1: { cellWidth: 60 }, // Colonne "Candidates" (100px)
      },
    });

    // Ajouter la date et l'heure en bas du PDF
    const now = new Date();
    const dateTime =
      now.toLocaleDateString("fr-FR") + " " + now.toLocaleTimeString("fr-FR");

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Generated on: ${dateTime}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );

    doc.save("Mountain_project - Hamilton_10 - Projects_and_candidates.pdf");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login"; // Redirection après la déconnexion
  };

  return (
    <>
      <div id="event-card" className="banner">
        <div className="header">
          <h1>Mountain Bookstore</h1>
          <Link to="add-project">
            <button className="event-button">Add a project</button>
          </Link>
          <button className="event-button" onClick={handleLogout}>Logout</button>
        </div>

        <div className="event-grid">
          {Array.isArray(projects) && projects.length > 0 ? (
            projects.map((project) => (
              <div key={project.id} className="event-card">
                <h2>
                  <Link to={`/project/${project.id}`} className="link-event">
                    {project.title.length > 40
                      ? project.title.slice(0, 40) + "..."
                      : project.title}
                  </Link>
                </h2>
                <p>Author: {project.author}</p>
                <p>Candidates: {project.candidate_count}</p>
                <button className="event-button" onClick={() => handleRemoveProject(project)}>
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p>No projects found.</p>
          )}
        </div>

        {projects.length > 0 && (
          <Link to="#" onClick={handleShowAttendeeAndProjects}>
            <br />
            {showCandidates ? "Hide the view" : "Summary view"}
          </Link>
        )}

        {showCandidates && (
          <div className="participant-container">
            <h2>List of projects and candidates</h2>
            <button className="event-button" onClick={exportToPDF}>Export to PDF</button>

            {loadingCandidates ? (
              <p>Loading candidates...</p>
            ) : Object.keys(candidatesAndProjects).length > 0 ? (
              <div className="participant-grid">
                {Object.entries(candidatesAndProjects).map(
                  ([title, candidates], index) => (
                    <div key={index} className="participant-card">
                      <h3>{title.toUpperCase()}</h3>
                      <ul className="event-list">
                        {candidates.map((candidate, candidateIndex) => (
                          <li key={candidateIndex}>
                            {candidateIndex === 0 && "👑"} {candidate}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p>No projects found.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Home;
