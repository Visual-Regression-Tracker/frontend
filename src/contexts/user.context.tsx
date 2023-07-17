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

interface IGetAllAction {
  type: "getAll";
  payload: User[];
}

type IAction = ISuccessAction | ILogoutAction | IGetAllAction;

type Dispatch = (action: IAction) => void;
type State = { loggedIn: boolean; user?: User; userList: User[] };
type UserProviderProps = { children: React.ReactNode };

const UserStateContext = React.createContext<State | undefined>(undefined);
const UserDispatchContext = React.createContext<Dispatch | undefined>(
  undefined,
);

function UserReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "success":
      return {
        ...state,
        loggedIn: true,
        user: action.payload,
      };
    case "logout":
      return {
        ...state,
        loggedIn: false,
        user: undefined,
      };
    case "getAll":
      return {
        ...state,
        userList: action.payload,
      };
    default:
      return state;
  }
}

function UserProvider({ children }: UserProviderProps) {
  const localStorageUser = localStorage.getItem("user");
  const initialState: State = {
    loggedIn: !!localStorageUser,
    user: localStorageUser ? JSON.parse(localStorageUser) : undefined,
    userList: [],
  };

  const [state, dispatch] = React.useReducer(UserReducer, initialState);
  return (
    <UserStateContext.Provider value={state}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserStateContext.Provider>
  );
}

function useUserState() {
  const context = React.useContext(UserStateContext);
  if (context === undefined) {
    throw new Error("must be used within a UserProvider");
  }
  return context;
}

function useUserDispatch() {
  const context = React.useContext(UserDispatchContext);
  if (context === undefined) {
    throw new Error("must be used within a UserProvider");
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
  }: { firstName: string; lastName: string; email: string },
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

export { UserProvider, useUserState, useUserDispatch, login, logout, update };
