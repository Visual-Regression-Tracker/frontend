import { Container } from "@mui/material";
import { BarChartOutlined } from "@mui/icons-material";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";

const ProjectStatisticsPage = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <PageHeader title="Statistics" />
    <EmptyState
      icon={<BarChartOutlined />}
      title="Statistics are not available yet"
      description="Build and review statistics for this project will show up here."
    />
  </Container>
);

export default ProjectStatisticsPage;
