import { Box, Skeleton } from "@mui/material";

export const SkeletonList = () => {
  const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return (
    <Box sx={{ height: 1, overflow: "auto" }}>
      {list.map((i) => (
        <Box key={i} sx={{ p: 0.2 }}>
          <Skeleton variant="rectangular" height={80} />
        </Box>
      ))}
    </Box>
  );
};
