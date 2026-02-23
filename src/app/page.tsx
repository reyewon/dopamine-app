import { DopamineApp } from "@/components/DopamineApp";
import { Suspense } from "react";

function HomePageContent() {
  return <DopamineApp />;
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}

    