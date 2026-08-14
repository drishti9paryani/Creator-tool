import { ProjectsHome } from "@/components/home/ProjectsHome";

// Server component wrapper: reads AI_PROVIDER server-side so the home page can
// show which mode the build is running in without exposing anything else about
// the environment (and without needing a NEXT_PUBLIC_ variable).
export default function Home() {
  const liveMode = (process.env.AI_PROVIDER ?? "mock") === "real";
  return <ProjectsHome liveMode={liveMode} />;
}
