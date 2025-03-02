import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

  //const baseURL = "mountain-bookstore-v2.netlify.app";
  const baseURL = "http://localhost:3300/";

    try {

      const response = await axios.post(baseURL + "login", { login, password });
      if(response.data.token) {
        localStorage.setItem("token", response.data.token); // Stocker le token JWT
        navigate("/");
      } else {
        console.error("No token received !");
      }
    } catch (error) {
      console.error("Connection error : ", error);
      alert("Invalid credentials");
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
