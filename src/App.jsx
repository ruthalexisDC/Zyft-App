// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { useAuth } from "./context/AuthContext";
// import { ThemeProvider } from "./context/ThemeContext.jsx";
// import { SocketProvider } from "./context/SocketContext.jsx";
// import Layout from "./components/Layout";
// import PrivateRoute from "./components/PrivateRoute";
// import Landing from "./pages/Landing";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Home from "./pages/Home";
// import Discover from "./pages/Discover";
// import LogWorkout from "./pages/LogWorkout";
// import Activity from "./pages/Activity";
// import Profile from "./pages/Profile";
// import EditProfile from "./pages/EditProfile";
// import ForgotPassword from "./pages/ForgotPassword";
// import AccountSetting from "./pages/AccountSetting";
// import HelpCenter from "./pages/HelpCenter";
// import PrivacyPolicy from "./pages/PrivacyPolicy";
// import TermsOfService from "./pages/TermsOfService";
// import ResetPassword from "./pages/ForgotPassword";
// import WorkoutPost from "./pages/WorkoutPost";

// function App() {
//   const isDevMode = true;
//   const { user, resetKey } = useAuth();

//   return (
//     <ThemeProvider>
//       <BrowserRouter>
//         <SocketProvider>
//           <Routes>
//             {/* Public routes (no bottom nav) */}
//             <Route path="/" element={<Landing />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
//             <Route path="/forgot-password" element={<ForgotPassword />} />

//             {/* Protected routes (with bottom nav) */}
//             <Route element={<Layout key={user?._id || "guest"} />}>
//               <Route
//                 path="/home"
//                 element={
//                   isDevMode ? (
//                     <Home key={user?._id || "guest"} />
//                   ) : (
//                     <PrivateRoute>
//                       <Home key={user?._id || "guest"} />
//                     </PrivateRoute>
//                   )
//                 }
//               />
//               <Route
//                 path="/discover"
//                 element={
//                   isDevMode ? (
//                     <Discover key={user?._id || "guest"} />
//                   ) : (
//                     <PrivateRoute>
//                       <Discover key={user?._id || "guest"} />
//                     </PrivateRoute>
//                   )
//                 }
//               />
//               <Route
//                 path="/log"
//                 element={
//                   isDevMode ? (
//                     <LogWorkout key={user?._id || "guest"} />
//                   ) : (
//                     <PrivateRoute>
//                       <LogWorkout key={user?._id || "guest"} />
//                     </PrivateRoute>
//                   )
//                 }
//               />
//               <Route
//                 path="/activity"
//                 element={
//                   isDevMode ? (
//                     <Activity key={user?._id || "guest"} />
//                   ) : (
//                     <PrivateRoute>
//                       <Activity key={user?._id || "guest"} />
//                     </PrivateRoute>
//                   )
//                 }
//               />

//               <Route
//                 path="/profile"
//                 element={
//                   isDevMode ? (
//                     <Profile key={user?._id || "guest"} />
//                   ) : (
//                     <PrivateRoute>
//                       <Profile key={user?._id || "guest"} />
//                     </PrivateRoute>
//                   )
//                 }
//               />
//               <Route
//                 path="/profile/:userId"
//                 element={
//                   isDevMode ? (
//                     <Profile key={user?._id || "guest"} />
//                   ) : (
//                     <PrivateRoute>
//                       <Profile key={user?._id || "guest"} />
//                     </PrivateRoute>
//                   )
//                 }
//               />

//               <Route
//                 path="/workout/:workoutId"
//                 element={
//                   isDevMode ? (
//                     <WorkoutPost key={user?._id || "guest"} />
//                   ) : (
//                     <PrivateRoute>
//                       <WorkoutPost key={user?._id || "guest"} />
//                     </PrivateRoute>
//                   )
//                 }
//               />
//             </Route>

//             <Route
//               path="/edit-profile"
//               element={
//                 isDevMode ? (
//                   <EditProfile key={user?._id || "guest"} />
//                 ) : (
//                   <PrivateRoute>
//                     <EditProfile key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 )
//               }
//             />
//             <Route
//               path="/account-setting"
//               element={
//                 isDevMode ? (
//                   <AccountSetting key={user?._id || "guest"} />
//                 ) : (
//                   <PrivateRoute>
//                     <AccountSetting key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 )
//               }
//             />
//             <Route
//               path="/help"
//               element={
//                 isDevMode ? (
//                   <HelpCenter key={user?._id || "guest"} />
//                 ) : (
//                   <PrivateRoute>
//                     <HelpCenter key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 )
//               }
//             />
//             <Route
//               path="/privacy"
//               element={
//                 isDevMode ? (
//                   <PrivacyPolicy key={user?._id || "guest"} />
//                 ) : (
//                   <PrivateRoute>
//                     <PrivacyPolicy key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 )
//               }
//             />
//             <Route
//               path="/terms"
//               element={
//                 isDevMode ? (
//                   <TermsOfService key={user?._id || "guest"} />
//                 ) : (
//                   <PrivateRoute>
//                     <TermsOfService key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 )
//               }
//             />
//           </Routes>
//         </SocketProvider>
//       </BrowserRouter>
//     </ThemeProvider>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import LogWorkout from "./pages/LogWorkout";
import Activity from "./pages/Activity";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import ForgotPassword from "./pages/ForgotPassword";
import AccountSetting from "./pages/AccountSetting";
import HelpCenter from "./pages/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import WorkoutPost from "./pages/WorkoutPost";
import NotificationSettings from "./pages/NotificationSettings";

function App() {
  const { user } = useAuth();

  return (
    <ThemeProvider>
      <BrowserRouter>
        <SocketProvider>
          <Routes>
            {/* Public routes (no bottom nav) */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/settings/notifications"
              element={<NotificationSettings />}
            />

            {/* Protected routes (with bottom nav) */}
            <Route element={<Layout key={user?._id || "guest"} />}>
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <Home key={user?._id || "guest"} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/discover"
                element={
                  <PrivateRoute>
                    <Discover key={user?._id || "guest"} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/log"
                element={
                  <PrivateRoute>
                    <LogWorkout key={user?._id || "guest"} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <PrivateRoute>
                    <Activity key={user?._id || "guest"} />
                  </PrivateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile key={user?._id || "guest"} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <PrivateRoute>
                    <Profile key={user?._id || "guest"} />
                  </PrivateRoute>
                }
              />

              <Route
                path="/workout/:workoutId"
                element={
                  <PrivateRoute>
                    <WorkoutPost key={user?._id || "guest"} />
                  </PrivateRoute>
                }
              />
            </Route>

            <Route
              path="/edit-profile"
              element={
                <PrivateRoute>
                  <EditProfile key={user?._id || "guest"} />
                </PrivateRoute>
              }
            />
            <Route
              path="/account-setting"
              element={
                <PrivateRoute>
                  <AccountSetting key={user?._id || "guest"} />
                </PrivateRoute>
              }
            />
            <Route
              path="/help"
              element={
                <PrivateRoute>
                  <HelpCenter key={user?._id || "guest"} />
                </PrivateRoute>
              }
            />
            <Route
              path="/privacy"
              element={
                <PrivateRoute>
                  <PrivacyPolicy key={user?._id || "guest"} />
                </PrivateRoute>
              }
            />
            <Route
              path="/terms"
              element={
                <PrivateRoute>
                  <TermsOfService key={user?._id || "guest"} />
                </PrivateRoute>
              }
            />
          </Routes>
        </SocketProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
