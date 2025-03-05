import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./CreateProject.css";
import axiosInstance from "../../axiosInstance";


const CreateProject = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  //const baseURL = "http://localhost:3300/";
  const baseURL = "https://mountainbookstorev2-1.onrender.com/";

  const navigate = useNavigate();
  const sanitizeInput = (value) => value.trim().replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'@-]/g, "");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !author.trim()) {
      setIsSubmitting(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const newProject = {
      title: sanitizeInput(title),
      description: sanitizeInput(description),
      author: sanitizeInput(author),
      technologies: sanitizeInput(technologies)
    };

    try {
      await axiosInstance.post(baseURL + "add-project", newProject);
      navigate("/");
    } catch (error) {
      console.error("Error creating project :", error);
      setErrorMessage("Error creating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h2>Create a project</h2>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title :</label>
          <input 
            type="text" 
            id="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className={isSubmitting && !title.trim() ? "input-error" : ""} 
          />
          {isSubmitting && !title.trim() && <p className="error-message">Project title is required</p>}
        </div>
        <div>
          <label htmlFor="author">Author :</label>
          <input 
            type="text" 
            id="author" 
            value={author} 
            onChange={(e) => setAuthor(e.target.value)} 
            className={isSubmitting && !author.trim() ? "input-error" : ""} 
          />
          {isSubmitting && !author.trim() && <p className="error-message">Author name is required</p>}
        </div>        

        <div>
          <label htmlFor="description">Description :</label>
          <textarea 
            id="description" 
            rows="7" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            className={isSubmitting && !description.trim() ? "input-error" : ""} 
          />
          {isSubmitting && !description.trim() && <p className="error-message">Description is required</p>}
        </div>

        <div>
          <label htmlFor="technologies">Technologies :</label>
          <textarea 
            id="technologies" 
            rows="3" 
            value={technologies} 
            onChange={(e) => setTechnologies(e.target.value)} 
          />
        </div>

        <div>
          <button className="event-button" type="submit">Create</button>
          <Link to="/">
            <button className="event-button" type="button">Cancel</button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
