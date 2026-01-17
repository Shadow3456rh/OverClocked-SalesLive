import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { auth, db } from '@/lib/firebase';
import { localDB } from '@/lib/db';
import { saveUserLocally } from '@/lib/storage';
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

  // --- OFFLINE PERSISTENCE CHECK ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 1. Check Local DB first (This works Offline!)
          let appUser = await localDB.users.get(firebaseUser.uid);

          // 2. If online and missing locally, sync from Cloud
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
    return () => unsubscribe();
  }, []);

  // --- SMART GOOGLE LOGIN ---
  const loginWithGoogle = async (selectedRole: 'owner' | 'staff'): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const email = fbUser.email?.toLowerCase();

      if (!email) throw new Error("Google account has no email.");

      // 1. Check if User Document Exists
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // --- EXISTING USER ---
        const existingData = userSnap.data() as User;
        
        // Strict Role Check
        if (existingData.role !== selectedRole) {
           await signOut(auth);
           throw new Error(`Access Denied: You are registered as ${existingData.role}, not ${selectedRole}.`);
        }
        
        await saveUserLocally(existingData);
        setUser(existingData);
        return true;
      }

      // --- NEW USER (Registration Logic) ---
      let newUserData: User;

      if (selectedRole === 'owner') {
        // OWNERS: Auto-generate a new Shop
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

        // Create Shop Document Immediately
        await setDoc(doc(db, 'shops', newShopId), {
          shopId: newShopId,
          shopName: `${newUserData.name}'s Store`,
          ownerId: fbUser.uid,
          createdAt: Date.now(),
          upiId: '', 
          upiPayeeName: ''
        });

      } else {
        // STAFF: Check for an Invite (The "Handshake")
        const inviteRef = doc(db, 'invites', email);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
          await signOut(auth);
          throw new Error("Access Denied: No shop owner has added this email yet.");
        }

        const inviteData = inviteSnap.data();
        
        // Create Staff User linked to Owner's Shop
        newUserData = {
          userId: fbUser.uid,
          name: fbUser.displayName || inviteData.name,
          email: email,
          role: 'staff',
          shopId: inviteData.shopId, // Link to Owner
          isActive: true,
          createdAt: Date.now()
        };

        // Mark invite as claimed
        await updateDoc(inviteRef, { status: 'claimed', claimedBy: fbUser.uid });
      }

      // Save User Profile (Cloud + Local)
      await setDoc(userRef, newUserData);
      await saveUserLocally(newUserData);
      
      setUser(newUserData);
      return true;

    } catch (error: any) {
      console.error("Login Error:", error);
      throw error; // Let UI handle the error message
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