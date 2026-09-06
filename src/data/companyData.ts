export type NavigationItem = { label: string; href: string };

export const navigation: NavigationItem[] = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Why Us", href: "#why-us" },
  { label: "Contact", href: "#contact" },
];

export type IconName = "code" | "cloud" | "design" | "layers";
export type Service = {
  icon: IconName;
  title: string;
  description: string;
};

export const services: Service[] = [
  {
    icon: "code",
    title: "Web Development",
    description:
      "Responsive websites and web applications.",
  },
  {
    icon: "cloud",
    title: "Cloud Solutions",
    description:
      "Cloud setup and migration for your business.",
  },
  {
    icon: "design",
    title: "UI/UX Design",
    description:
      "Simple, easy-to-use interfaces.",
  },
  {
    icon: "layers",
    title: "Digital Transformation",
    description:
      "Connected tools and fewer repetitive tasks.",
  },
];

export const benefits = [
  {
    title: "Clear communication",
    description:
      "Regular updates and clear explanations.",
  },
  {
    title: "Reliable development",
    description:
      "Maintainable code and careful testing.",
  },
  {
    title: "Built around your goals",
    description:
      "Practical solutions for your business needs.",
  },
];

export const statistics = [
  { value: "35+", label: "Projects completed" },
  { value: "18", label: "Businesses supported" },
  { value: "12+", label: "Years combined experience" },
  { value: "5", label: "Countries" },
];
