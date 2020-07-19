import * as React from "react";
import { User } from "../types";
import { usersService } from "../services";

interface ISuccessAction {
  type: "success";
  payload: User;
}

interface ILogoutAction {
  type: "logout";
  payload?: undefined;
}

type IAction = ISuccessAction | ILogoutAction;

type Dispatch = (action: IAction) => void;
type State = { loggedIn: boolean; user?: User };
type AuthProviderProps = { children: React.ReactNode };

const AuthStateContext = React.createContext<State | undefined>(undefined);
const AuthDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

const localStorageUser = localStorage.getItem("user");
const initialState: State = {
  loggedIn: !!localStorageUser,
  user: localStorageUser ? JSON.parse(localStorageUser) : undefined,
};

function authReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "success":
      return {
        loggedIn: true,
        user: action.payload,
      };
    case "logout":
      return {
        loggedIn: false,
        user: undefined,
      };
    default:
      return state;
  }
}

function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = React.useReducer(authReducer, initialState);
  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
}

function useAuthState() {
  const context = React.useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error("must be used within a AuthProvider");
  }
  return context;
}

function useAuthDispatch() {
  const context = React.useContext(AuthDispatchContext);
  if (context === undefined) {
    throw new Error("must be used within a AuthProvider");
  }
  return context;
}

async function login(dispatch: Dispatch, email: string, password: string) {
  return usersService.login(email, password).then((user) => {
    dispatch({ type: "success", payload: user });
  });
}

async function update(
  dispatch: Dispatch,
  {
    firstName,
    lastName,
    email,
  }: { firstName: string; lastName: string; email: string }
) {
  return usersService
    .update({
      firstName,
      lastName,
      email,
    })
    .then((user) => {
      dispatch({ type: "success", payload: user });
    });
}

function logout(dispatch: Dispatch) {
  usersService.logout();
  dispatch({ type: "logout" });
}

export { AuthProvider, useAuthState, useAuthDispatch, login, logout, update };
