import { Button } from '@/app/components/ui/button';
import { ToggleTheme } from '@/app/components/theme/toggletheme';

export default function Navbar() {
  return (
    <nav className="w-full bg-background py-4 px-6 flex items-center justify-between border-b">
      <div className="flex items-center space-x-4">
        <h1 className="text-4xl font-bold font-besley">thinkscape</h1>
        <p className="hidden md:block text-muted-foreground mt-3">
          convert your thoughts into structured logic graphs
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <ToggleTheme />
      </div>
    </nav>
  );
}
