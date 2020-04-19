import React, { useEffect, useState } from "react";
import { Grid, Typography, Card, CardActionArea } from "@material-ui/core";
import { projectsService } from "../services/projects.service";
import { Project } from "../types";
import { Link } from "react-router-dom";
import { routes } from "../constants";

const ProjectsListPage = () => {
    const [projectList, setProjectList] = useState([] as Project[]);

    useEffect(() => {
        projectsService.getAll().then(projects => setProjectList(projects))
    }, []);

    return (
        <Grid container direction='column' spacing={2}>
            {projectList.map(project => (
                <Grid item key={project.id}>
                    <Card>
                        <CardActionArea component={Link} to={`${routes.PROJECT}/${project.id}`}>
                            <Typography>Name: {project.name}</Typography>
                            <Typography>Updated: {project.updatedAt}</Typography>
                        </CardActionArea>

                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default ProjectsListPage;
