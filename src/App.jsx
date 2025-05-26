import AppRoutes from "./routes/index.jsx";
import { useLocation } from "wouter";
// 本页面为布局页面，首页显示，不应该参与路由
function App() {
  // 路由跳转
  // const [location, navigate] = useLocation();
  // navigate("/about");
  
  return <AppRoutes />;
}

export default App;
