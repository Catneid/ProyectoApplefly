import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import "../App.css";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
