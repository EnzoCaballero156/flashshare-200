import { useState } from "react";
import api from "../../services/api";
import "./Auth.css";

const Register = ({ onLoginClick }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const autenticar = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);
        try {
            await api.post("/api/auth/register", {
                email,
                password,
            });
            window.location.href = "/";
        } catch (error) {
            setErrorMsg(error.response?.data?.error || "No se pudo crear la cuenta.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <header className="auth-header">
                <strong className="auth-brand">FlashShare 200</strong>
                <div className="auth-header-actions">
                    <button type="button" className="auth-btn-outline" onClick={onLoginClick}>
                        Iniciar sesión
                    </button>
                    <button type="button" className="auth-btn-outline active" aria-current="page">
                        Crear cuenta
                    </button>
                </div>
            </header>

            <main className="auth-main">
                <section className="auth-card">
                    <h1 className="auth-title">Regístrate</h1>
                    <p className="auth-desc">Crea tu cuenta de FlashShare 200.</p>

                    {errorMsg && <div className="auth-error">{errorMsg}</div>}

                    <form onSubmit={autenticar}>
                        <label className="auth-label" htmlFor="register-email">Email</label>
                        <input
                            id="register-email"
                            className="auth-input"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label className="auth-label" htmlFor="register-password">Contraseña</label>
                        <input
                            id="register-password"
                            className="auth-input"
                            type="password"
                            placeholder="Crea una contraseña"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? "Registrando..." : "Registrarse"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        ¿Ya tienes cuenta?{" "}
                        <button type="button" className="auth-link" onClick={onLoginClick}>
                            Inicia sesión
                        </button>
                    </p>
                </section>
            </main>
        </div>
    );
};

export default Register;