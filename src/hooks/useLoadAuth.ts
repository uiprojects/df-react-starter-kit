import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
 
export const useAuth = () => {
  const [authTypeResult] = useState(null);
  const [userNameCookie, setUserNameCookie] = useState<string | null>(null);
 
  useEffect(() => {
    // V3: Authentication type config is now in config/default.json
    // If you need to fetch auth type dynamically, implement the endpoint call here
    setUserNameCookie(Cookies.get('df_ds_rem_user') || null);
  }, []);
 
  return { userNameCookie, authTypeResult };
};
 