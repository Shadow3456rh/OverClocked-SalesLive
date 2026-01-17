import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { auth, db } from '@/lib/firebase';
import { localDB } from '@/lib/db';
// FIX: Import syncPendingData
import { saveUserLocally, syncPendingData } from '@/lib/storage';
import { 
  onAuthStateChanged,
  signInWithPopup,      
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  loginWithGoogle: (role: 'owner' | 'staff') => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const googleProvider = new GoogleAuthProvider();

  // --- 1. OFFLINE PERSISTENCE & SYNC LISTENER ---
  useEffect(() => {
    // A. Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          let appUser = await localDB.users.get(firebaseUser.uid);

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
        console.error("Auth Init Error:", err);
      } finally {
        setIsLoading(false);
      }
    });

    // B. Network Listener (THE FIX)
    const handleOnline = () => {
      console.log("Network restored! Syncing pending bills...");
      syncPendingData(); // <--- Triggers upload immediately when internet returns
    };

    // Listen for "online" event
    window.addEventListener('online', handleOnline);
    
    // Check once on mount just in case
    if (navigator.onLine) {
        syncPendingData();
    }

    return () => {
        unsubscribe();
        window.removeEventListener('online', handleOnline);
    };
  }, []);

  // --- 2. GOOGLE LOGIN ---
  const loginWithGoogle = async (selectedRole: 'owner' | 'staff'): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const email = fbUser.email?.toLowerCase();

      if (!email) throw new Error("Google account has no email.");

      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const existingData = userSnap.data() as User;
        if (existingData.role !== selectedRole) {
           await signOut(auth);
           throw new Error(`Access Denied: You are registered as ${existingData.role}, not ${selectedRole}.`);
        }
        await saveUserLocally(existingData);
        setUser(existingData);
        return true;
      }

      let newUserData: User;

      if (selectedRole === 'owner') {
        const newShopId = `${fbUser.uid}_shop`; 
        newUserData = {
          userId: fbUser.uid,
          name: fbUser.displayName || 'Owner',
          email: email,
          role: 'owner',
          shopId: newShopId,
          isActive: true,
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'shops', newShopId), {
          shopId: newShopId,
          shopName: `${newUserData.name}'s Store`,
          ownerId: fbUser.uid,
          createdAt: Date.now(),
          upiId: '', 
          upiPayeeName: ''
        });

      } else {
        const inviteRef = doc(db, 'invites', email);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
          await signOut(auth);
          throw new Error("Access Denied: No shop owner has added this email yet.");
        }

        const inviteData = inviteSnap.data();
        const finalName = inviteData.name || fbUser.displayName || 'Staff';

        newUserData = {
          userId: fbUser.uid,
          name: finalName,
          email: email,
          role: 'staff',
          shopId: inviteData.shopId,
          isActive: true,
          createdAt: Date.now()
        };
        await updateDoc(inviteRef, { status: 'claimed', claimedBy: fbUser.uid });
      }

      await setDoc(userRef, newUserData);
      await saveUserLocally(newUserData);
      setUser(newUserData);
      return true;

    } catch (error: any) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};