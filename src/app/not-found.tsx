import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Alert variant="default">
        <AlertCircleIcon />
        <AlertTitle>This page couldn't be found</AlertTitle>
      </Alert>
      <Button className="mt-2" asChild>
        <Link href="/">Return home</Link>
      </Button>
    </>
  );
}
