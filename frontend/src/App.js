import ListingsPage from "./components/ListingsPage";
import PropertyDetailPage from "./components/PropertyDetailPage";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ListingsPage />} />
      <Route path="/property/:id" element={<PropertyDetailPage />} />
    </Routes>
  );
}

export default App;
