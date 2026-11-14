import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SessionContext = createContext()

export const SessionProvider = ({ children }) => {
    const [user, setUser] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get("/api/auth/@me")
                setUser(response.data)
            } catch (error) {
                console.log("No autenticado.")
            }
        };

        fetchData()
    }, [])

    return (
        <SessionContext.Provider value={{ user, setUser }}>
            {children}
        </SessionContext.Provider>
    )
}

export const useSession = () => useContext(SessionContext)