import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';


export const adminGuard: CanActivateFn = async (route, state) => {
  let authSvc = inject(AuthService);
  let router = inject(Router);

  const loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser") || "{}"); // TODO: Turn this into a method to avoid duplicate declarations

  try {
    if (loggedInUser?.isAdmin) {
      return true; // Allow navigation
    } else {
      alert("You must be logged in as an admin to view this")
      router.navigate(['login'])
      return false;
    }
  } catch (error) {
    console.error("Error checking admin access:", error);
    router.navigate(['login']);
    return false;
  }
};

export const noAuthGuard: CanActivateFn = (route, state) => {
  let authSvc = inject(AuthService);
  let router = inject(Router);

  try {
    if (authSvc.isLoggedIn()) {
      return true; // Allow navigation
    } else {
      alert("You must be logged in to view this")
      router.navigate(['login'])
      return false;
    }
  } catch (error) {
    console.error("Error checking staff auth access:", error);
    router.navigate(['login']);
    return false;
  };
}

export const redirectIfLoggedIn: CanActivateFn = async (route, state) => {
  let authSvc = inject(AuthService)
  let router = inject(Router)
  const loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser") || "{}");

  try {
    if (loggedInUser?.isAdmin) {
      alert("You are already logged in!")
      return router.createUrlTree(['/admin-dashboard']); // Redirect to admin dash
    } else if (authSvc.isLoggedIn()) {
      alert("You are already logged in!")
      return router.createUrlTree(['/case-management']); // Redirect to cases page
    }
  } catch (err) {
    console.error("Error:", err)
  }
  return true; // Allow navigation to the login page if not logged in
};