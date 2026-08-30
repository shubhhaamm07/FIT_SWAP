import AppErrorBoundary from "./components/common/AppErrorBoundary";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <AppErrorBoundary>
      <AppRoutes />
    </AppErrorBoundary>
  );
}

export default App;
