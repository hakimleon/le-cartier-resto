/**
 * Convertit une chaîne Markdown en HTML (sans bibliothèque tierce)
 * Compatible Next.js / React (à utiliser avec dangerouslySetInnerHTML)
 */
export function renderMarkdown(md: string): string {
  if (!md) return "";

  // Échappement basique des caractères HTML
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // --- BLOC DE CODE ---
  html = html.replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>");

  // --- TITRES ---
  html = html
    .replace(/^###### (.*$)/gim, "<h6>$1</h6>")
    .replace(/^##### (.*$)/gim, "<h5>$1</h5>")
    .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // --- CITATIONS ---
  html = html.replace(/^\s*> (.*$)/gim, "<blockquote>$1</blockquote>");

  // --- LISTES NUMÉROTÉES ---
  // On traite les listes bloc par bloc
  html = html.replace(/(?:^\d+\.\s+.*\n?)+/gim, (match) => {
    const items = match.trim().split('\n').map(item => `<li>${item.replace(/^\d+\.\s+/, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // --- LISTES À PUCE ---
  // On traite les listes bloc par bloc
  html = html.replace(/(?:^[-*+]\s+.*\n?)+/gim, (match) => {
    const items = match.trim().split('\n').map(item => `<li>${item.replace(/^[-*+]\s+/, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // --- LIENS & IMAGES ---
  html = html
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, "<img alt='$1' src='$2' />")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, "<a href='$2'>$1</a>");

  // --- GRAS / ITALIQUE / CODE INLINE ---
  html = html
    .replace(/\*\*\*(.*?)\*\*\*/gim, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/`([^`]+)`/gim, "<code>$1</code>");

  // --- SÉPARATEURS HORIZONTAUX ---
  html = html.replace(/^---$/gim, "<hr />");

  // --- PARAGRAPHES ---
  // On découpe par saut de ligne, on filtre les lignes vides, et on entoure chaque ligne non traitée par <p>
  const blocks = html.split('\n').filter(line => line.trim() !== '');
  html = blocks.map(block => {
    if (block.startsWith('<') && block.endsWith('>')) {
      return block; // C'est déjà un bloc HTML (liste, titre, etc.)
    }
    return `<p>${block}</p>`;
  }).join('');

  // Nettoyage final
  html = html
    .replace(/<\/p><p>/g, "</p><p>") // S'assure qu'il n'y a pas d'espace entre les paragraphes
    .replace(/<p><(ul|ol|h\d|blockquote|pre|hr)/g, "<$1") // Retire le <p> avant un bloc
    .replace(/<\/(ul|ol|h\d|blockquote|pre|hr)><\/p>/g, "</$1>"); // Retire le </p> après un bloc

  return `<div class="prose prose-sm max-w-none text-muted-foreground">${html}</div>`;
}