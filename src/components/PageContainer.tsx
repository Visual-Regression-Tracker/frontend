import type { ReactNode } from "react";
import { Container } from "@mui/material";
import { layout } from "../theme/tokens";

export const PageContainer = ({
  children,
  fill,
}: {
  children: ReactNode;
  fill?: boolean;
}) => (
  <Container
    maxWidth={false}
    sx={{
      maxWidth: layout.contentMaxWidth,
      py: layout.contentPaddingY,
      ...(fill && { height: "100%", display: "flex", flexDirection: "column" }),
    }}
  >
    {children}
  </Container>
);
