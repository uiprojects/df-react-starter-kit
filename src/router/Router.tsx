import { createBrowserRouter } from "react-router-dom";
import Main from "../layout/Main";
import Login from "../components/Login";
import Home from "../layout/Home";
import ChangePassword from "../components/Auth/ChangePassword";
import ForgotPassword from "../components/Auth/ForgotPassword";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Main/>,
        children : [
            // { index: true, element: <Navigate to="/login" replace /> },
            {
                path: "/",
                element: <Login />,
            },
            {
                path : "/login",
                element : <Login/>
            },
            {
                path : "/home",
                element : <Home />
            },
            {
                path: "/change-password",
                element: <ChangePassword/>
            },
            {
                path: "/forgot-password",
                element: <ForgotPassword/>
            }
        ]
    },
]);

export default router;
