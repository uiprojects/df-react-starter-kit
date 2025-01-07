import { createBrowserRouter } from "react-router-dom";
import Main from "../layout/Main";
import Login from "../components/Login";
import Home from "../layout/Home";

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
            }
        ]
    },
]);

export default router;
