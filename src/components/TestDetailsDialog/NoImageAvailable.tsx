import noImage from "../../static/no-image.png";
import { styled } from "@mui/material/styles";

const Img = styled("img")({
  display: "block",
  marginLeft: "auto",
  marginRight: "auto",
  width: "50%",
});

export const NoImagePlaceholder = () => {
  return <Img src={noImage} alt="Not available" />;
};
