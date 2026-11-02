import { type ReactNode, createContext, useContext, useReducer } from "react";
import { User } from "../types";
import { usersService } from "../services";

type IAction =
  | { type: "success"; payload: User }
  | { type: "logout" }
  | { type: "getAll"; payload: User[] };
type Dispatch = (action: IAction) => void;
type State = {
  loggedIn: boolean;
  user?: User;
  userList: User[];
};
type UserProviderProps = {
  children: ReactNode;
};

const UserStateContext = createContext<State | undefined>(undefined);
const UserDispatchContext = createContext<Dispatch | undefined>(undefined);

export function UserReducer(state: State, action: IAction): State {
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

function UserProvider({ children }: Readonly<UserProviderProps>) {
  const localStorageUser = localStorage.getItem("user");
  const initialState: State = {
    loggedIn: !!localStorageUser,
    user: localStorageUser ? JSON.parse(localStorageUser) : undefined,
    userList: [],
  };

  const [state, dispatch] = useReducer(UserReducer, initialState);

  return (
    <UserStateContext.Provider value={state}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserStateContext.Provider>
  );
}

function useUserState() {
  const context = useContext(UserStateContext);

  if (context === undefined) {
    throw Error("must be used within a UserProvider");
  }

  return context;
}

function useUserDispatch() {
  const context = useContext(UserDispatchContext);

  if (context === undefined) {
    throw Error("must be used within a UserProvider");
  }

  return context;
}

function login(dispatch: Dispatch, email: string, password: string) {
  return usersService.login(email, password).then((user) => {
    dispatch({
      type: "success",
      payload: user,
    });
  });
}

function update(
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
      dispatch({
        type: "success",
        payload: user,
      });
    });
}

function logout(dispatch: Dispatch) {
  usersService.logout();
  usersService.markOidcLoggedOut();
  dispatch({
    type: "logout",
  });
}

export { UserProvider, useUserState, useUserDispatch, login, logout, update };
