import profile from './data/profile.json'
import projects from './data/projects.json'
import skills from './data/skills.json'

export { profile, projects, skills }
export type Project = (typeof projects)[number]
