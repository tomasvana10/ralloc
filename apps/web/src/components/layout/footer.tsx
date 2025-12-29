import { Button } from "@web/components/ui/button";
import { Separator } from "@web/components/ui/separator";

export function Footer() {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="flex-1 overflow-hidden max-[400px]:hidden">
        <Separator className="w-full h-px" />
      </div>

      <div className="flex h-5 items-center text-sm">
        <Button variant="link" asChild>
          <a
            href="https://github.com/tomasvana10/ralloc"
            target="_blank"
            rel="noopener">
            Source
          </a>
        </Button>
        <Separator orientation="vertical" />
        <Button variant="link" asChild>
          <a
            href="https://github.com/tomasvana10/ralloc/issues"
            target="_blank"
            rel="noopener">
            Report a bug
          </a>
        </Button>
        <Separator orientation="vertical" />
        <Button variant="link" asChild>
          <a
            href="https://github.com/tomasvana10/ralloc/wiki"
            target="_blank"
            rel="noopener">
            Wiki
          </a>
        </Button>
      </div>

      <div className="flex-1 overflow-hidden max-[400px]:hidden">
        <Separator className="w-full" />
      </div>
    </div>
  );
}
