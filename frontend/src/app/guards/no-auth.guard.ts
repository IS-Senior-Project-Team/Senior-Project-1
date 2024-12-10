import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { currentUserProfile } from '../services/firebaseConnection';

export const adminGuard: CanActivateFn = async (route, state) => {
  let authSvc = inject(AuthService);
  let router = inject(Router);

  // Also could handle the redirect to admin dashboard from here??
  try {
    const currentUser = await currentUserProfile()
    if (authSvc.isLoggedIn() && currentUser?.isAdmin === true) {
      return true;
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

  // Also could handle the redirect to admin dashboard from here??
  if (authSvc.isLoggedIn()) {
    return true;
  } else {
    alert("You must be logged in to view this")
    router.navigate(['login'])
    return false;
  }
};

//FiX THE INCONSISTENCES WITH THIS TO USE SESSION STORAGE (TO GET ADMIN ROLE) INSTEAD SINCE UPON MANUAL REDIRECTS THE USER ROLE IS NOT GETTING PICKED UP

export const redirectIfLoggedIn: CanActivateFn = async (route, state) => {
  let authSvc = inject(AuthService)
  let router = inject(Router)

  try {
    const isLoggedIn = authSvc.isLoggedIn();
    console.log("from auth guard: ", isLoggedIn)
    const currentUser = await currentUserProfile(); // Fetch the current user profile
    console.log("from auth guard (user profile admin:", currentUser?.isAdmin)

    if (isLoggedIn) {
      if (currentUser?.isAdmin === true) {
        return router.navigate(['/admin-dashboard']); // Redirect to admin dashboard
      } else {
        return router.navigate(['case-management']); // Redirect to staff case management page
      }
    }
  } catch (error) {
    console.error('Error determining user role for redirection:', error);
  }

  return true; // Allow navigation if no redirect condition is met
};
