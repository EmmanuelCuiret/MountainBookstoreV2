import React, { use, useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./ProjectDetail.css";
import Swal from "sweetalert2";
import axiosInstance from "../../axiosInstance";

const ProjectDetail = () => {

  const baseURL = "http://localhost:3300/";
  //const baseURL = "https://mountainbookstorev2-1.onrender.com/";
  
  const sanitizeInput = (value) =>
    value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'@-]/g, ""); //Filtre sur les caractères admis à la saisie

  const { id } = useParams(); // Récupère l'ID du projet depuis l'URL
  const [project, setProject] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const [modif, setModif] = useState(false); //OK
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [technologies, setTechnologies] = useState("");

  const [candidateNameForAdd, setCandidateNameForAdd] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false); //Utilisé pour afficher les messages d'erreur uniquement lors de la soumission du formulaire

  const fetchProject = async () => {
    try {
      const routeURL = `project/${id}`;
      const response = await axiosInstance.get(baseURL + routeURL);
      setProject(response.data); // Met à jour l'état avec les nouvelles données

      try {
        const routeURL2 = `project/${id}/candidates`;
        const response2 = await axiosInstance.get(baseURL + routeURL2);
        setCandidates(response2.data); // Met à jour l'état avec les nouvelles données
        console.log(response2.data);
      } catch (error) {
        console.error("Error retrieving project :", error);
        setError("Project not found");
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error retrieving project :", error);
      setError("Project not found");
    } finally {
      setLoading(false);
    }
  };

  //Rerender en cas d'ajout d'événement
  useEffect(() => {
    // Fonction pour récupérer les détails du projet
    fetchProject();
  }, [id]); // L'effet sera déclenché à chaque fois que l'ID change

  //Soumission du formulaire pour ajouter un candidat
  const handleAddCandidate = async (e) => {
    e.preventDefault();

    // Vérifications
    if (!candidateNameForAdd || !candidateNameForAdd.trim()) {
      setIsSubmitting(true); // Active la validation
      return;
    }

    // Demande de confirmation d'ajout de candidat avec SweetAlert2
    const result = await Swal.fire({
      title: "Confirm addition",
      html: `
        <p>Add this candidate ?</p>
        <strong>Nom :</strong> "${candidateNameForAdd}"<br/>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, add",
      cancelButtonText: "No, cancel",
    });

    // Si l'utilisateur annule, on stoppe ici
    if (!result.isConfirmed) return;

    try {
      await axiosInstance.post(baseURL + `project/${id}/add-candidate`, {
        candidateName: candidateNameForAdd,
      });
      await fetchProject(); // Pour récupérer les données mises à jour
      //toast.success("Candidate added successfully !");
      setCandidateNameForAdd(""); // Réinitialisation du formulaire
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error adding candidate :", error);
      //toast.error("Error adding candidate");
    }
  };

  const handleCancelAddCandidate = () => {
    // Réinitialisation du formulaire
    setCandidateNameForAdd("");
    setIsSubmitting(false);
  };

  //Initialisation des états quand l'événement est chargé
  useEffect(() => {
    if (project) {
      setTitle(project.title || "");
      setDescription(project.description || "");
      setAuthor(project.author || "");
      setTechnologies(project.technologies || "");
    }
  }, [project]);

  // Modifier l'événement
  const handleSubmitModif = async (e) => {
    e.preventDefault();

    //Vérifie que tous les champs sont remplis avant de soumettre le formulaire
    if (!title.trim() || !description.trim() || !author.trim()) {
      setIsSubmitting(true); //Active la validation
      return; //Affiche les messages d'erreur
    }

    const updatedFields = {
      title: title,
      author: author,
      description: description,
      technologies: technologies,
    };

    try {
      const routeURL = `project/${id}`;
      await axiosInstance.patch(baseURL + routeURL, updatedFields);
      //Fusionner les nouvelles données avec l'événement existant
      setProject((prevProject) => ({
        ...prevProject, //Garde les anciennes valeurs
        ...updatedFields, //Applique les changements
      }));
      //toast.success("Événement modifié avec succès !");
      setModif(false);
    } catch (error) {
      console.error("Erreur lors de la modification de l'événement :", error);
      //toast.error("Erreur lors de la modification de l'événement.");
    }
  };

  //Suppression d'un participant à un événement
  const handleDeleteAttendee = async (candidateId, candidateName, e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "Confirm deletion",
      html: `
        <p>Are you sure you want to remove this candidate?</p>
        <strong>Name:</strong> "${candidateName}"<br/>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "No, cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const routeURL = `project/candidate/${candidateId}`;
      await axiosInstance.delete(baseURL + routeURL);
      await fetchProject();
      //toast.success("Candidate successfully deleted!");
    } catch (err) {
      console.log("Error deleting candidate :", err);
      //toast.error("Error deleting candidate.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!project) return <div>No project found.</div>; //Evite une erreur si event est null

  return (
    <div className="event-detail-container">
      {modif ? (
        // Mode modification
        <div className="event-card-no-scale">
          <h2 style={{ textAlign: "center" }}>Edit the project</h2>
          <form onSubmit={handleSubmitModif} className="form-modif">
            <div className="form-group">
              <label htmlFor="title">Title :</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(sanitizeInput(e.target.value))}
                className={isSubmitting && !title.trim() ? "input-error" : ""}
              />
              {isSubmitting && !title.trim() && (
                <p className="error-message">Project title is required</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="author">Author :</label>
              <textarea
                value={author}
                rows="1"
                id="author"
                onChange={(e) => setAuthor(sanitizeInput(e.target.value))}
                className={isSubmitting && !author.trim() ? "input-error" : ""}
              />
              {isSubmitting && !author.trim() && (
                <p className="error-message">Author name is required</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="description">Description :</label>
              <textarea
                id="description"
                rows="7"
                value={description}
                onChange={(e) => setDescription(sanitizeInput(e.target.value))}
                className={
                  isSubmitting && !description.trim() ? "input-error" : ""
                }
              />
              {isSubmitting && !description.trim() && (
                <p className="error-message">Description is required</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="technologies">Technologies :</label>
              <textarea
                id="technologies"
                rows="3"
                value={technologies}
                onChange={(e) => setTechnologies(sanitizeInput(e.target.value))}
                className={
                  isSubmitting && !technologies.trim() ? "input-error" : ""
                }
              />
            </div>
            <div className="form-actions">
              <button className="event-button" type="submit">
                Save
              </button>
              <button
                className="event-button"
                type="button"
                onClick={() => setModif(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Mode affichage
        <>
          <div className="event-card-no-scale">
            <h1 className="link-event">{project.title.toUpperCase()}</h1>
            <p>
              <strong>Description:</strong> {project.description}
            </p>
            <p>
              <strong>Technologies:</strong> {project.technologies}
            </p>

            <div className="button-group">
              <button className="event-button" onClick={() => setModif(true)}>
                Edit the project
              </button>
            </div>
          </div>

          <div className="event-card-no-scale">
            <h3 style={{ textAlign: "center" }}>Candidates</h3>
            <table className="participant-table" cellPadding="5">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th style={{ width: "150px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <tr key={index} className="participant-row">
                    <td style={{ textAlign: "left", paddingLeft: "20px" }}>
                      {!candidate.candidate_id && "👑"}{" "}
                      {candidate.candidate_name}
                    </td>
                    <td>
                      {candidate.candidate_id && (
                        <button
                          type="button"
                          onClick={(e) =>
                            handleDeleteAttendee(
                              candidate.candidate_id,
                              candidate.candidate_name,
                              e
                            )
                          }
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="event-card-no-scale">
            <h3 style={{ textAlign: "center" }}>Add a candidate</h3>
            <form onSubmit={handleAddCandidate}>
              <label>
                Name :
                <input
                  type="text"
                  value={candidateNameForAdd}
                  onChange={(e) => setCandidateNameForAdd(e.target.value)}
                />
                {isSubmitting && !candidateNameForAdd && (
                  <p className="error-message">Name is required</p>
                )}
              </label>
              <div className="button-group">
                <button className="event-button" type="submit">
                  Add a candidate
                </button>
                <button
                  className="event-button"
                  type="button"
                  onClick={handleCancelAddCandidate}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div className="back-link">
            <Link to="/">Back to home</Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectDetail;
