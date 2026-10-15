import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App, { getPageSchema, getPageSeo, ROUTES, setSsrPath } from "./App";

export { getPageSchema, getPageSeo, ROUTES };

export function render(pathname: string) {
  setSsrPath(pathname);
  return renderToString(
    <StrictMode>
      <App initialPath={pathname} />
    </StrictMode>,
  );
}
