export type NavigationItem = { label: string; href: string };

export const navigation: NavigationItem[] = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Tools", href: "#services" },
  { label: "Why Us", href: "#why-us" },
];

export type IconName = "code" | "cloud" | "design" | "layers";
export const benefits = [
  {
    title: "Clear communication",
    description: "Regular updates and clear explanations.",
  },
  {
    title: "Reliable development",
    description: "Maintainable code and careful testing.",
  },
  {
    title: "Built around your goals",
    description: "Practical solutions for your business needs.",
  },
];

export const statistics = [
  { value: "35+", label: "Projects completed" },
  { value: "18", label: "Businesses supported" },
  { value: "12+", label: "Years combined experience" },
  { value: "5", label: "Countries" },
];
