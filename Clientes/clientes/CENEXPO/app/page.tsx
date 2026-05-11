import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Services } from "@/components/services";
import { Spaces } from "@/components/spaces";
import { CTA } from "@/components/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Spaces />
      <Services />
      <CTA />
    </>
  );
}
