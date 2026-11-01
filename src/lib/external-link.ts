export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function getExternalLinkProps(href: string): {
  target?: "_blank";
  rel?: string;
} {
  if (!isExternalHref(href)) return {};
  return { target: "_blank", rel: "noopener noreferrer" };
}
