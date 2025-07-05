import NotFound from "~/components/NotFound";

export default function PageNotFound() {
  return <NotFound errorMessage="404: Page not found">
    The page you were looking for was not found. Did you make a typo in the URL?
  </NotFound>;
}