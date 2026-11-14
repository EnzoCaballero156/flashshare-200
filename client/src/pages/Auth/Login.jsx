import { useState } from "react";
import api from "../../services/api";
import "./Auth.css";

const Login = ({ onRegisterClick }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const autenticar = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);
        try {
            await api.post("/api/auth/login", {
                email,
                password,
            });
            window.location.href = "/";
        } catch (error) {
            setErrorMsg(error.response?.data?.error || "Credenciales incorrectas.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <header className="auth-header">
                <strong className="auth-brand">FlashShare 200</strong>
                <div className="auth-header-actions">
                    <button type="button" className="auth-btn-outline active" aria-current="page">
                        Iniciar sesión
                    </button>
                    <button type="button" className="auth-btn-outline" onClick={onRegisterClick}>
                        Crear cuenta
                    </button>
                </div>
            </header>

            <main className="auth-main">
                <section className="auth-card">
                    <h1 className="auth-title">Inicia sesión</h1>
                    <p className="auth-desc">Accede a tu cuenta de FlashShare 200.</p>

                    {errorMsg && <div className="auth-error">{errorMsg}</div>}

                    <form onSubmit={autenticar}>
                        <label className="auth-label" htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            className="auth-input"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label className="auth-label" htmlFor="login-password">Contraseña</label>
                        <input
                            id="login-password"
                            className="auth-input"
                            type="password"
                            placeholder="Tu contraseña"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? "Ingresando..." : "Ingresar"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        ¿No tienes cuenta?{" "}
                        <button type="button" className="auth-link" onClick={onRegisterClick}>
                            Regístrate
                        </button>
                    </p>
                </section>
            </main>
        </div>
    );
};

export default Login;