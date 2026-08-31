import { useEffect } from "react";

function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} | IDX Property Search`;
  }, [title]);
}

export default useDocumentTitle;
