import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
 
const Logout = () => {
  const navigate = useNavigate();
 
  useEffect(() => {
    Cookies.remove('df_user');
    Cookies.remove('token');
    navigate('/login');
  }, [navigate]);
 
  return null; 
};
 
export default Logout;
 