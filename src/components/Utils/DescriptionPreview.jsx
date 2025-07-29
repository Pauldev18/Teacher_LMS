export function removeHtmlTags(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function DescriptionPreview({ description }) {
  const plainText = removeHtmlTags(description);
  const preview = plainText.length > 20 ? plainText.slice(0, 20) + "..." : plainText;

  return <p className="text-gray-600 text-sm mb-4">{preview}</p>;
}
