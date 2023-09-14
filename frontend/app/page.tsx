import { LogoText, Logo } from '@/components/icons'
import { Cat, DatabaseIcon, GoalIcon, HeartHandshakeIcon, SparkleIcon } from 'lucide-react'
import { Snippet } from '@nextui-org/snippet'
import { Button } from '@nextui-org/button';
import { textBlack, textGrey } from '@/components/primitives';
import React from 'react';
import { You } from '@/components/you';
import { Intro } from '@/components/intro';
import { Section } from '@/components/section';
import { SectionIconTitle } from '@/components/SectionIconTitle';
import { Card } from '@/components/Card';
import { CTA } from '@/components/CTA';
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


