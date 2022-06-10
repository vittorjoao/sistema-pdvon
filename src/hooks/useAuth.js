import { createContext, useEffect, useState, useContext } from 'react';
import { useClient } from 'react-supabase';

const AuthContext = createContext({});

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const client = useClient();

  async function handleLogin(email, password) {
    setLoading(true);

    const { data: authData, error: authError } = await client.auth.signIn({
      email: email,
      password: password,
    });

    if (authError) throw authError;

    const { data: userData, error: userError } = await client
      .from('profiles')
      .select('*, companies(*)')
      .eq('email', authData.user.email);

    if (userError) throw userError;

    console.log(userData);

    setUser(userData[0]);
    setLoading(false);
  }

  useEffect(() => {
    client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, [client]);

  return (
    <AuthContext.Provider value={{ handleLogin, loading, session, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
