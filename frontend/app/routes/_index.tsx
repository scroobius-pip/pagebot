import { Button, Card, CardHeader, Image } from '@nextui-org/react';
import type { V2_MetaFunction } from "@remix-run/cloudflare";

export const meta: V2_MetaFunction = () => {

  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className='p-12 bg-neutral-600 rounded-xl'>

      <Button color='primary' size="lg">
        Large
      </Button>
    </div>
  );
}
