import { useContext } from "react";
import { YourContext } from "../context/YourContext";

export const useYourContext = () => {
  const context = useContext(YourContext);
  if (!context) {
    throw new Error("useYourContext must be used within YourProvider");
  }
  return context;
};
