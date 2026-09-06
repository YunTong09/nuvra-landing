export type NavigationItem = { label: string; href: string };
export const navigation: NavigationItem[] = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Why Us", href: "#why-us" },
  { label: "Contact", href: "#contact" },
];
export type IconName =
  "code" | "cloud" | "design" | "layers" | "arrow" | "check";
export type Service = {
  number: string;
  icon: IconName;
  title: string;
  description: string;
  detail: string;
};
export const services: Service[] = [
  {
    number: "01",
    icon: "code",
    title: "Web development",
    description:
      "Fast, accessible web applications that turn complex requirements into effortless experiences.",
    detail: "Built for the way you work",
  },
  {
    number: "02",
    icon: "cloud",
    title: "Cloud solutions",
    description:
      "Practical cloud architecture that keeps your business connected and ready for what comes next.",
    detail: "Room to grow, by design",
  },
  {
    number: "03",
    icon: "design",
    title: "UI/UX design",
    description:
      "Thoughtful digital experiences shaped around real people, clear journeys, and your business goals.",
    detail: "Clarity in every interaction",
  },
  {
    number: "04",
    icon: "layers",
    title: "Digital transformation",
    description:
      "Connect your tools, simplify everyday processes, and get more from the technology you already use.",
    detail: "Less friction. More progress.",
  },
];
export const benefits = [
  {
    title: "Your goals, our starting point",
    description:
      "We ask the right questions before writing the first line of code. Every decision connects back to your business.",
  },
  {
    title: "Built well. Built to last.",
    description:
      "Clean code, thoughtful testing, and security-conscious development make your next chapter easier.",
  },
  {
    title: "A team you can talk to",
    description:
      "Direct communication, regular demos, and clear next steps. You always know where your project stands.",
  },
];
export const statistics = [
  { value: "35+", label: "Projects delivered" },
  { value: "18", label: "Businesses supported" },
  { value: "12+", label: "Years of combined experience" },
  { value: "5", label: "Countries connected" },
];
