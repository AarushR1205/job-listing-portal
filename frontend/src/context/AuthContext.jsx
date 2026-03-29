import { createContext, useState, useEffect, useContext } from 'react';
import { auth, googleProvider } from '../config/firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const token = await firebaseUser.getIdToken();
                localStorage.setItem('token', token);
                
                // Retrieve the custom role-based profile
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('token', token);

        const { data } = await api.post('/auth/login', { idToken: token });
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const register = async (userData) => {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('token', token);

        const { data } = await api.post('/auth/register', { ...userData, idToken: token });
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const loginWithGoogle = async () => {
        const userCredential = await signInWithPopup(auth, googleProvider);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('token', token);

        const { data } = await api.post('/auth/login', { idToken: token });
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const registerWithGoogle = async (userData) => {
        const userCredential = await signInWithPopup(auth, googleProvider);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('token', token);

        const { data } = await api.post('/auth/register', { ...userData, idToken: token });
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        registerWithGoogle,
        logout,
        isAuthenticated: !!user,
        isEmployer: user?.role === 'employer',
        isJobSeeker: user?.role === 'jobseeker',
        isAdmin: user?.role === 'admin'
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
