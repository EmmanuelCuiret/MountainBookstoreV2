import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home/Home";
import CreateProject from "./pages/CreateProject/CreateProject";
import ProjectDetail from "./pages/ProjectDetail/ProjectDetail";
import Login from "./pages/Login";
import PrivateRoute from "./PrivateRoute";


function App() {
  return (
    <>
      <Routes>
        {/*Page de connexion accessible à tous */}
        <Route path="/login" element={<Login />} />
        
        {/*Toutes les routes protégées */}
        <Route element={<PrivateRoute/>}>
          <Route path="/" element={<Home />} />
          <Route path="/add-project" element={<CreateProject />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
