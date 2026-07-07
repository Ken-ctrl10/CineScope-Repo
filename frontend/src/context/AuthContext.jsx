import { createContext, useContext, useEffect, useState} from "react";
import api from "../services/api";

const AuthContext = createContext(); // Create a context for authentication

export function AuthProvider({ children }){
  const [user, setUser] = useState(null); // State to hold the authenticated user
  const [token, setToken] = useState(() => localStorage.getItem("token") || null); // State to hold the authentication token
  const [loading, setLoading] = useState(true); // State to indicate loading status

  useEffect(() => {
    async function hydrateUser() {
      if (!token) {
        setLoading(false);
        return; 
      }

      try {
        const res = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data);
      } 
      catch(err)
      {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    hydrateUser();
  }, [token]);

  async function login(email, pass) {
    const res = await api.post("/auth/login", { email, pass });
    const newToken = res.data.token;

    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(res.data.user);
  }

  async function register(email, pass) {
    await api.post("/auth/register", { email, pass });
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}