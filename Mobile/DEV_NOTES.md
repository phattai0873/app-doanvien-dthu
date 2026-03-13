# Developer Notes

## Temporary Login Bypass (2026-01-24)

To facilitate frontend development without a running backend or local network configuration, a temporary login bypass has been implemented.

### Implementation Details

1.  **`App.js`**:
    *   Added a local state `isLoggedIn` (default `false`).
    *   Conditional rendering:
        *   If `isLoggedIn === false`: Renders `LoginScreen`.
        *   If `isLoggedIn === true`: Renders `HomeScreen`.
    *   Passes an `onLogin` callback to `LoginScreen` which sets `isLoggedIn(true)`.

2.  **`src/screens/LoginScreen.js`**:
    *   Added `onLogin` prop.
    *   In `handleLogin`, the actual API call to `authService` is **commented out**.
    *   Instead, it simulates a network delay (1s) and calls `onLogin()`.
    *   Validation is also partially bypassed/commented out.

### How to Revert
To restore real authentication:
1.  In `App.js`, remove the `isLoggedIn` conditional and restore the original navigation (or implement proper React Navigation authentication flow).
2.  In `src/screens/LoginScreen.js`, uncomment the `authService.login` logic and basic validation in `handleLogin`.
3.  Ensure `src/services/api.js` points to a valid API server.
