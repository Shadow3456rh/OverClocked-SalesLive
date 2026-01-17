import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { auth, db } from '@/lib/firebase';
import { localDB } from '@/lib/db';
import { saveUserLocally, createUser as createStorageUser } from '@/lib/storage';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role: 'owner' | 'staff') => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 1. Check Local DB first (Faster)
          let appUser = await localDB.users.get(firebaseUser.uid);

          // 2. If not local, fetch from Firestore (Sync)
          if (!appUser && navigator.onLine) {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              appUser = userDoc.data() as User;
              await saveUserLocally(appUser); 
            }
          }

          if (appUser) {
            setUser(appUser);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth State Error:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login Failed:", error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string, role: 'owner' | 'staff'): Promise<boolean> => {
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Create App User Object
      // We reuse the storage function but force the ID to match Firebase UID
      const newUser: User = {
          userId: firebaseUser.uid,
          name,
          email,
          role,
          shopId: role === 'owner' ? crypto.randomUUID() : '', // Staff needs to be linked later
          isActive: true,
          createdAt: Date.now()
      };

      // 3. Save to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      // 4. Save Locally
      await saveUserLocally(newUser);

      setUser(newUser);
      return true;
    } catch (error) {
      console.error("Registration Failed:", error);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};