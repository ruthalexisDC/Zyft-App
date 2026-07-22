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
// import WorkoutPost from "./pages/WorkoutPost";
// import NotificationSettings from "./pages/NotificationSettings";
// import WorkoutDetailPage from "./pages/WorkoutDetailPage";
// import VerifyEmail from "./pages/VerifyEmail";
// function App() {
//   const { user } = useAuth();

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
//             <Route
//               path="/settings/notifications"
//               element={<NotificationSettings />}
//             />
//             <Route path="/verify-email" element={<VerifyEmail />} />

//             {/* Protected routes (with bottom nav) */}
//             <Route element={<Layout key={user?._id || "guest"} />}>
//               <Route
//                 path="/home"
//                 element={
//                   <PrivateRoute>
//                     <Home key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 }
//               />
//               <Route
//                 path="/discover"
//                 element={
//                   <PrivateRoute>
//                     <Discover key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 }
//               />
//               <Route
//                 path="/log"
//                 element={
//                   <PrivateRoute>
//                     <LogWorkout key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 }
//               />
//               <Route
//                 path="/activity"
//                 element={
//                   <PrivateRoute>
//                     <Activity key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 }
//               />
//               <Route
//                 path="/profile"
//                 element={
//                   <PrivateRoute>
//                     <Profile key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 }
//               />
//               <Route
//                 path="/profile/:userId"
//                 element={
//                   <PrivateRoute>
//                     <Profile key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 }
//               />

//               {/* SOCIAL POST — respects, comments, single image */}
//               <Route
//                 path="/workout/:workoutId"
//                 element={
//                   <PrivateRoute>
//                     <WorkoutPost key={user?._id || "guest"} />
//                   </PrivateRoute>
//                 }
//               />

//               {/* WORKOUT PLAN DETAIL — exercises, sets, "Start Workout" */}
//               <Route
//                 path="/workout-plan/:workoutId"
//                 element={
//                   <PrivateRoute>
//                     <WorkoutDetailPage />
//                   </PrivateRoute>
//                 }
//               />
//             </Route>

//             {/* Other protected routes without bottom nav */}
//             <Route
//               path="/edit-profile"
//               element={
//                 <PrivateRoute>
//                   <EditProfile key={user?._id || "guest"} />
//                 </PrivateRoute>
//               }
//             />
//             <Route
//               path="/account-setting"
//               element={
//                 <PrivateRoute>
//                   <AccountSetting key={user?._id || "guest"} />
//                 </PrivateRoute>
//               }
//             />
//             <Route
//               path="/help"
//               element={
//                 <PrivateRoute>
//                   <HelpCenter key={user?._id || "guest"} />
//                 </PrivateRoute>
//               }
//             />
//             <Route
//               path="/privacy"
//               element={
//                 <PrivateRoute>
//                   <PrivacyPolicy key={user?._id || "guest"} />
//                 </PrivateRoute>
//               }
//             />
//             <Route
//               path="/terms"
//               element={
//                 <PrivateRoute>
//                   <TermsOfService key={user?._id || "guest"} />
//                 </PrivateRoute>
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
import WorkoutDetailPage from "./pages/WorkoutDetailPage.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import VerifyEmailConfirm from "./pages/VerifyEmailConfirm.jsx";
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
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route
              path="/verify-email/confirm"
              element={<VerifyEmailConfirm />}
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

              {/* SOCIAL POST — respects, comments, single image */}
              <Route
                path="/workout/:workoutId"
                element={
                  <PrivateRoute>
                    <WorkoutPost key={user?._id || "guest"} />
                  </PrivateRoute>
                }
              />

              {/* WORKOUT PLAN DETAIL — exercises, sets, "Start Workout" */}
              <Route
                path="/workout-plan/:workoutId"
                element={
                  <PrivateRoute>
                    <WorkoutDetailPage />
                  </PrivateRoute>
                }
              />
            </Route>

            {/* Other protected routes without bottom nav */}
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
