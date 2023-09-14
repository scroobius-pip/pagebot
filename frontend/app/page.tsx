
import React from 'react';
import { You } from '@/components/you';
import { Intro } from '@/components/intro';

import FeaturesSection from '@/components/features';
import Pricing from '@/components/pricing';
import Documentation from '@/components/documentation';

export default function Home() {
  return <>
    <Intro />
    <You />
    <FeaturesSection />
    <Pricing />
    <Documentation />
  </>

}


