import NotFound from "~/components/NotFound";

export default function InvalidPage() {
  return <NotFound errorMessage="500: Invalid Parameters">
    The page you requested existed, but the parameters requested are invalid.
  </NotFound>;
}