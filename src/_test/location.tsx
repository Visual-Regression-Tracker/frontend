import { screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";

export const CurrentSearch = () => {
  const { pathname, search } = useLocation();
  return (
    <div data-testid="search" data-pathname={pathname}>
      {search}
    </div>
  );
};

export const currentSearch = () => screen.getByTestId("search").textContent;

export const currentLocation = () => {
  const element = screen.getByTestId("search");
  return `${element.dataset.pathname}${element.textContent}`;
};
