import type { ArticleFrontmatter, ProjectFrontmatter, ServiceFrontmatter } from "./types";
import { getShortDescription, processContentInDir } from "./utils";

export const featuredProjects = (
  await processContentInDir<ProjectFrontmatter, ProjectFrontmatter>(
    "projects",
    (data) => {
      const shortDescription = getShortDescription(
        data.frontmatter.description,
      );
      return {
        title: data.frontmatter.title,
        description: shortDescription,
        tags: data.frontmatter.tags,
        githubUrl: data.frontmatter.githubUrl,
        liveUrl: data.frontmatter.liveUrl,
        featured: data.frontmatter.featured,
        timestamp: data.frontmatter.timestamp,
        filename: `/projects/${data.frontmatter.filename}`,
      };
    },
  )
)
  .filter((project) => project.featured)
  .sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

export const featuredServices = (
  await processContentInDir<ServiceFrontmatter, ServiceFrontmatter>(
    "services",
    (data) => {
      const shortDescription = getShortDescription(
        data.frontmatter.description,
      );
      return {
        title: data.frontmatter.title,
        description: shortDescription,
        tags: data.frontmatter.tags,
        featured: data.frontmatter.featured,
        timestamp: data.frontmatter.timestamp,
        filename: `/services/${data.frontmatter.filename}`,
      };
    },
  )
)
  .filter((service) => service.featured)
  .sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

//export const featuredExperiences = (
//  await processContentInDir<ExperienceFrontmatter, ExperienceFrontmatter>(
//    "experiences",
//    (data) => {
//      const shortDescription = getShortDescription(
//        data.experiencematter.description,
//      );
//      return {
//        title: data.experiencematter.title,
//        description: shortDescription,
//        tags: data.experiencematter.tags,
//        githubUrl: data.experiencematter.githubUrl,
//        liveUrl: data.experiencematter.liveUrl,
//        featured: data.experiencematter.featured,
//        timestamp: data.experiencematter.timestamp,
//        filename: `/projects/${data.experiencematter.filename}`,
//      };
//    },
//  )
//)
//  .filter((experience) => experience.featured)
//  .sort((a, b) => {
//    const dateA = new Date(a.timestamp);
//    const dateB = new Date(b.timestamp);
//    return dateB.getTime() - dateA.getTime();
//  });

export const featuredArticles = (
    await processContentInDir<ArticleFrontmatter, ArticleFrontmatter>(
      "blog",
      (data) => {
        const shortDescription = getShortDescription(
          data.frontmatter.description,
        );
        return {
          title: data.frontmatter.title,
          description: shortDescription,
          tags: data.frontmatter.tags,
          time: data.frontmatter.time,
          featured: data.frontmatter.featured,
          timestamp: data.frontmatter.timestamp,
          filename: `/blog/${data.frontmatter.filename}`,
        };
      },
    )
  )
    .filter((project) => project.featured)
    .sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });
